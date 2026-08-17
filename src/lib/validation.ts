import { z } from "zod";

/**
 * One schema spans all seven tabs of the product form. Invariants that the
 * database cannot express (CLAUDE.md §4) are enforced here with `superRefine`,
 * so a bad shape is rejected before it reaches Prisma.
 */

export const UNITS = ["PC", "SET", "SQFT", "PAIR", "BOX", "SHEET"] as const;
export const DISPLAYS = ["CHIP", "SWATCH", "DROPDOWN", "IMAGE"] as const;
export const STATUSES = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

const slug = z
  .string()
  .min(2, "At least 2 characters")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only");

const valueCode = z
  .string()
  .min(1, "Required")
  .max(40)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and hyphens only");

export const specRowSchema = z.object({
  group: z.string().max(60).optional().nullable(),
  key: z.string().min(1, "Required").max(80),
  value: z.string().min(1, "Required").max(600),
});

export const priceTierSchema = z.object({
  minQty: z.number().positive("Must be more than 0"),
  unitPrice: z.number().min(0, "Cannot be negative"),
  compareAtPrice: z.number().min(0).optional().nullable(),
  note: z.string().max(200).optional().nullable(),
});

export const optionValueSchema = z.object({
  id: z.string().optional(),
  label: z.string().min(1, "Required").max(60),
  valueCode,
  swatchHex: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Use a 6-digit hex like #D12429")
    .optional()
    .nullable()
    .or(z.literal("")),
  description: z.string().max(200).optional().nullable(),
  isDefault: z.boolean(),
});

export const productOptionSchema = z.object({
  id: z.string().optional(),
  position: z.number().int().min(1).max(3),
  name: z.string().min(1, "Required").max(50),
  helpText: z.string().max(200).optional().nullable(),
  displayAs: z.enum(DISPLAYS),
  values: z.array(optionValueSchema).min(1, "Add at least one value"),
});

export const skuSchema = z.object({
  id: z.string().optional(),
  skuCode: z.string().max(60).optional().nullable(),
  /** optionName -> valueCode. Empty for an option-less product. */
  valueCodes: z.record(z.string(), z.string()),
  moq: z.number().positive().optional().nullable(),
  priceOnRequest: z.boolean(),
  isActive: z.boolean(),
  tiers: z.array(priceTierSchema),
});

export const productImageSchema = z.object({
  id: z.string().optional(),
  storagePath: z.string().optional().nullable(),
  externalUrl: z.string().optional().nullable(),
  alt: z.string().min(1, "Alt text is required").max(200),
  width: z.number().int().positive().optional().nullable(),
  height: z.number().int().positive().optional().nullable(),
  blurDataUrl: z.string().optional().nullable(),
  /** valueCode of an axis-1 option value, or null for the shared gallery. */
  optionValueCode: z.string().optional().nullable(),
  isPrimary: z.boolean(),
});

export const productFormSchema = z
  .object({
    id: z.string().optional(),

    // Basics
    name: z.string().min(2, "Required").max(160),
    slug,
    subtitle: z.string().max(160).optional().nullable(),
    categoryIds: z.array(z.string()).min(1, "Pick at least one category"),
    primaryCategoryId: z.string().min(1, "Pick a primary category"),
    tags: z.array(z.string().max(40)),
    unit: z.enum(UNITS),
    unitLabel: z.string().max(20).optional().nullable(),
    qtyStep: z.number().positive("Must be more than 0"),
    moq: z.number().positive().optional().nullable(),
    leadTimeDaysMin: z.number().int().min(0).optional().nullable(),
    leadTimeDaysMax: z.number().int().min(0).optional().nullable(),
    isFeatured: z.boolean(),
    badgeText: z.string().max(30).optional().nullable(),
    status: z.enum(STATUSES),
    sortOrder: z.number().int(),
    pricingMode: z.enum(["TIERED", "ON_REQUEST"]),

    // Content
    shortDescription: z.string().max(400).optional().nullable(),
    description: z.string().max(20000).optional().nullable(),
    specs: z.array(specRowSchema),

    // Media + variants + pricing
    images: z.array(productImageSchema),
    options: z.array(productOptionSchema).max(3, "Three option axes maximum"),
    skus: z.array(skuSchema).min(1, "A product needs at least one variant"),

    // SEO
    seoTitle: z.string().max(70).optional().nullable(),
    seoDescription: z.string().max(180).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const err = (path: (string | number)[], message: string) =>
      ctx.addIssue({ code: "custom", path, message });

    // Primary category must be one of the selected categories.
    if (!data.categoryIds.includes(data.primaryCategoryId)) {
      err(["primaryCategoryId"], "The primary category must be one you have selected");
    }

    // Axis positions are 1..3 and unique.
    const positions = data.options.map((o) => o.position);
    if (new Set(positions).size !== positions.length) {
      err(["options"], "Two option axes share the same position");
    }

    data.options.forEach((option, oi) => {
      const codes = option.values.map((v) => v.valueCode);
      if (new Set(codes).size !== codes.length) {
        err(["options", oi, "values"], "Value codes must be unique within an axis");
      }
      if (option.values.filter((v) => v.isDefault).length > 1) {
        err(["options", oi, "values"], "Only one value can be the default");
      }
    });

    // Every SKU must pick exactly one valid value per axis.
    const byName = new Map(data.options.map((o) => [o.name, o]));
    const signatures = new Set<string>();

    data.skus.forEach((sku, si) => {
      for (const option of data.options) {
        const chosen = sku.valueCodes[option.name];
        if (!chosen) {
          err(["skus", si], `Variant is missing a value for “${option.name}”`);
        } else if (!option.values.some((v) => v.valueCode === chosen)) {
          err(["skus", si], `“${chosen}” is not a value of “${option.name}”`);
        }
      }

      for (const name of Object.keys(sku.valueCodes)) {
        if (!byName.has(name)) {
          err(["skus", si], `“${name}” is not an option on this product`);
        }
      }

      // Duplicate combinations would violate the DB unique index.
      const signature = data.options
        .slice()
        .sort((a, b) => a.position - b.position)
        .map((o) => sku.valueCodes[o.name] ?? "")
        .join(",");
      if (signatures.has(signature)) {
        err(["skus", si], "Another variant already uses this combination");
      }
      signatures.add(signature);

      const minQtys = sku.tiers.map((t) => t.minQty);
      if (new Set(minQtys).size !== minQtys.length) {
        err(["skus", si, "tiers"], "Two tiers start at the same quantity");
      }
    });

    // An option-less product must have exactly one variant.
    if (data.options.length === 0 && data.skus.length !== 1) {
      err(["skus"], "A product with no options must have exactly one variant");
    }

    // Images may only be scoped to axis 1.
    const axis1 = data.options.find((o) => o.position === 1);
    data.images.forEach((image, ii) => {
      if (!image.optionValueCode) return;
      if (!axis1) {
        err(["images", ii], "This product has no axis-1 option to attach an image to");
      } else if (!axis1.values.some((v) => v.valueCode === image.optionValueCode)) {
        err(["images", ii], `“${image.optionValueCode}” is not a value of “${axis1.name}”`);
      }
    });

    if (data.images.filter((i) => i.isPrimary).length > 1) {
      err(["images"], "Only one image can be primary");
    }

    if (
      data.leadTimeDaysMin != null &&
      data.leadTimeDaysMax != null &&
      data.leadTimeDaysMin > data.leadTimeDaysMax
    ) {
      err(["leadTimeDaysMax"], "Maximum must be at least the minimum");
    }

    // Publish gate. Drafts may be as incomplete as you like.
    if (data.status === "PUBLISHED") {
      if (!data.description?.trim()) {
        err(["description"], "A description is required to publish");
      }
      if (!data.shortDescription?.trim()) {
        err(["shortDescription"], "A short description is required to publish");
      }
      if (data.specs.length === 0) {
        err(["specs"], "At least one specification row is required to publish");
      }
      if (data.images.length === 0) {
        err(["images"], "At least one image is required to publish");
      }
    }
  });

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type SpecRowValues = z.infer<typeof specRowSchema>;
export type SkuValues = z.infer<typeof skuSchema>;
export type ProductOptionValues = z.infer<typeof productOptionSchema>;
export type ProductImageValues = z.infer<typeof productImageSchema>;
