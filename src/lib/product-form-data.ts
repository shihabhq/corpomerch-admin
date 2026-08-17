import "server-only";

import { prisma } from "@/lib/prisma";
import type { CategoryOption } from "@/components/products/ProductForm";
import type { ProductFormValues } from "@/lib/validation";

/** Categories for the picker, flattened with their parent for context. */
export async function getCategoryOptions(): Promise<CategoryOption[]> {
  const rows = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: { sortOrder: "asc" },
    select: {
      id: true,
      name: true,
      parent: { select: { name: true } },
    },
  });
  return rows.map((c) => ({
    id: c.id,
    name: c.name,
    parentName: c.parent?.name ?? null,
  }));
}

export function emptyProduct(): ProductFormValues {
  return {
    name: "",
    slug: "",
    subtitle: "",
    categoryIds: [],
    primaryCategoryId: "",
    tags: [],
    unit: "PC",
    unitLabel: "",
    qtyStep: 1,
    moq: null,
    leadTimeDaysMin: null,
    leadTimeDaysMax: null,
    isFeatured: false,
    badgeText: "",
    status: "DRAFT",
    sortOrder: 0,
    pricingMode: "TIERED",
    shortDescription: "",
    description: "",
    specs: [],
    images: [],
    options: [],
    // A product always has at least one variant — the implicit default SKU.
    skus: [
      {
        skuCode: "",
        valueCodes: {},
        moq: null,
        priceOnRequest: false,
        isActive: true,
        tiers: [],
      },
    ],
    seoTitle: "",
    seoDescription: "",
  };
}

/** Load a product into the exact shape the form expects. */
export async function getProductFormValues(
  id: string,
): Promise<ProductFormValues | null> {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      categories: true,
      options: {
        orderBy: { position: "asc" },
        include: { values: { orderBy: { sortOrder: "asc" } } },
      },
      images: { orderBy: { sortOrder: "asc" } },
      skus: {
        where: { deletedAt: null },
        orderBy: { sortOrder: "asc" },
        include: {
          optionValues: {
            include: {
              option: { select: { name: true } },
              optionValue: { select: { valueCode: true } },
            },
          },
          priceTiers: { orderBy: { minQty: "asc" } },
        },
      },
    },
  });

  if (!product) return null;

  const axis1 = product.options.find((o) => o.position === 1);
  const valueCodeById = new Map(
    product.options.flatMap((o) => o.values.map((v) => [v.id, v.valueCode])),
  );

  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    subtitle: product.subtitle ?? "",
    categoryIds: product.categories.map((c) => c.categoryId),
    primaryCategoryId:
      product.categories.find((c) => c.isPrimary)?.categoryId ??
      product.categories[0]?.categoryId ??
      "",
    tags: product.tags,
    unit: product.unit,
    unitLabel: product.unitLabel ?? "",
    qtyStep: product.qtyStep.toNumber(),
    moq: product.moq?.toNumber() ?? null,
    leadTimeDaysMin: product.leadTimeDaysMin,
    leadTimeDaysMax: product.leadTimeDaysMax,
    isFeatured: product.isFeatured,
    badgeText: product.badgeText ?? "",
    status: product.status,
    sortOrder: product.sortOrder,
    pricingMode: product.pricingMode,
    shortDescription: product.shortDescription ?? "",
    description: product.description ?? "",
    specs: Array.isArray(product.specs)
      ? (product.specs as unknown as ProductFormValues["specs"])
      : [],
    images: product.images.map((image) => ({
      id: image.id,
      storagePath: image.storagePath,
      externalUrl: image.externalUrl,
      alt: image.alt,
      width: image.width,
      height: image.height,
      blurDataUrl: image.blurDataUrl,
      optionValueCode:
        image.optionValueId && axis1
          ? (valueCodeById.get(image.optionValueId) ?? null)
          : null,
      isPrimary: image.id === product.primaryImageId,
    })),
    options: product.options.map((option) => ({
      id: option.id,
      position: option.position as 1 | 2 | 3,
      name: option.name,
      helpText: option.helpText ?? "",
      displayAs: option.displayAs,
      values: option.values.map((value) => ({
        id: value.id,
        label: value.label,
        valueCode: value.valueCode,
        swatchHex: value.swatchHex ?? "",
        description: value.description ?? "",
        isDefault: value.isDefault,
      })),
    })),
    skus: product.skus.map((sku) => ({
      id: sku.id,
      skuCode: sku.skuCode ?? "",
      valueCodes: Object.fromEntries(
        sku.optionValues.map((ov) => [ov.option.name, ov.optionValue.valueCode]),
      ),
      moq: sku.moq?.toNumber() ?? null,
      priceOnRequest: sku.priceOnRequest,
      isActive: sku.isActive,
      tiers: sku.priceTiers.map((tier) => ({
        minQty: tier.minQty.toNumber(),
        unitPrice: tier.unitPrice.toNumber(),
        compareAtPrice: tier.compareAtPrice?.toNumber() ?? null,
        note: tier.note ?? "",
      })),
    })),
    seoTitle: product.seoTitle ?? "",
    seoDescription: product.seoDescription ?? "",
  };
}
