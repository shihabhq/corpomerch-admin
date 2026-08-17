"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import {
  Copy,
  ExternalLink,
  Package,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { toast } from "sonner";

import {
  deleteProducts,
  duplicateProduct,
  setProductStatus,
} from "@/app/actions/products";
import { Badge, Button, Card, Checkbox, EmptyState, Input } from "@/components/ui";
import { cn, formatBDT, formatQty } from "@/lib/utils";
import type { UnitKindLike } from "@/lib/pricing";

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  isFeatured: boolean;
  unit: UnitKindLike;
  unitLabel: string | null;
  minUnitPrice: number | null;
  maxUnitPrice: number | null;
  effectiveMoq: number | null;
  pricingMode: "TIERED" | "ON_REQUEST";
  updatedAt: string;
  imageUrl: string | null;
  categoryName: string | null;
  skuCount: number;
  imageCount: number;
}

const STATUS_TONE = {
  PUBLISHED: "success",
  DRAFT: "warning",
  ARCHIVED: "muted",
} as const;

const STOREFRONT_URL =
  process.env.NEXT_PUBLIC_STOREFRONT_URL ?? "http://localhost:3000";

export function ProductsTable({
  products,
  total,
  page,
  perPage,
  categories,
  statusCounts,
}: {
  products: ProductRow[];
  total: number;
  page: number;
  perPage: number;
  categories: { slug: string; name: string }[];
  statusCounts: Record<string, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const pageCount = Math.max(1, Math.ceil(total / perPage));

  function write(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    if (!("page" in updates)) params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function run(label: string, fn: () => Promise<{ ok: boolean; error?: string }>) {
    startTransition(async () => {
      const result = await fn();
      if (result.ok) {
        toast.success(label);
        setSelected(new Set());
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    });
  }

  const activeStatus = searchParams.get("status");
  const activeCategory = searchParams.get("category");
  const ids = [...selected];

  return (
    <Card>
      {/* Toolbar */}
      <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            write({ q: query });
          }}
          className="relative flex-1"
        >
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, slug or tag…"
            aria-label="Search products"
            className="pl-9"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                write({ q: null });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:text-ink"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </form>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border border-line p-0.5">
            {[
              { value: null, label: "All" },
              { value: "PUBLISHED", label: `Live ${statusCounts.PUBLISHED ?? 0}` },
              { value: "DRAFT", label: `Draft ${statusCounts.DRAFT ?? 0}` },
              { value: "ARCHIVED", label: "Archived" },
            ].map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => write({ status: option.value })}
                className={cn(
                  "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
                  (activeStatus ?? null) === option.value
                    ? "bg-brand-tint text-brand"
                    : "text-muted hover:text-ink",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <select
            value={activeCategory ?? ""}
            onChange={(e) => write({ category: e.target.value || null })}
            aria-label="Filter by category"
            className="h-9 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Bulk bar */}
      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-brand-tint px-4 py-2.5">
          <span className="text-xs font-medium text-brand">
            {selected.size} selected
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                run("Published", () => setProductStatus(ids, "PUBLISHED"))
              }
            >
              Publish
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() => run("Unpublished", () => setProductStatus(ids, "DRAFT"))}
            >
              Unpublish
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={pending}
              onClick={() => {
                if (
                  !confirm(
                    `Archive ${selected.size} product(s)? They stay in the database and inquiry history is preserved.`,
                  )
                )
                  return;
                run("Archived", () => deleteProducts(ids));
              }}
            >
              <Trash2 className="size-3.5" aria-hidden />
              Archive
            </Button>
          </div>
        </div>
      ) : null}

      {products.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={<Package className="size-8" />}
            title="No products match"
            description="Try clearing the search or filters."
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-left">
                <th scope="col" className="w-10 px-4 py-2.5">
                  <Checkbox
                    checked={selected.size === products.length && products.length > 0}
                    onCheckedChange={(checked) =>
                      setSelected(
                        checked ? new Set(products.map((p) => p.id)) : new Set(),
                      )
                    }
                    aria-label="Select all on this page"
                  />
                </th>
                {["Product", "Category", "Pricing", "Variants", "Status", ""].map(
                  (heading) => (
                    <th
                      key={heading}
                      scope="col"
                      className="px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-muted"
                    >
                      {heading}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((product) => (
                <tr key={product.id} className="hover:bg-surface">
                  <td className="px-4 py-2.5">
                    <Checkbox
                      checked={selected.has(product.id)}
                      onCheckedChange={() => toggle(product.id)}
                      aria-label={`Select ${product.name}`}
                    />
                  </td>

                  <td className="px-3 py-2.5">
                    <div className="flex items-center gap-3">
                      <div className="relative size-10 shrink-0 overflow-hidden rounded-lg border border-line bg-surface">
                        {product.imageUrl ? (
                          <Image
                            src={product.imageUrl}
                            alt=""
                            fill
                            sizes="40px"
                            className="object-contain p-1"
                          />
                        ) : (
                          <span className="flex size-full items-center justify-center text-faint">
                            <Package className="size-4" aria-hidden />
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/products/${product.id}`}
                          className="block truncate font-medium text-ink hover:text-brand"
                        >
                          {product.name}
                        </Link>
                        <p className="truncate font-mono text-[11px] text-faint">
                          /{product.slug}
                        </p>
                      </div>
                    </div>
                  </td>

                  <td className="px-3 py-2.5 text-xs text-muted">
                    {product.categoryName ?? "—"}
                  </td>

                  <td className="px-3 py-2.5">
                    {product.pricingMode === "ON_REQUEST" ||
                    product.minUnitPrice === null ? (
                      <span className="text-xs text-muted">On request</span>
                    ) : (
                      <div className="text-xs">
                        <span className="font-medium tabular-nums text-ink">
                          {formatBDT(product.minUnitPrice)}
                          {product.maxUnitPrice &&
                          product.maxUnitPrice !== product.minUnitPrice
                            ? ` – ${formatBDT(product.maxUnitPrice)}`
                            : ""}
                        </span>
                        {product.effectiveMoq ? (
                          <p className="text-faint">
                            MOQ{" "}
                            {formatQty(
                              product.effectiveMoq,
                              product.unit,
                              product.unitLabel,
                            )}
                          </p>
                        ) : null}
                      </div>
                    )}
                  </td>

                  <td className="px-3 py-2.5 text-xs tabular-nums text-muted">
                    {product.skuCount} sku{product.skuCount === 1 ? "" : "s"}
                    <span className="text-faint"> · {product.imageCount} img</span>
                  </td>

                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-1">
                      <Badge tone={STATUS_TONE[product.status]}>
                        {product.status.toLowerCase()}
                      </Badge>
                      {product.isFeatured ? <Badge tone="brand">featured</Badge> : null}
                    </div>
                  </td>

                  <td className="px-3 py-2.5">
                    <div className="flex items-center justify-end gap-0.5">
                      <Link
                        href={`/products/${product.id}`}
                        className="rounded-lg p-1.5 text-faint transition-colors hover:bg-surface-alt hover:text-ink"
                        aria-label={`Edit ${product.name}`}
                        title="Edit"
                      >
                        <Pencil className="size-3.5" />
                      </Link>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          run("Duplicated", async () => {
                            const result = await duplicateProduct(product.id);
                            if (result.ok) router.push(`/products/${result.data.id}`);
                            return result;
                          })
                        }
                        className="rounded-lg p-1.5 text-faint transition-colors hover:bg-surface-alt hover:text-ink"
                        aria-label={`Duplicate ${product.name}`}
                        title="Duplicate"
                      >
                        <Copy className="size-3.5" />
                      </button>
                      <a
                        href={`${STOREFRONT_URL}/products/${product.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-lg p-1.5 text-faint transition-colors hover:bg-surface-alt hover:text-ink"
                        aria-label={`View ${product.name} on the storefront`}
                        title="View on site"
                      >
                        <ExternalLink className="size-3.5" />
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-between border-t border-line px-4 py-3">
          <p className="text-xs text-muted">
            Page {page} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => write({ page: String(page - 1) })}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pageCount}
              onClick={() => write({ page: String(page + 1) })}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
