import type { Metadata } from "next";
import Link from "next/link";
import { Plus } from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { ProductsTable } from "@/components/products/ProductsTable";
import { Button } from "@/components/ui";
import { prisma } from "@/lib/prisma";
import { imageUrl } from "@/lib/storage";

export const metadata: Metadata = { title: "Products" };
export const dynamic = "force-dynamic";

const PER_PAGE = 25;

export default async function ProductsPage(
  props: PageProps<"/products">,
) {
  const sp = await props.searchParams;
  const one = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const q = one("q")?.trim() ?? "";
  const status = one("status");
  const categorySlug = one("category");
  const page = Math.max(1, Number(one("page")) || 1);

  // Server-side filtering and pagination. Never fetch the whole catalogue with
  // all relations — that is the mistake the reference admin makes.
  const where = {
    deletedAt: null,
    ...(status ? { status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED" } : {}),
    ...(categorySlug
      ? { categories: { some: { category: { slug: categorySlug } } } }
      : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { slug: { contains: q, mode: "insensitive" as const } },
            { tags: { hasSome: [q.toLowerCase()] } },
          ],
        }
      : {}),
  };

  const [rows, total, categories, counts] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        slug: true,
        name: true,
        status: true,
        isFeatured: true,
        unit: true,
        unitLabel: true,
        minUnitPrice: true,
        maxUnitPrice: true,
        effectiveMoq: true,
        pricingMode: true,
        updatedAt: true,
        primaryImage: {
          select: { storagePath: true, externalUrl: true, alt: true },
        },
        categories: {
          where: { isPrimary: true },
          select: { category: { select: { name: true } } },
          take: 1,
        },
        _count: { select: { skus: true, images: true } },
      },
    }),
    prisma.product.count({ where }),
    prisma.category.findMany({
      where: { deletedAt: null },
      orderBy: { sortOrder: "asc" },
      select: { slug: true, name: true },
    }),
    prisma.product.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { _all: true },
    }),
  ]);

  const products = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    status: row.status,
    isFeatured: row.isFeatured,
    unit: row.unit,
    unitLabel: row.unitLabel,
    minUnitPrice: row.minUnitPrice?.toNumber() ?? null,
    maxUnitPrice: row.maxUnitPrice?.toNumber() ?? null,
    effectiveMoq: row.effectiveMoq?.toNumber() ?? null,
    pricingMode: row.pricingMode,
    updatedAt: row.updatedAt.toISOString(),
    imageUrl: row.primaryImage ? imageUrl(row.primaryImage) : null,
    categoryName: row.categories[0]?.category.name ?? null,
    skuCount: row._count.skus,
    imageCount: row._count.images,
  }));

  return (
    <>
      <PageHeader
        title="Products"
        description={`${total} product${total === 1 ? "" : "s"} matching the current filters.`}
        action={
          <Button asChild>
            <Link href="/products/new">
              <Plus className="size-4" aria-hidden />
              New product
            </Link>
          </Button>
        }
      />

      <ProductsTable
        products={products}
        total={total}
        page={page}
        perPage={PER_PAGE}
        categories={categories}
        statusCounts={Object.fromEntries(
          counts.map((c) => [c.status, c._count._all]),
        )}
      />
    </>
  );
}
