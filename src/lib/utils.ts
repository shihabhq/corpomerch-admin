import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

import type { UnitKindLike } from "./pricing";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Every section wrapper uses this. Don't retype the literal. */
export const CONTAINER = "mx-auto w-full max-w-[1280px] px-4 sm:px-6";

// ─── Money ───────────────────────────────────────────────────────────────────

/** ৳1,200 — no decimals unless the amount actually has them. */
export function formatBDT(
  amount: number | null | undefined,
  opts: { decimals?: boolean } = {},
): string {
  if (amount === null || amount === undefined) return "—";
  const hasFraction = Math.abs(amount % 1) > 0.004;
  const showDecimals = opts.decimals ?? hasFraction;
  return `৳${amount.toLocaleString("en-BD", {
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  })}`;
}

// ─── Quantity & units ────────────────────────────────────────────────────────

const UNIT_LABELS: Record<UnitKindLike, { one: string; many: string }> = {
  PC: { one: "pc", many: "pcs" },
  SET: { one: "set", many: "sets" },
  SQFT: { one: "sq.ft.", many: "sq.ft." },
  PAIR: { one: "pair", many: "pairs" },
  BOX: { one: "box", many: "boxes" },
  SHEET: { one: "sheet", many: "sheets" },
};

export function unitLabel(
  unit: UnitKindLike,
  count = 2,
  override?: string | null,
): string {
  if (override) return override;
  const entry = UNIT_LABELS[unit] ?? UNIT_LABELS.PC;
  return count === 1 ? entry.one : entry.many;
}

/** "1,000 pcs" / "137.5 sq.ft." — drops the trailing .00 on whole numbers. */
export function formatQty(
  qty: number,
  unit: UnitKindLike,
  override?: string | null,
): string {
  const isWhole = Math.abs(qty % 1) < 0.004;
  const n = qty.toLocaleString("en-BD", {
    minimumFractionDigits: 0,
    maximumFractionDigits: isWhole ? 0 : 2,
  });
  return `${n} ${unitLabel(unit, qty, override)}`;
}

/** "50 – 99 pcs" / "1,000+ pcs" for a tier row. */
export function formatTierRange(
  minQty: number,
  maxQty: number | null,
  unit: UnitKindLike,
  override?: string | null,
): string {
  const label = unitLabel(unit, 2, override);
  const fmt = (n: number) =>
    n.toLocaleString("en-BD", {
      maximumFractionDigits: Math.abs(n % 1) < 0.004 ? 0 : 2,
    });
  return maxQty === null
    ? `${fmt(minQty)}+ ${label}`
    : `${fmt(minQty)} – ${fmt(maxQty)} ${label}`;
}

// ─── Text ────────────────────────────────────────────────────────────────────

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

/** Strip markdown/HTML down to plain prose for meta descriptions. */
export function toPlainText(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)]\([^)]*\)/g, "$1")
    .replace(/[#*_`>~|-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Short, unambiguous inquiry reference: CM-7Q2K (no 0/O/1/I). */
export function inquiryRef(): string {
  const alphabet = "23456789ACDEFGHJKLMNPQRSTUVWXYZ";
  let out = "";
  for (let i = 0; i < 4; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `CM-${out}`;
}
