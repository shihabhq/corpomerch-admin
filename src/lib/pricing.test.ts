/**
 * Pricing tests.
 *
 *   node --test --experimental-strip-types src/lib/pricing.test.ts
 *
 * Every case here comes from the real supplied price list, including the two
 * awkward ones (Water Bottle / Mug declare MOQ 20 but their lowest tier starts
 * at 50). Those are not bugs to "fix" — they are the data as given, and the
 * behaviour is deliberate. If you change resolvePrice(), these must still pass.
 */

import assert from "node:assert/strict";
import { test } from "node:test";

import {
  buildOptionSignature,
  buildTierRanges,
  resolvePrice,
  snapQuantity,
  summarisePricing,
  type ProductLike,
  type SkuLike,
} from "./pricing.ts";

const product = (over: Partial<ProductLike> = {}): ProductLike => ({
  pricingMode: "TIERED",
  moq: null,
  qtyStep: 1,
  unit: "PC",
  ...over,
});

const sku = (over: Partial<SkuLike> = {}): SkuLike => ({
  id: "sku",
  priceOnRequest: false,
  moq: null,
  priceTiers: [],
  ...over,
});

// ID Card (Regular): 50 -> 15, 100 -> 12
const idCard = sku({
  priceTiers: [
    { minQty: 50, unitPrice: 15 },
    { minQty: 100, unitPrice: 12 },
  ],
});

test("picks the tier the quantity has reached", () => {
  const r = resolvePrice({ product: product(), sku: idCard, quantity: 60 });
  assert.equal(r.unitPrice, 15);
  assert.equal(r.lineTotal, 900);
});

test("a quantity exactly on a boundary takes the HIGHER tier", () => {
  // The classic off-by-one: 100 must be 12, not 15.
  const r = resolvePrice({ product: product(), sku: idCard, quantity: 100 });
  assert.equal(r.unitPrice, 12);
  assert.equal(r.tierIndex, 1);
});

test("one below a boundary stays on the lower tier", () => {
  const r = resolvePrice({ product: product(), sku: idCard, quantity: 99 });
  assert.equal(r.unitPrice, 15);
});

test("above the top tier keeps the top rate", () => {
  const r = resolvePrice({ product: product(), sku: idCard, quantity: 100_000 });
  assert.equal(r.unitPrice, 12);
  assert.equal(r.lineTotal, 1_200_000);
});

test("MOQ below the lowest tier prices at the lowest tier and flags it", () => {
  // Water Bottle as supplied: MOQ 20, tiers start at 50 -> 250.
  const bottle = sku({
    moq: 20,
    priceTiers: [
      { minQty: 50, unitPrice: 250 },
      { minQty: 100, unitPrice: 200 },
      { minQty: 200, unitPrice: 170 },
      { minQty: 500, unitPrice: 140 },
    ],
  });
  const r = resolvePrice({ product: product({ moq: 20 }), sku: bottle, quantity: 30 });

  assert.equal(r.moq, 20);
  assert.equal(r.belowMoq, false, "30 is above the MOQ of 20");
  assert.equal(r.belowLowestTier, true, "but below the lowest published tier");
  assert.equal(r.unitPrice, 250);
  assert.equal(r.lineTotal, 7500);
});

test("below the MOQ is a warning, never a refusal", () => {
  const r = resolvePrice({ product: product({ moq: 50 }), sku: idCard, quantity: 10 });
  assert.equal(r.belowMoq, true);
  assert.equal(r.unitPrice, 15, "still quotes a price so they can inquire");
});

test("SKU MOQ overrides the product MOQ", () => {
  const acrylic = sku({
    moq: 50,
    priceTiers: [
      { minQty: 50, unitPrice: 45 },
      { minQty: 100, unitPrice: 40 },
    ],
  });
  const r = resolvePrice({ product: product({ moq: 20 }), sku: acrylic, quantity: 50 });
  assert.equal(r.moq, 50);
});

test("price-on-request returns no price at all", () => {
  const por = sku({ priceOnRequest: true });
  const r = resolvePrice({ product: product(), sku: por, quantity: 100 });
  assert.equal(r.isPriceOnRequest, true);
  assert.equal(r.unitPrice, null);
  assert.equal(r.lineTotal, null);
});

test("a tier-less SKU is treated as price-on-request, not as free", () => {
  const r = resolvePrice({ product: product(), sku: sku(), quantity: 100 });
  assert.equal(r.isPriceOnRequest, true);
  assert.equal(r.unitPrice, null);
});

test("a product-level ON_REQUEST overrides any tiers present", () => {
  const r = resolvePrice({
    product: product({ pricingMode: "ON_REQUEST" }),
    sku: idCard,
    quantity: 100,
  });
  assert.equal(r.isPriceOnRequest, true);
});

test("a missing SKU does not throw", () => {
  const r = resolvePrice({ product: product(), sku: null, quantity: 100 });
  assert.equal(r.isPriceOnRequest, true);
});

test("fractional sqft quantities keep 2dp and do not drift", () => {
  const banner = sku({
    priceTiers: [
      { minQty: 100, unitPrice: 18 },
      { minQty: 500, unitPrice: 14 },
      { minQty: 1000, unitPrice: 13 },
    ],
  });
  const r = resolvePrice({
    product: product({ unit: "SQFT", qtyStep: 0.5 }),
    sku: banner,
    quantity: 137.5,
  });
  assert.equal(r.unitPrice, 18);
  assert.equal(r.lineTotal, 2475);
});

test("tier ranges never double-count a boundary", () => {
  const ranges = buildTierRanges(idCard.priceTiers, 1);
  assert.deepEqual(
    ranges.map((r) => [r.minQty, r.maxQty]),
    [
      [50, 99],
      [100, null],
    ],
  );
});

test("tier ranges respect a fractional step", () => {
  const ranges = buildTierRanges(
    [
      { minQty: 100, unitPrice: 18 },
      { minQty: 500, unitPrice: 14 },
    ],
    0.5,
  );
  assert.equal(ranges[0].maxQty, 499.5);
});

test("tier ranges sort unordered input", () => {
  const ranges = buildTierRanges([
    { minQty: 500, unitPrice: 14 },
    { minQty: 100, unitPrice: 18 },
  ]);
  assert.equal(ranges[0].minQty, 100);
});

test("saving is measured against the first tier, not the previous one", () => {
  const r = resolvePrice({ product: product(), sku: idCard, quantity: 200 });
  assert.equal(r.savingVsFirstTier, 3);
});

test("summarisePricing spans every priced SKU and ignores POR ones", () => {
  const summary = summarisePricing(product({ moq: 20 }), [
    sku({
      moq: 20,
      priceTiers: [
        { minQty: 20, unitPrice: 50 },
        { minQty: 100, unitPrice: 35 },
      ],
    }),
    sku({
      moq: 50,
      priceTiers: [
        { minQty: 50, unitPrice: 45 },
        { minQty: 100, unitPrice: 40 },
      ],
    }),
    sku({ priceOnRequest: true }),
  ]);

  assert.equal(summary.minUnitPrice, 35);
  assert.equal(summary.maxUnitPrice, 50);
  assert.equal(summary.effectiveMoq, 20);
  assert.equal(summary.anyOnRequest, true);
});

test("option signature is order-independent on input, ordered on output", () => {
  const a = buildOptionSignature([
    { position: 2, optionValueId: "b" },
    { position: 1, optionValueId: "a" },
  ]);
  const b = buildOptionSignature([
    { position: 1, optionValueId: "a" },
    { position: 2, optionValueId: "b" },
  ]);
  assert.equal(a, "a,b");
  assert.equal(a, b, "the same combination must always produce the same key");
});

test("snapQuantity honours the step and never returns zero", () => {
  assert.equal(snapQuantity(137, 0.5), 137);
  assert.equal(snapQuantity(0, 10), 10);
  assert.equal(snapQuantity(-5, 1), 1);
  assert.equal(snapQuantity(23, 10), 20);
});
