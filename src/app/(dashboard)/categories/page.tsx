import type { Metadata } from "next";

import { CategoriesManager } from "@/components/categories/CategoriesManager";
import { PageHeader } from "@/components/layout/PageHeader";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Categories" };
export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  await requireAdmin();

  const rows = await prisma.category.findMany({
    where: { deletedAt: null },
    orderBy: [{ sortOrder: "asc" }],
    select: {
      id: true,
      name: true,
      slug: true,
      parentId: true,
      description: true,
      iconKey: true,
      sortOrder: true,
      status: true,
      _count: { select: { products: true, children: true } },
    },
  });

  return (
    <>
      <PageHeader
        title="Categories"
        description="Two levels maximum — the storefront nav is a two-level mega-menu and the database rejects anything deeper."
      />
      <CategoriesManager
        categories={rows.map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          parentId: c.parentId,
          description: c.description,
          iconKey: c.iconKey,
          sortOrder: c.sortOrder,
          status: c.status,
          productCount: c._count.products,
          childCount: c._count.children,
        }))}
      />
    </>
  );
}
