import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Catalogue data-health warnings.
 *
 * These are warnings, not errors — the underlying data is legitimately messy
 * (the supplied price list really does have MOQ 20 against a lowest tier of
 * 50). The rule is that they must be visible, never silently swallowed. The
 * product form shows the ones relevant to the product being edited; the
 * dashboard aggregates all of them.
 */

export type HealthSeverity = "warning" | "info";

export interface HealthIssue {
  severity: HealthSeverity;
  kind: string;
  productId: string;
  productSlug: string;
  productName: string;
  message: string;
}

export async function getCatalogueHealth(
  productId?: string,
): Promise<HealthIssue[]> {
  const products = await prisma.product.findMany({
    where: { deletedAt: null, ...(productId ? { id: productId } : {}) },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      moq: true,
      description: true,
      shortDescription: true,
      specs: true,
      primaryImageId: true,
      pricingMode: true,
      options: {
        where: { position: 1 },
        select: {
          name: true,
          values: {
            select: { label: true, _count: { select: { images: true } } },
          },
        },
      },
      skus: {
        where: { isActive: true, deletedAt: null },
        select: {
          id: true,
          label: true,
          skuCode: true,
          moq: true,
          priceOnRequest: true,
          priceTiers: { select: { minQty: true } },
        },
      },
    },
  });

  const issues: HealthIssue[] = [];

  for (const p of products) {
    const base = {
      productId: p.id,
      productSlug: p.slug,
      productName: p.name,
    };

    // ── Pricing ──
    for (const sku of p.skus) {
      const name = sku.label ?? sku.skuCode ?? "default variant";

      if (!sku.priceOnRequest && sku.priceTiers.length === 0) {
        issues.push({
          ...base,
          severity: "warning",
          kind: "sku-no-price",
          message: `“${name}” has no price tiers and is not marked price-on-request, so it will silently show as unpriced.`,
        });
        continue;
      }

      if (sku.priceTiers.length > 0) {
        const lowest = Math.min(...sku.priceTiers.map((t) => t.minQty.toNumber()));
        const moq = sku.moq?.toNumber() ?? p.moq?.toNumber() ?? null;
        if (moq !== null && moq < lowest) {
          issues.push({
            ...base,
            severity: "warning",
            kind: "moq-below-tier",
            message: `“${name}” has MOQ ${moq} but its lowest tier starts at ${lowest}. Quantities between ${moq} and ${lowest - 1} are priced at the ${lowest}-unit rate.`,
          });
        }
      }
    }

    if (p.skus.length === 0) {
      issues.push({
        ...base,
        severity: "warning",
        kind: "no-skus",
        message: "Product has no active variants, so it cannot be priced or inquired about.",
      });
    }

    // ── Axis-1 images ──
    for (const option of p.options) {
      const withImages = option.values.filter((v) => v._count.images > 0);
      if (withImages.length > 0 && withImages.length < option.values.length) {
        const missing = option.values
          .filter((v) => v._count.images === 0)
          .map((v) => `“${v.label}”`)
          .join(", ");
        issues.push({
          ...base,
          severity: "info",
          kind: "axis1-missing-images",
          message: `${option.name}: ${missing} has no image while other values do — customers will see the shared gallery instead.`,
        });
      }
    }

    // ── Publish readiness ──
    if (p.status === "PUBLISHED") {
      if (!p.primaryImageId) {
        issues.push({
          ...base,
          severity: "warning",
          kind: "no-primary-image",
          message: "Published with no primary image.",
        });
      }
      if (!p.description?.trim()) {
        issues.push({
          ...base,
          severity: "warning",
          kind: "no-description",
          message: "Published with no description.",
        });
      }
      if (!Array.isArray(p.specs) || p.specs.length === 0) {
        issues.push({
          ...base,
          severity: "warning",
          kind: "no-specs",
          message: "Published with no specifications.",
        });
      }
    }
  }

  return issues;
}
