/**
 * CorpoMerch quantity-break pricing.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * THIS FILE IS DUPLICATED IN corpomerch-client/src/lib/pricing.ts.
 * They must stay byte-identical: the admin's "price this quantity" probe and
 * the storefront's tier table have to agree, or the preview lies to the admin.
 * ─────────────────────────────────────────────────────────────────────────────
 *
 * The model in one paragraph: price hangs off a SKU (one combination of option
 * values), never off a product. A product with no options still has exactly one
 * SKU, so there is a single code path. A SKU owns an ordered list of price
 * tiers, each an *open-ended inclusive minimum*: [{50,15},{100,12}] reads as
 * "50-99 -> 15 each, 100+ -> 12 each". Upper bounds are derived, never stored.
 *
 * Deliberately dependency-free and Decimal-free so it runs unchanged in a
 * client component. Convert Prisma Decimals to numbers at the query boundary.
 */

export type UnitKindLike =
  | "PC"
  | "SET"
  | "SQFT"
  | "PAIR"
  | "BOX"
  | "SHEET";

export type PricingModeLike = "TIERED" | "ON_REQUEST";

export interface TierLike {
  minQty: number;
  unitPrice: number;
  compareAtPrice?: number | null;
  note?: string | null;
}

export interface SkuLike {
  id: string;
  priceOnRequest: boolean;
  /** Overrides the product MOQ for this combination. */
  moq?: number | null;
  priceTiers: TierLike[];
}

export interface ProductLike {
  pricingMode: PricingModeLike;
  moq?: number | null;
  qtyStep: number;
  unit: UnitKindLike;
}

export interface ResolvedPrice {
  /** No published price: render the quote panel, not an empty table. */
  isPriceOnRequest: boolean;
  /** sku.moq ?? product.moq ?? lowest tier ?? 1 */
  moq: number;
  /** Quantity is under the MOQ. A warning, never a blocker — they may still ask. */
  belowMoq: boolean;
  /**
   * Quantity is under the *lowest tier*, which is not the same thing. The
   * supplied price list has real cases of this (Water Bottle: MOQ 20, tiers
   * start at 50). We price at the lowest tier and flag it rather than
   * inventing a number or refusing to quote.
   */
  belowLowestTier: boolean;
  tier: TierLike | null;
  tierIndex: number;
  unitPrice: number | null;
  lineTotal: number | null;
  compareAtUnitPrice: number | null;
  /** Money saved per unit versus the next-cheapest (lower) tier. */
  savingVsFirstTier: number | null;
}

export interface TierRange extends TierLike {
  /** null on the open-ended top tier. */
  maxQty: number | null;
  index: number;
}

/** Round to 2dp without floating-point tails (0.1 + 0.2 style). */
export function money(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

function sortTiers(tiers: readonly TierLike[]): TierLike[] {
  return [...tiers].sort((a, b) => a.minQty - b.minQty);
}

/**
 * Turn open-ended minimums into displayable ranges.
 *
 * ALWAYS use this to render a tier table. Hand-writing "50-100" and "100-200"
 * from the source price list double-renders the boundary: a quantity of exactly
 * 100 appears to match two rows, and customers notice.
 */
export function buildTierRanges(
  tiers: readonly TierLike[],
  qtyStep = 1,
): TierRange[] {
  const sorted = sortTiers(tiers);
  const step = qtyStep > 0 ? qtyStep : 1;

  return sorted.map((tier, i) => {
    const next = sorted[i + 1];
    return {
      ...tier,
      index: i,
      maxQty: next ? money(next.minQty - step) : null,
    };
  });
}

/** The single entry point for every price shown anywhere on either app. */
export function resolvePrice({
  product,
  sku,
  quantity,
}: {
  product: ProductLike;
  sku: SkuLike | null | undefined;
  quantity: number;
}): ResolvedPrice {
  const tiers = sku ? sortTiers(sku.priceTiers) : [];

  const moq =
    sku?.moq ??
    product.moq ??
    (tiers.length > 0 ? tiers[0].minQty : 1);

  const isPriceOnRequest =
    product.pricingMode === "ON_REQUEST" ||
    sku?.priceOnRequest === true ||
    tiers.length === 0;

  const base = {
    moq,
    belowMoq: quantity > 0 && quantity < moq,
  };

  if (isPriceOnRequest) {
    return {
      ...base,
      isPriceOnRequest: true,
      belowLowestTier: false,
      tier: null,
      tierIndex: -1,
      unitPrice: null,
      lineTotal: null,
      compareAtUnitPrice: null,
      savingVsFirstTier: null,
    };
  }

  // Highest tier whose minimum the quantity has reached. Below the lowest
  // tier we still quote the lowest tier's rate — see belowLowestTier.
  let tierIndex = 0;
  for (let i = 0; i < tiers.length; i++) {
    if (quantity >= tiers[i].minQty) tierIndex = i;
  }

  const tier = tiers[tierIndex];
  const belowLowestTier = quantity < tiers[0].minQty;
  const unitPrice = money(tier.unitPrice);

  return {
    ...base,
    isPriceOnRequest: false,
    belowLowestTier,
    tier,
    tierIndex,
    unitPrice,
    lineTotal: quantity > 0 ? money(unitPrice * quantity) : null,
    compareAtUnitPrice: tier.compareAtPrice ? money(tier.compareAtPrice) : null,
    savingVsFirstTier:
      tiers.length > 1 && tierIndex > 0
        ? money(tiers[0].unitPrice - unitPrice)
        : null,
  };
}

/**
 * "From ৳X" for listing cards, without hitting the tier tables at request time.
 * Prefer the denormalised Product.minUnitPrice; this is the fallback when a
 * query already has the SKUs loaded.
 */
export function summarisePricing(
  product: ProductLike,
  skus: readonly SkuLike[],
): {
  minUnitPrice: number | null;
  maxUnitPrice: number | null;
  effectiveMoq: number | null;
  anyOnRequest: boolean;
} {
  const prices: number[] = [];
  const moqs: number[] = [];
  let anyOnRequest = product.pricingMode === "ON_REQUEST";

  for (const sku of skus) {
    if (sku.priceOnRequest || sku.priceTiers.length === 0) {
      anyOnRequest = true;
      continue;
    }
    for (const tier of sku.priceTiers) prices.push(tier.unitPrice);
    const tiers = sortTiers(sku.priceTiers);
    moqs.push(sku.moq ?? product.moq ?? tiers[0].minQty);
  }

  return {
    minUnitPrice: prices.length ? money(Math.min(...prices)) : null,
    maxUnitPrice: prices.length ? money(Math.max(...prices)) : null,
    effectiveMoq: moqs.length ? Math.min(...moqs) : (product.moq ?? null),
    anyOnRequest,
  };
}

/**
 * Ordered, comma-joined list of chosen option-value ids. Paired with
 * `@@unique([productId, optionSignature])` this is what makes the admin's
 * "Generate SKUs" idempotent. Order must follow ProductOption.position.
 */
export function buildOptionSignature(
  selections: readonly { position: number; optionValueId: string }[],
): string {
  return [...selections]
    .sort((a, b) => a.position - b.position)
    .map((s) => s.optionValueId)
    .join(",");
}

/**
 * Snap a user-typed quantity onto the product's step, never returning less
 * than one step. Does NOT clamp to MOQ — under-MOQ is a warning, not a block.
 */
export function snapQuantity(raw: number, qtyStep: number): number {
  const step = qtyStep > 0 ? qtyStep : 1;
  if (!Number.isFinite(raw) || raw <= 0) return step;
  return money(Math.max(step, Math.round(raw / step) * step));
}
