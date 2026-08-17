import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/PageHeader";
import { InquiriesTable } from "@/components/inquiries/InquiriesTable";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Inquiries" };
export const dynamic = "force-dynamic";

const PER_PAGE = 30;

export default async function InquiriesPage(props: PageProps<"/inquiries">) {
  const sp = await props.searchParams;
  const one = (key: string) => {
    const v = sp[key];
    return Array.isArray(v) ? v[0] : v;
  };

  const status = one("status");
  const q = one("q")?.trim() ?? "";
  const page = Math.max(1, Number(one("page")) || 1);

  const where = {
    ...(status ? { status: status as never } : {}),
    ...(q
      ? {
          OR: [
            { ref: { contains: q, mode: "insensitive" as const } },
            { name: { contains: q, mode: "insensitive" as const } },
            { company: { contains: q, mode: "insensitive" as const } },
            { phone: { contains: q } },
          ],
        }
      : {}),
  };

  const [rows, total, counts] = await Promise.all([
    prisma.inquiry.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PER_PAGE,
      take: PER_PAGE,
      select: {
        id: true,
        ref: true,
        status: true,
        source: true,
        name: true,
        company: true,
        phone: true,
        totalEstimate: true,
        createdAt: true,
        items: { select: { productNameSnapshot: true, quantity: true } },
      },
    }),
    prisma.inquiry.count({ where }),
    prisma.inquiry.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  return (
    <>
      <PageHeader
        title="Inquiries"
        description="Every WhatsApp quote request, logged as it was sent."
      />
      <InquiriesTable
        inquiries={rows.map((r) => ({
          id: r.id,
          ref: r.ref,
          status: r.status,
          source: r.source,
          name: r.name,
          company: r.company,
          phone: r.phone,
          totalEstimate: r.totalEstimate?.toNumber() ?? null,
          createdAt: r.createdAt.toISOString(),
          summary: r.items
            .map((i) => `${i.productNameSnapshot} ×${i.quantity.toString()}`)
            .join(", "),
          itemCount: r.items.length,
        }))}
        total={total}
        page={page}
        perPage={PER_PAGE}
        statusCounts={Object.fromEntries(counts.map((c) => [c.status, c._count._all]))}
      />
    </>
  );
}
