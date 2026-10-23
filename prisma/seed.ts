/**
 * CorpoMerch catalogue seed — idempotent, safe to re-run.
 *
 *   npm run seed
 *
 * What it does:
 *   1. Converts every PNG in corpomerch-client/public/Product Gallery/ to WebP
 *      and generates a blur placeholder.
 *   2. Uploads them to the Supabase `product-images` bucket. If
 *      SUPABASE_SECRET_KEY is not set it writes them to
 *      corpomerch-client/public/products/ instead and records them as
 *      `externalUrl`, so the site works end to end without the key. Add the key
 *      and re-run to migrate the images into Storage.
 *   3. Upserts categories, products, options, SKUs, price tiers and images.
 *   4. Recomputes the denormalised pricing columns.
 *   5. Writes docs/missing-images.json and docs/missing-prices.json.
 *
 * Re-running produces identical row counts: everything keys off a natural
 * unique (slug, sku code, option value code, storage path).
 */

import "dotenv/config";

import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { createClient } from "@supabase/supabase-js";
import { Prisma, PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import sharp from "sharp";

import { categories } from "./seed-data/categories";
import { connectCategory, connectPlus } from "./seed-data/connect";
import { faqs, siteSettings } from "./seed-data/content";
import { portfolioItems } from "./seed-data/portfolio";
import { products } from "./seed-data/products";
import type { SeedProduct, SeedSku } from "./seed-data/types";

// ─── Paths ───────────────────────────────────────────────────────────────────

const ADMIN_ROOT = path.resolve(__dirname, "..");
const CLIENT_ROOT = path.resolve(ADMIN_ROOT, "..", "corpomerch-client");
const SOURCE_DIR = path.join(CLIENT_ROOT, "public", "Product Gallery");
const PORTFOLIO_SOURCE_DIR = path.join(CLIENT_ROOT, "public", "portfolio");
const LOCAL_FALLBACK_DIR = path.join(CLIENT_ROOT, "public", "products");
const DOCS_DIR = path.join(ADMIN_ROOT, "..", "docs");

const BUCKET = "product-images";
const SITE_BUCKET = "site-assets";
const WEBP_QUALITY = 82;
const WEBP_WIDTH = 1000;
/** Portfolio shots are photographs, so they carry a little more detail. */
const PORTFOLIO_WIDTH = 1400;

// ─── Clients ─────────────────────────────────────────────────────────────────

function makePrisma() {
  const raw = process.env.DIRECT_URL ?? process.env.DATABASE_URL;
  if (!raw) throw new Error("DIRECT_URL / DATABASE_URL not set");
  const url = new URL(raw);
  url.searchParams.delete("sslmode");
  return new PrismaClient({
    adapter: new PrismaPg({
      connectionString: url.toString(),
      ssl: { rejectUnauthorized: false },
    }),
  });
}

const prisma = makePrisma();

const secretKey = process.env.SUPABASE_SECRET_KEY?.trim();
const supabase =
  secretKey && process.env.NEXT_PUBLIC_SUPABASE_URL
    ? createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, secretKey, {
        auth: { persistSession: false },
      })
    : null;

const USING_STORAGE = supabase !== null;

/**
 * Safe by default: the seed creates and updates what it owns, and never deletes
 * or retires anything a human added through the admin panel.
 *
 *   npm run seed              safe (default)
 *   npm run seed -- --force   clean bootstrap; discards admin changes
 */
const FORCE = process.argv.includes("--force");

// ─── Logging ─────────────────────────────────────────────────────────────────

const log = {
  step: (m: string) => console.log(`\n\x1b[1m▸ ${m}\x1b[0m`),
  ok: (m: string) => console.log(`  \x1b[32m✓\x1b[0m ${m}`),
  info: (m: string) => console.log(`  \x1b[2m·\x1b[0m ${m}`),
  warn: (m: string) => console.log(`  \x1b[33m!\x1b[0m ${m}`),
};

const D = (n: number) => new Prisma.Decimal(n);

// ─── Image pipeline ──────────────────────────────────────────────────────────

interface ProcessedImage {
  /** Set when the file lives in Supabase Storage. */
  storagePath: string | null;
  /** Set when the file was written to the client's public folder instead. */
  externalUrl: string | null;
  width: number;
  height: number;
  blurDataUrl: string;
}

const imageCache = new Map<string, ProcessedImage>();

async function processImage(
  sourceName: string,
  productSlug: string,
  index: number,
): Promise<ProcessedImage> {
  const cacheKey = `${productSlug}/${sourceName}`;
  const cached = imageCache.get(cacheKey);
  if (cached) return cached;

  const sourcePath = path.join(SOURCE_DIR, `${sourceName}.png`);
  const original = await readFile(sourcePath);

  const pipeline = sharp(original).resize(WEBP_WIDTH, WEBP_WIDTH, {
    fit: "contain",
    background: { r: 255, g: 255, b: 255, alpha: 0 },
  });

  const webp = await pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();
  const meta = await sharp(webp).metadata();

  // 16px blur placeholder for next/image placeholder="blur".
  const blur = await sharp(original)
    .resize(16, 16, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
    .webp({ quality: 40 })
    .toBuffer();
  const blurDataUrl = `data:image/webp;base64,${blur.toString("base64")}`;

  const fileName = `${String(index).padStart(2, "0")}-${sourceName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")}.webp`;
  const objectPath = `products/${productSlug}/${fileName}`;

  let result: ProcessedImage;

  if (supabase) {
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(objectPath, webp, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true, // idempotent re-runs
      });
    if (error) throw new Error(`upload ${objectPath}: ${error.message}`);

    result = {
      storagePath: objectPath,
      externalUrl: null,
      width: meta.width ?? WEBP_WIDTH,
      height: meta.height ?? WEBP_WIDTH,
      blurDataUrl,
    };
  } else {
    const outDir = path.join(LOCAL_FALLBACK_DIR, productSlug);
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, fileName), webp);

    result = {
      storagePath: null,
      externalUrl: `/products/${productSlug}/${fileName}`,
      width: meta.width ?? WEBP_WIDTH,
      height: meta.height ?? WEBP_WIDTH,
      blurDataUrl,
    };
  }

  imageCache.set(cacheKey, result);
  return result;
}

// ─── Seed steps ──────────────────────────────────────────────────────────────

async function seedCategories() {
  log.step("Categories");
  const ids = new Map<string, string>();

  // Parents first so children can resolve parentId.
  for (const pass of [0, 1]) {
    for (const c of categories) {
      const isChild = Boolean(c.parent);
      if ((pass === 0) === isChild) continue;

      const row = await prisma.category.upsert({
        where: { slug: c.slug },
        create: {
          slug: c.slug,
          name: c.name,
          description: c.description,
          iconKey: c.iconKey,
          sortOrder: c.sortOrder,
          status: "PUBLISHED",
          parentId: c.parent ? ids.get(c.parent) : null,
        },
        update: {
          name: c.name,
          description: c.description,
          iconKey: c.iconKey,
          sortOrder: c.sortOrder,
          status: "PUBLISHED",
          parentId: c.parent ? ids.get(c.parent) : null,
        },
      });
      ids.set(c.slug, row.id);
    }
  }

  log.ok(`${ids.size} categories`);
  return ids;
}

async function seedProduct(p: SeedProduct, categoryIds: Map<string, string>) {
  const product = await prisma.product.upsert({
    where: { slug: p.slug },
    create: {
      slug: p.slug,
      name: p.name,
      subtitle: p.subtitle,
      shortDescription: p.shortDescription,
      description: p.description,
      specs: p.specs as unknown as Prisma.InputJsonValue,
      tags: p.tags,
      unit: p.unit,
      unitLabel: p.unitLabel,
      qtyStep: D(p.qtyStep ?? 1),
      moq: p.moq ? D(p.moq) : null,
      pricingMode: p.pricingMode ?? "TIERED",
      leadTimeDaysMin: p.leadTimeDaysMin,
      leadTimeDaysMax: p.leadTimeDaysMax,
      isFeatured: p.isFeatured ?? false,
      badgeText: p.badgeText,
      sortOrder: p.sortOrder ?? 0,
      status: "PUBLISHED",
      publishedAt: new Date(),
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
    },
    update: {
      name: p.name,
      subtitle: p.subtitle,
      shortDescription: p.shortDescription,
      description: p.description,
      specs: p.specs as unknown as Prisma.InputJsonValue,
      tags: p.tags,
      unit: p.unit,
      unitLabel: p.unitLabel,
      qtyStep: D(p.qtyStep ?? 1),
      moq: p.moq ? D(p.moq) : null,
      pricingMode: p.pricingMode ?? "TIERED",
      leadTimeDaysMin: p.leadTimeDaysMin,
      leadTimeDaysMax: p.leadTimeDaysMax,
      isFeatured: p.isFeatured ?? false,
      badgeText: p.badgeText,
      sortOrder: p.sortOrder ?? 0,
      status: "PUBLISHED",
      seoTitle: p.seoTitle,
      seoDescription: p.seoDescription,
    },
  });

  // ── categories ──
  // Only assigned on first creation, or under --force. If someone has since
  // re-filed the product in the admin, the seed must not undo that.
  const existingCategories = await prisma.productCategory.count({
    where: { productId: product.id },
  });

  if (existingCategories === 0 || FORCE) {
    await prisma.productCategory.deleteMany({ where: { productId: product.id } });
    await prisma.productCategory.createMany({
      data: p.categories.map((slug, i) => {
        const categoryId = categoryIds.get(slug);
        if (!categoryId) throw new Error(`${p.slug}: unknown category "${slug}"`);
        return { productId: product.id, categoryId, isPrimary: i === 0, sortOrder: i };
      }),
    });
  }

  // ── options and their values ──
  const valueIds = new Map<string, string>(); // `${optionName}:${valueCode}` -> id
  const optionIds = new Map<string, { id: string; position: number }>();

  for (const opt of p.options ?? []) {
    const option = await prisma.productOption.upsert({
      where: { productId_position: { productId: product.id, position: opt.position } },
      create: {
        productId: product.id,
        position: opt.position,
        name: opt.name,
        helpText: opt.helpText,
        displayAs: opt.displayAs,
      },
      update: { name: opt.name, helpText: opt.helpText, displayAs: opt.displayAs },
    });
    optionIds.set(opt.name, { id: option.id, position: opt.position });

    for (const [i, v] of opt.values.entries()) {
      const value = await prisma.productOptionValue.upsert({
        where: { optionId_valueCode: { optionId: option.id, valueCode: v.code } },
        create: {
          optionId: option.id,
          label: v.label,
          valueCode: v.code,
          swatchHex: v.swatchHex,
          description: v.description,
          sortOrder: i,
          isDefault: v.isDefault ?? i === 0,
        },
        update: {
          label: v.label,
          swatchHex: v.swatchHex,
          description: v.description,
          sortOrder: i,
          isDefault: v.isDefault ?? i === 0,
        },
      });
      valueIds.set(`${opt.name}:${v.code}`, value.id);
    }
  }

  // ── images ──
  // Only the seed's OWN images are rebuilt. Seed paths are deterministic
  // (`products/<slug>/NN-name.webp`); anything uploaded through the admin has a
  // timestamped path and is left alone. Without this, re-running the seed
  // deletes real uploads and orphans their Storage objects.
  const existingImages = await prisma.productImage.findMany({
    where: { productId: product.id },
    select: { id: true, storagePath: true, externalUrl: true },
  });

  const seedOwnsImage = (img: (typeof existingImages)[number]) => {
    const key = img.storagePath ?? img.externalUrl ?? "";
    return /(^|\/)products\/[^/]+\/\d{2}-[^/]+\.webp$/.test(key);
  };

  const adminImages = existingImages.filter((img) => !seedOwnsImage(img));
  if (adminImages.length && !FORCE) {
    log.warn(
      `${p.name}: keeping ${adminImages.length} image(s) uploaded via the admin`,
    );
  }

  const removableImages = FORCE
    ? existingImages
    : existingImages.filter(seedOwnsImage);

  await prisma.product.update({
    where: { id: product.id },
    data: { primaryImageId: null },
  });
  await prisma.productImage.deleteMany({
    where: { id: { in: removableImages.map((i) => i.id) } },
  });

  let imageIndex = 0;
  let firstImageId: string | null = null;

  // Axis-1 value images first — those are the ones the gallery swaps.
  const axis1 = (p.options ?? []).find((o) => o.position === 1);
  if (axis1) {
    for (const v of axis1.values) {
      for (const [i, sourceName] of (v.images ?? []).entries()) {
        const processed = await processImage(sourceName, p.slug, imageIndex++);
        const created = await prisma.productImage.create({
          data: {
            productId: product.id,
            optionValueId: valueIds.get(`${axis1.name}:${v.code}`)!,
            storagePath: processed.storagePath,
            externalUrl: processed.externalUrl,
            alt: `${p.name} — ${v.label}`,
            width: processed.width,
            height: processed.height,
            blurDataUrl: processed.blurDataUrl,
            sortOrder: i,
          },
        });
        firstImageId ??= created.id;
      }
    }
  }

  for (const [i, sourceName] of (p.sharedImages ?? []).entries()) {
    const processed = await processImage(sourceName, p.slug, imageIndex++);
    const created = await prisma.productImage.create({
      data: {
        productId: product.id,
        optionValueId: null,
        storagePath: processed.storagePath,
        externalUrl: processed.externalUrl,
        alt: `${p.name}${i > 0 ? ` — view ${i + 1}` : ""}`,
        width: processed.width,
        height: processed.height,
        blurDataUrl: processed.blurDataUrl,
        sortOrder: i,
      },
    });
    firstImageId ??= created.id;
  }

  if (firstImageId) {
    await prisma.product.update({
      where: { id: product.id },
      data: { primaryImageId: firstImageId },
    });
  }

  // ── SKUs, their option links and price tiers ──
  const seenSkuIds: string[] = [];

  for (const [i, sku] of p.skus.entries()) {
    const selections = Object.entries(sku.values ?? {}).map(([optionName, valueCode]) => {
      const option = optionIds.get(optionName);
      const valueId = valueIds.get(`${optionName}:${valueCode}`);
      if (!option || !valueId) {
        throw new Error(`${p.slug}/${sku.code}: unknown option "${optionName}" = "${valueCode}"`);
      }
      return { optionId: option.id, position: option.position, optionValueId: valueId };
    });

    const optionSignature = [...selections]
      .sort((a, b) => a.position - b.position)
      .map((s) => s.optionValueId)
      .join(",");

    const label =
      Object.entries(sku.values ?? {})
        .map(([optionName, code]) => {
          const opt = p.options?.find((o) => o.name === optionName);
          return opt?.values.find((v) => v.code === code)?.label ?? code;
        })
        .join(" / ") || null;

    const row = await prisma.sku.upsert({
      where: {
        productId_optionSignature: { productId: product.id, optionSignature },
      },
      create: {
        productId: product.id,
        skuCode: sku.code,
        label,
        isDefault: selections.length === 0,
        isActive: true,
        priceOnRequest: sku.priceOnRequest ?? false,
        moq: sku.moq ? D(sku.moq) : null,
        optionSignature,
        sortOrder: i,
      },
      update: {
        skuCode: sku.code,
        label,
        isDefault: selections.length === 0,
        isActive: true,
        priceOnRequest: sku.priceOnRequest ?? false,
        moq: sku.moq ? D(sku.moq) : null,
        sortOrder: i,
        deletedAt: null,
      },
    });
    seenSkuIds.push(row.id);

    await prisma.skuOptionValue.deleteMany({ where: { skuId: row.id } });
    if (selections.length > 0) {
      await prisma.skuOptionValue.createMany({
        data: selections.map((s) => ({
          skuId: row.id,
          optionId: s.optionId,
          optionValueId: s.optionValueId,
        })),
      });
    }

    await prisma.priceTier.deleteMany({ where: { skuId: row.id } });
    if (sku.tiers?.length) {
      await prisma.priceTier.createMany({
        data: sku.tiers.map((t) => ({
          skuId: row.id,
          minQty: D(t.minQty),
          unitPrice: D(t.unitPrice),
        })),
      });
    }
  }

  // SKUs the seed does not know about are almost always variants somebody
  // built in the admin panel. Retiring them here silently deletes real work
  // (it did exactly that once), so by default we report them and move on.
  // `npm run seed -- --force` restores the clean-bootstrap behaviour.
  const strangers = await prisma.sku.findMany({
    where: { productId: product.id, id: { notIn: seenSkuIds }, deletedAt: null },
    select: { id: true, skuCode: true, label: true },
  });

  if (strangers.length) {
    if (FORCE) {
      await prisma.sku.updateMany({
        where: { id: { in: strangers.map((s) => s.id) } },
        data: { isActive: false, deletedAt: new Date() },
      });
      log.warn(
        `${p.name}: retired ${strangers.length} non-seed variant(s) — ${strangers
          .map((s) => s.skuCode ?? s.label ?? s.id.slice(0, 8))
          .join(", ")}`,
      );
    } else {
      log.warn(
        `${p.name}: left ${strangers.length} admin-created variant(s) untouched — ${strangers
          .map((s) => s.skuCode ?? s.label ?? s.id.slice(0, 8))
          .join(", ")}`,
      );
    }
  }

  return { product, skuCount: seenSkuIds.length, imageCount: imageIndex };
}

/**
 * Recompute the denormalised pricing summary the storefront's listing pages
 * read. Mirrors summarisePricing() in src/lib/pricing.ts.
 */
async function recomputePricing(productId: string) {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: productId },
    include: {
      skus: {
        where: { isActive: true, deletedAt: null },
        include: { priceTiers: true },
      },
    },
  });

  const prices: number[] = [];
  const moqs: number[] = [];

  for (const sku of product.skus) {
    if (sku.priceOnRequest || sku.priceTiers.length === 0) continue;
    for (const t of sku.priceTiers) prices.push(t.unitPrice.toNumber());
    const lowest = Math.min(...sku.priceTiers.map((t) => t.minQty.toNumber()));
    moqs.push(sku.moq?.toNumber() ?? product.moq?.toNumber() ?? lowest);
  }

  await prisma.product.update({
    where: { id: productId },
    data: {
      minUnitPrice: prices.length ? D(Math.min(...prices)) : null,
      maxUnitPrice: prices.length ? D(Math.max(...prices)) : null,
      effectiveMoq: moqs.length
        ? D(Math.min(...moqs))
        : (product.moq ?? null),
    },
  });
}

/**
 * Portfolio photographs.
 *
 * Unlike product shots these are real photos, not cut-outs, so they keep their
 * own aspect ratio (all the supplied ones happen to be square) and are not
 * padded onto a white canvas. They live in the site-assets bucket.
 */
async function processPortfolioImage(
  fileName: string,
  slug: string,
  index: number,
): Promise<{
  storagePath: string;
  width: number;
  height: number;
  blurDataUrl: string;
}> {
  const sourcePath = path.join(PORTFOLIO_SOURCE_DIR, fileName);
  const original = await readFile(sourcePath);

  const webp = await sharp(original)
    .resize(PORTFOLIO_WIDTH, PORTFOLIO_WIDTH, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY })
    .toBuffer();
  const meta = await sharp(webp).metadata();

  const blur = await sharp(original)
    .resize(16, 16, { fit: "inside" })
    .webp({ quality: 40 })
    .toBuffer();
  const blurDataUrl = `data:image/webp;base64,${blur.toString("base64")}`;

  const objectPath = `portfolio/${slug}/${String(index).padStart(2, "0")}-${path.parse(fileName).name}.webp`;

  if (supabase) {
    const { error } = await supabase.storage
      .from(SITE_BUCKET)
      .upload(objectPath, webp, {
        contentType: "image/webp",
        cacheControl: "31536000",
        upsert: true,
      });
    if (error) throw new Error(`upload ${objectPath}: ${error.message}`);
  } else {
    const outDir = path.join(CLIENT_ROOT, "public", "site-assets", "portfolio", slug);
    await mkdir(outDir, { recursive: true });
    await writeFile(path.join(outDir, path.basename(objectPath)), webp);
  }

  return {
    storagePath: objectPath,
    width: meta.width ?? PORTFOLIO_WIDTH,
    height: meta.height ?? PORTFOLIO_WIDTH,
    blurDataUrl,
  };
}

async function seedPortfolio() {
  log.step("Portfolio");

  for (const item of portfolioItems) {
    const gallery: {
      storagePath: string;
      alt: string;
      width: number;
      height: number;
      blurDataUrl: string;
    }[] = [];

    for (const [i, image] of item.images.entries()) {
      const processed = await processPortfolioImage(image.file, item.slug, i);
      gallery.push({ ...processed, alt: image.alt });
    }

    const data = {
      title: item.title,
      client: item.client,
      eventType: item.eventType,
      summary: item.summary,
      description: item.description,
      eventDate: item.eventDate ? new Date(item.eventDate) : null,
      coverPath: gallery[0]?.storagePath ?? null,
      gallery: gallery as unknown as Prisma.InputJsonValue,
      status: "PUBLISHED" as const,
      sortOrder: item.sortOrder,
      seoTitle: item.seoTitle,
      seoDescription: item.seoDescription,
    };

    const row = await prisma.portfolioItem.upsert({
      where: { slug: item.slug },
      create: { slug: item.slug, ...data },
      update: data,
    });

    // Link the products this job actually used, so each case study can point
    // readers at something they can price and inquire about.
    const products = await prisma.product.findMany({
      where: { slug: { in: item.products }, deletedAt: null },
      select: { id: true, slug: true },
    });

    const missing = item.products.filter(
      (slug) => !products.some((p) => p.slug === slug),
    );
    if (missing.length) {
      log.warn(`${item.title}: unknown product slug(s) ${missing.join(", ")}`);
    }

    await prisma.portfolioProduct.deleteMany({ where: { portfolioItemId: row.id } });
    if (products.length) {
      await prisma.portfolioProduct.createMany({
        data: products.map((p, i) => ({
          portfolioItemId: row.id,
          productId: p.id,
          sortOrder: i,
        })),
      });
    }

    log.ok(
      `${item.title} — ${gallery.length} image${gallery.length === 1 ? "" : "s"}, ${products.length} linked product${products.length === 1 ? "" : "s"}`,
    );
  }
}

async function seedSiteContent() {
  log.step("Site content");

  await prisma.siteSetting.upsert({
    where: { id: 1 },
    create: siteSettings,
    update: siteSettings,
  });
  log.ok("site settings");

  for (const f of faqs) {
    const id = createHash("sha1").update(f.question).digest("hex").slice(0, 12);
    const existing = await prisma.faq.findFirst({ where: { question: f.question } });
    if (existing) {
      await prisma.faq.update({
        where: { id: existing.id },
        data: { answer: f.answer, category: f.category, sortOrder: f.sortOrder, isActive: true },
      });
    } else {
      await prisma.faq.create({
        data: {
          question: f.question,
          answer: f.answer,
          category: f.category,
          sortOrder: f.sortOrder,
          isActive: true,
        },
      });
      void id;
    }
  }
  log.ok(`${faqs.length} FAQs`);
  log.info("partners / banners left empty — add via the admin panel");
}

// ─── Review reports ──────────────────────────────────────────────────────────

async function writeReports() {
  log.step("Review reports");
  await mkdir(DOCS_DIR, { recursive: true });

  const missingImages: unknown[] = [];
  const missingPrices: unknown[] = [];

  for (const p of products) {
    const axis1 = p.options?.find((o) => o.position === 1);

    // A priced option value with no photograph of its own, while a sibling
    // value does have one — the customer silently sees the shared gallery.
    if (axis1) {
      const anySiblingHasImages = axis1.values.some((v) => (v.images?.length ?? 0) > 0);
      for (const v of axis1.values) {
        if (anySiblingHasImages && !(v.images?.length ?? 0)) {
          const sku = p.skus.find((s) => s.values?.[axis1.name] === v.code);
          missingImages.push({
            product: p.name,
            slug: p.slug,
            option: axis1.name,
            value: v.label,
            valueCode: v.code,
            hasPrice: Boolean(sku?.tiers?.length),
            note: "Priced variant with no photograph. Falls back to the shared gallery until an image is supplied.",
          });
        }
      }
    }

    if (!(p.sharedImages?.length ?? 0) && !axis1?.values.some((v) => v.images?.length)) {
      missingImages.push({
        product: p.name,
        slug: p.slug,
        note: "Product has no images at all.",
      });
    }

    const porSkus = p.skus.filter((s: SeedSku) => s.priceOnRequest || !s.tiers?.length);
    if (porSkus.length) {
      missingPrices.push({
        product: p.name,
        slug: p.slug,
        productLevel: p.pricingMode === "ON_REQUEST",
        skus: porSkus.map((s) => ({ code: s.code, options: s.values ?? null })),
      });
    }
  }

  await writeFile(
    path.join(DOCS_DIR, "missing-images.json"),
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        summary:
          "Products or variants that carry a price but have no photograph. Drop a square 1000x1000 image into corpomerch-client/public/Product Gallery/, wire it up in prisma/seed-data/products.ts, and re-run `npm run seed` — or just upload it in the admin panel.",
        count: missingImages.length,
        items: missingImages,
      },
      null,
      2,
    ) + "\n",
  );

  await writeFile(
    path.join(DOCS_DIR, "missing-prices.json"),
    JSON.stringify(
      {
        generated: new Date().toISOString(),
        summary:
          "Products or variants with a photograph but no published price. They are live on the site as 'Price on Request' and remain fully inquirable. Add tiers in the admin panel to switch them to listed pricing.",
        count: missingPrices.length,
        items: missingPrices,
        contentQueries: [
          "Certificate specs say '220 GSM ambush paper'. Seeded verbatim as 'textured (ambush) paper' — very likely means EMBOSS. Confirm before it ships as customer-facing copy.",
          "Water Bottle and Ceramic Mug list MOQ 20 but the lowest price tier starts at 50. Seeded exactly as supplied; the storefront prices a 20-49 order at the 50-piece rate and flags it. Confirm whether the MOQ should be 50, or a 20-49 tier added.",
          "Lanyard widths (2 cm / 2.5 cm) are modelled as a variant axis with no price difference, since none was supplied. Confirm whether 2.5 cm carries an uplift.",
        ],
      },
      null,
      2,
    ) + "\n",
  );

  log.ok(`docs/missing-images.json — ${missingImages.length} entries`);
  log.ok(`docs/missing-prices.json — ${missingPrices.length} entries`);
}

// ─── Main ────────────────────────────────────────────────────────────────────

/**
 * Loads just Connect Plus (and its category). Existing categories are only
 * looked up, never rewritten, so admin edits to the rest of the catalogue stay.
 */
async function seedConnectPlusOnly() {
  log.step("Connect Plus only");
  const c = connectCategory;
  const row = await prisma.category.upsert({
    where: { slug: c.slug },
    create: { slug: c.slug, name: c.name, description: c.description, iconKey: c.iconKey, sortOrder: c.sortOrder, status: "PUBLISHED" },
    update: { name: c.name, description: c.description, iconKey: c.iconKey, sortOrder: c.sortOrder },
  });
  const { product, skuCount, imageCount } = await seedProduct(connectPlus, new Map([[c.slug, row.id]]));
  await recomputePricing(product.id);
  log.ok(`${connectPlus.name} — ${skuCount} skus, ${imageCount} images`);
}

async function main() {
  console.log("\n\x1b[1m\x1b[31mCorpoMerch\x1b[0m catalogue seed");
  log.info(
    USING_STORAGE
      ? `images → Supabase Storage bucket "${BUCKET}"`
      : "images → corpomerch-client/public/products/ (SUPABASE_SECRET_KEY not set)",
  );

  if (process.argv.includes("--only=portfolio")) {
    await seedPortfolio();
    return;
  }

  if (process.argv.includes("--only=connect-plus")) {
    await seedConnectPlusOnly();
    return;
  }

  const categoryIds = await seedCategories();

  log.step("Products");
  let totalSkus = 0;
  let totalImages = 0;

  for (const p of products) {
    const { product, skuCount, imageCount } = await seedProduct(p, categoryIds);
    await recomputePricing(product.id);
    totalSkus += skuCount;
    totalImages += imageCount;
    log.ok(`${p.name} — ${skuCount} sku${skuCount === 1 ? "" : "s"}, ${imageCount} image${imageCount === 1 ? "" : "s"}`);
  }

  await seedPortfolio();
  await seedSiteContent();
  await writeReports();

  log.step("Summary");
  const counts = {
    categories: await prisma.category.count(),
    products: await prisma.product.count(),
    skus: await prisma.sku.count({ where: { isActive: true } }),
    priceTiers: await prisma.priceTier.count(),
    images: await prisma.productImage.count(),
    faqs: await prisma.faq.count(),
    portfolio: await prisma.portfolioItem.count(),
  };
  console.table(counts);

  if (!USING_STORAGE) {
    log.warn(
      "SUPABASE_SECRET_KEY is empty — images were written locally. Set it in .env and re-run to move them into Supabase Storage.",
    );
  }

  void totalSkus;
  void totalImages;
}

main()
  .catch((e) => {
    console.error("\n\x1b[31mSeed failed:\x1b[0m", e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
