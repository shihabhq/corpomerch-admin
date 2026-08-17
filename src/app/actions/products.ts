"use server";

import { revalidatePath } from "next/cache";
import { Prisma } from "@prisma/client";

import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { productFormSchema, type ProductFormValues } from "@/lib/validation";

/**
 * Every mutation here follows the same shape:
 *   assertAdmin() -> zod parse -> $transaction -> recomputeProductPricing()
 *   -> revalidatePath() -> notify the storefront.
 *
 * Never throw a raw Prisma error at the UI; P2002 becomes a field message.
 */

export type ActionResult<T = void> =
  | { ok: true; data: T }
  | { ok: false; error: string; field?: string };

const D = (n: number) => new Prisma.Decimal(n);
const nullableD = (n: number | null | undefined) =>
  n === null || n === undefined ? null : new Prisma.Decimal(n);

/** Ordered, comma-joined chosen option-value ids. Must match the storefront. */
function buildSignature(
  parts: { position: number; optionValueId: string }[],
): string {
  return [...parts]
    .sort((a, b) => a.position - b.position)
    .map((p) => p.optionValueId)
    .join(",");
}

/**
 * Recompute the denormalised pricing summary the storefront's listing pages
 * read. MUST run after any change to skus, tiers, moq or pricingMode, or the
 * site shows stale "From ৳X" figures.
 */
export async function recomputeProductPricing(productId: string) {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      skus: {
        where: { isActive: true, deletedAt: null },
        include: { priceTiers: true },
      },
    },
  });
  if (!product) return;

  const prices: number[] = [];
  const moqs: number[] = [];

  for (const sku of product.skus) {
    if (sku.priceOnRequest || sku.priceTiers.length === 0) continue;
    for (const tier of sku.priceTiers) prices.push(tier.unitPrice.toNumber());
    const lowest = Math.min(...sku.priceTiers.map((t) => t.minQty.toNumber()));
    moqs.push(sku.moq?.toNumber() ?? product.moq?.toNumber() ?? lowest);
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      minUnitPrice: prices.length ? D(Math.min(...prices)) : null,
      maxUnitPrice: prices.length ? D(Math.max(...prices)) : null,
      effectiveMoq: moqs.length ? D(Math.min(...moqs)) : product.moq,
    },
  });
}

/** Tell the storefront to drop its ISR cache. Never let this break a save. */
async function notifyStorefront(slug?: string) {
  const url = process.env.STOREFRONT_URL;
  const secret = process.env.REVALIDATE_SECRET;
  if (!url || !secret) return;

  const paths = ["/", "/products", "/sitemap.xml"];
  if (slug) paths.push(`/products/${slug}`);

  try {
    await fetch(`${url}/api/revalidate`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({ paths }),
      signal: AbortSignal.timeout(5000),
    });
  } catch (error) {
    console.warn("[revalidate] storefront did not respond", error);
  }
}

// ─── Save (create or update) ─────────────────────────────────────────────────

export async function saveProduct(
  input: ProductFormValues,
): Promise<ActionResult<{ id: string; slug: string }>> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const parsed = productFormSchema.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return {
      ok: false,
      error: first?.message ?? "That product isn't valid yet.",
      field: first?.path.join("."),
    };
  }
  const data = parsed.data;

  try {
    const productId = await prisma.$transaction(async (tx) => {
      // ── Product row ──
      const base = {
        name: data.name,
        slug: data.slug,
        subtitle: data.subtitle || null,
        shortDescription: data.shortDescription || null,
        description: data.description || null,
        specs: data.specs as unknown as Prisma.InputJsonValue,
        tags: data.tags,
        unit: data.unit,
        unitLabel: data.unitLabel || null,
        qtyStep: D(data.qtyStep),
        moq: nullableD(data.moq),
        pricingMode: data.pricingMode,
        leadTimeDaysMin: data.leadTimeDaysMin ?? null,
        leadTimeDaysMax: data.leadTimeDaysMax ?? null,
        isFeatured: data.isFeatured,
        badgeText: data.badgeText || null,
        status: data.status,
        sortOrder: data.sortOrder,
        seoTitle: data.seoTitle || null,
        seoDescription: data.seoDescription || null,
      };

      const product = data.id
        ? await tx.product.update({
            where: { id: data.id },
            data: {
              ...base,
              publishedAt:
                data.status === "PUBLISHED" ? new Date() : undefined,
            },
          })
        : await tx.product.create({
            data: {
              ...base,
              publishedAt: data.status === "PUBLISHED" ? new Date() : null,
            },
          });

      // ── Categories ──
      await tx.productCategory.deleteMany({ where: { productId: product.id } });
      await tx.productCategory.createMany({
        data: data.categoryIds.map((categoryId, i) => ({
          productId: product.id,
          categoryId,
          isPrimary: categoryId === data.primaryCategoryId,
          sortOrder: i,
        })),
      });

      // ── Options and values ──
      const keptOptionIds: string[] = [];
      // `${optionName}:${valueCode}` -> option value id
      const valueIds = new Map<string, string>();
      const optionMeta = new Map<string, { id: string; position: number }>();

      for (const option of data.options) {
        const row = await tx.productOption.upsert({
          where: {
            productId_position: { productId: product.id, position: option.position },
          },
          create: {
            productId: product.id,
            position: option.position,
            name: option.name,
            helpText: option.helpText || null,
            displayAs: option.displayAs,
          },
          update: {
            name: option.name,
            helpText: option.helpText || null,
            displayAs: option.displayAs,
          },
        });
        keptOptionIds.push(row.id);
        optionMeta.set(option.name, { id: row.id, position: option.position });

        const keptValueIds: string[] = [];
        for (const [i, value] of option.values.entries()) {
          const valueRow = await tx.productOptionValue.upsert({
            where: {
              optionId_valueCode: { optionId: row.id, valueCode: value.valueCode },
            },
            create: {
              optionId: row.id,
              label: value.label,
              valueCode: value.valueCode,
              swatchHex: value.swatchHex || null,
              description: value.description || null,
              sortOrder: i,
              isDefault: value.isDefault,
            },
            update: {
              label: value.label,
              swatchHex: value.swatchHex || null,
              description: value.description || null,
              sortOrder: i,
              isDefault: value.isDefault,
            },
          });
          keptValueIds.push(valueRow.id);
          valueIds.set(`${option.name}:${value.valueCode}`, valueRow.id);
        }

        await tx.productOptionValue.deleteMany({
          where: { optionId: row.id, id: { notIn: keptValueIds } },
        });
      }

      await tx.productOption.deleteMany({
        where: { productId: product.id, id: { notIn: keptOptionIds } },
      });

      // ── Images ──
      // Cleared first so primaryImageId never dangles.
      await tx.product.update({
        where: { id: product.id },
        data: { primaryImageId: null },
      });
      await tx.productImage.deleteMany({ where: { productId: product.id } });

      const axis1 = data.options.find((o) => o.position === 1);
      let primaryImageId: string | null = null;

      for (const [i, image] of data.images.entries()) {
        const optionValueId =
          image.optionValueCode && axis1
            ? (valueIds.get(`${axis1.name}:${image.optionValueCode}`) ?? null)
            : null;

        const created = await tx.productImage.create({
          data: {
            productId: product.id,
            optionValueId,
            storagePath: image.storagePath || null,
            externalUrl: image.storagePath ? null : image.externalUrl || null,
            alt: image.alt,
            width: image.width ?? null,
            height: image.height ?? null,
            blurDataUrl: image.blurDataUrl || null,
            sortOrder: i,
          },
        });
        if (image.isPrimary) primaryImageId = created.id;
        primaryImageId ??= created.id;
      }

      if (primaryImageId) {
        await tx.product.update({
          where: { id: product.id },
          data: { primaryImageId },
        });
      }

      // ── SKUs, links and tiers ──
      const keptSkuIds: string[] = [];

      for (const [i, sku] of data.skus.entries()) {
        const parts = Object.entries(sku.valueCodes).map(([name, code]) => {
          const meta = optionMeta.get(name)!;
          return {
            optionId: meta.id,
            position: meta.position,
            optionValueId: valueIds.get(`${name}:${code}`)!,
          };
        });
        const optionSignature = buildSignature(parts);

        const label =
          data.options
            .slice()
            .sort((a, b) => a.position - b.position)
            .map((o) => {
              const code = sku.valueCodes[o.name];
              return o.values.find((v) => v.valueCode === code)?.label;
            })
            .filter(Boolean)
            .join(" / ") || null;

        const row = await tx.sku.upsert({
          where: {
            productId_optionSignature: {
              productId: product.id,
              optionSignature,
            },
          },
          create: {
            productId: product.id,
            skuCode: sku.skuCode || null,
            label,
            isDefault: parts.length === 0,
            isActive: sku.isActive,
            priceOnRequest: sku.priceOnRequest,
            moq: nullableD(sku.moq),
            optionSignature,
            sortOrder: i,
          },
          update: {
            skuCode: sku.skuCode || null,
            label,
            isDefault: parts.length === 0,
            isActive: sku.isActive,
            priceOnRequest: sku.priceOnRequest,
            moq: nullableD(sku.moq),
            sortOrder: i,
            deletedAt: null,
          },
        });
        keptSkuIds.push(row.id);

        await tx.skuOptionValue.deleteMany({ where: { skuId: row.id } });
        if (parts.length > 0) {
          await tx.skuOptionValue.createMany({
            data: parts.map((p) => ({
              skuId: row.id,
              optionId: p.optionId,
              optionValueId: p.optionValueId,
            })),
          });
        }

        await tx.priceTier.deleteMany({ where: { skuId: row.id } });
        if (sku.tiers.length > 0) {
          await tx.priceTier.createMany({
            data: sku.tiers.map((t) => ({
              skuId: row.id,
              minQty: D(t.minQty),
              unitPrice: D(t.unitPrice),
              compareAtPrice: nullableD(t.compareAtPrice),
              note: t.note || null,
            })),
          });
        }
      }

      // Soft-delete removed SKUs. InquiryItem rows reference them, so a hard
      // delete would rewrite history.
      await tx.sku.updateMany({
        where: { productId: product.id, id: { notIn: keptSkuIds } },
        data: { isActive: false, deletedAt: new Date() },
      });

      return product.id;
    });

    await recomputeProductPricing(productId);

    revalidatePath("/products");
    revalidatePath(`/products/${productId}`);
    await notifyStorefront(data.slug);

    return { ok: true, data: { id: productId, slug: data.slug } };
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const target = (error.meta?.target as string[] | undefined)?.join(", ") ?? "";
      if (target.includes("slug")) {
        return { ok: false, error: "That slug is already in use.", field: "slug" };
      }
      if (target.includes("sku_code")) {
        return {
          ok: false,
          error: "One of those SKU codes is already used by another product.",
          field: "skus",
        };
      }
      return { ok: false, error: "That value must be unique." };
    }

    console.error("[saveProduct]", error);
    return { ok: false, error: "Could not save. Please try again." };
  }
}

// ─── List-screen actions ─────────────────────────────────────────────────────

export async function setProductStatus(
  ids: string[],
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED",
): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: {
      status,
      ...(status === "PUBLISHED" ? { publishedAt: new Date() } : {}),
    },
  });

  revalidatePath("/products");
  await notifyStorefront();
  return { ok: true, data: undefined };
}

export async function deleteProducts(ids: string[]): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  // Soft delete — inquiry history references these rows.
  await prisma.product.updateMany({
    where: { id: { in: ids } },
    data: { deletedAt: new Date(), status: "ARCHIVED" },
  });

  revalidatePath("/products");
  await notifyStorefront();
  return { ok: true, data: undefined };
}

export async function duplicateProduct(
  id: string,
): Promise<ActionResult<{ id: string }>> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const source = await prisma.product.findUnique({
    where: { id },
    include: {
      categories: true,
      options: { include: { values: true } },
      images: true,
      skus: { include: { optionValues: true, priceTiers: true } },
    },
  });
  if (!source) return { ok: false, error: "Product not found." };

  const suffix = Date.now().toString(36).slice(-4);

  try {
    const copy = await prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          slug: `${source.slug}-copy-${suffix}`,
          name: `${source.name} (copy)`,
          subtitle: source.subtitle,
          shortDescription: source.shortDescription,
          description: source.description,
          specs: source.specs as Prisma.InputJsonValue,
          tags: source.tags,
          unit: source.unit,
          unitLabel: source.unitLabel,
          qtyStep: source.qtyStep,
          moq: source.moq,
          pricingMode: source.pricingMode,
          leadTimeDaysMin: source.leadTimeDaysMin,
          leadTimeDaysMax: source.leadTimeDaysMax,
          badgeText: source.badgeText,
          sortOrder: source.sortOrder,
          seoTitle: source.seoTitle,
          seoDescription: source.seoDescription,
          status: "DRAFT",
        },
      });

      await tx.productCategory.createMany({
        data: source.categories.map((c) => ({
          productId: product.id,
          categoryId: c.categoryId,
          isPrimary: c.isPrimary,
          sortOrder: c.sortOrder,
        })),
      });

      const valueIdMap = new Map<string, string>();
      for (const option of source.options) {
        const newOption = await tx.productOption.create({
          data: {
            productId: product.id,
            position: option.position,
            name: option.name,
            helpText: option.helpText,
            displayAs: option.displayAs,
          },
        });
        for (const value of option.values) {
          const newValue = await tx.productOptionValue.create({
            data: {
              optionId: newOption.id,
              label: value.label,
              valueCode: value.valueCode,
              swatchHex: value.swatchHex,
              description: value.description,
              sortOrder: value.sortOrder,
              isDefault: value.isDefault,
            },
          });
          valueIdMap.set(value.id, newValue.id);
        }
      }

      for (const image of source.images) {
        await tx.productImage.create({
          data: {
            productId: product.id,
            optionValueId: image.optionValueId
              ? (valueIdMap.get(image.optionValueId) ?? null)
              : null,
            storagePath: image.storagePath,
            externalUrl: image.externalUrl,
            alt: image.alt,
            width: image.width,
            height: image.height,
            blurDataUrl: image.blurDataUrl,
            sortOrder: image.sortOrder,
          },
        });
      }

      for (const sku of source.skus) {
        const parts = sku.optionValues.map((ov) => ({
          optionValueId: valueIdMap.get(ov.optionValueId)!,
          position:
            source.options.find((o) => o.id === ov.optionId)?.position ?? 1,
          optionId: ov.optionId,
        }));

        const newSku = await tx.sku.create({
          data: {
            productId: product.id,
            // skuCode is globally unique, so a copy must not reuse it.
            skuCode: sku.skuCode ? `${sku.skuCode}-${suffix}` : null,
            label: sku.label,
            isDefault: sku.isDefault,
            isActive: sku.isActive,
            priceOnRequest: sku.priceOnRequest,
            moq: sku.moq,
            optionSignature: buildSignature(parts),
            sortOrder: sku.sortOrder,
          },
        });

        // The option ids changed with the copy; look them up fresh.
        const newOptions = await tx.productOption.findMany({
          where: { productId: product.id },
          select: { id: true, position: true },
        });
        const optionByPosition = new Map(
          newOptions.map((o) => [o.position, o.id]),
        );

        if (parts.length > 0) {
          await tx.skuOptionValue.createMany({
            data: parts.map((p) => ({
              skuId: newSku.id,
              optionId: optionByPosition.get(p.position)!,
              optionValueId: p.optionValueId,
            })),
          });
        }

        if (sku.priceTiers.length > 0) {
          await tx.priceTier.createMany({
            data: sku.priceTiers.map((t) => ({
              skuId: newSku.id,
              minQty: t.minQty,
              unitPrice: t.unitPrice,
              compareAtPrice: t.compareAtPrice,
              note: t.note,
            })),
          });
        }
      }

      return product;
    });

    await recomputeProductPricing(copy.id);
    revalidatePath("/products");
    return { ok: true, data: { id: copy.id } };
  } catch (error) {
    console.error("[duplicateProduct]", error);
    return { ok: false, error: "Could not duplicate that product." };
  }
}
