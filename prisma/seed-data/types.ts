/** Shapes for the seed catalogue. Kept separate so the data file stays readable. */

export type SeedUnit = "PC" | "SET" | "SQFT" | "PAIR" | "BOX" | "SHEET";
export type SeedDisplay = "CHIP" | "SWATCH" | "DROPDOWN" | "IMAGE";

export interface SeedSpec {
  group?: string;
  key: string;
  value: string;
}

export interface SeedTier {
  minQty: number;
  unitPrice: number;
}

export interface SeedOptionValue {
  label: string;
  code: string;
  swatchHex?: string;
  description?: string;
  isDefault?: boolean;
  /**
   * Source filenames (no extension) from corpomerch-client/public/Product Gallery/.
   * Only meaningful on the axis at position 1 — those are the images the
   * storefront swaps in when the value is selected.
   */
  images?: string[];
}

export interface SeedOption {
  name: string;
  /** 1 swaps images; 2 and 3 affect price only. */
  position: 1 | 2 | 3;
  displayAs: SeedDisplay;
  helpText?: string;
  values: SeedOptionValue[];
}

export interface SeedSku {
  code: string;
  /** optionName -> value code. Omit entirely for an option-less product. */
  values?: Record<string, string>;
  moq?: number;
  priceOnRequest?: boolean;
  tiers?: SeedTier[];
}

export interface SeedProduct {
  slug: string;
  name: string;
  subtitle?: string;
  shortDescription: string;
  /** Markdown. */
  description: string;
  specs: SeedSpec[];
  tags: string[];

  unit: SeedUnit;
  unitLabel?: string;
  qtyStep?: number;
  moq?: number;
  pricingMode?: "TIERED" | "ON_REQUEST";

  leadTimeDaysMin?: number;
  leadTimeDaysMax?: number;

  isFeatured?: boolean;
  badgeText?: string;
  sortOrder?: number;

  /** First entry is the primary category. */
  categories: string[];

  /** Gallery images shown for every variant. */
  sharedImages?: string[];

  options?: SeedOption[];
  skus: SeedSku[];

  seoTitle?: string;
  seoDescription?: string;
}

export interface SeedCategory {
  slug: string;
  name: string;
  parent?: string;
  description?: string;
  iconKey?: string;
  sortOrder: number;
}
