import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  FolderTree,
  Inbox,
  Info,
  Package,
  TrendingUp,
} from "lucide-react";

import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, Button, Card, CardHeader, EmptyState } from "@/components/ui";
import { getCatalogueHealth } from "@/lib/health";
import { prisma } from "@/lib/prisma";
import { formatBDT } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS_TONE = {
  NEW: "brand",
  CONTACTED: "info",
  QUOTED: "warning",
  WON: "success",
  LOST: "muted",
  SPAM: "muted",
} as const;

export default async function DashboardPage() {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    productCount,
    publishedCount,
    categoryCount,
    skuCount,
    newInquiries,
    recentInquiries,
    inquiries30d,
    topProducts,
    health,
  ] = await Promise.all([
    prisma.product.count({ where: { deletedAt: null } }),
    prisma.product.count({ where: { deletedAt: null, status: "PUBLISHED" } }),
    prisma.category.count({ where: { deletedAt: null } }),
    prisma.sku.count({ where: { isActive: true, deletedAt: null } }),
    prisma.inquiry.count({ where: { status: "NEW" } }),
    prisma.inquiry.findMany({
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        ref: true,
        status: true,
        source: true,
        name: true,
        company: true,
        totalEstimate: true,
        createdAt: true,
        _count: { select: { items: true } },
      },
    }),
    prisma.inquiry.count({ where: { createdAt: { gte: since } } }),
    prisma.inquiryItem.groupBy({
      by: ["productId", "productNameSnapshot"],
      _count: { _all: true },
      orderBy: { _count: { productId: "desc" } },
      take: 5,
      where: { createdAt: { gte: since } },
    }),
    getCatalogueHealth(),
  ]);

  const warnings = health.filter((h) => h.severity === "warning");
  const infos = health.filter((h) => h.severity === "info");

  const stats = [
    {
      label: "Products",
      value: `${publishedCount}/${productCount}`,
      hint: "published / total",
      icon: Package,
      href: "/products",
    },
    {
      label: "Active variants",
      value: String(skuCount),
      hint: "priceable SKUs",
      icon: FolderTree,
      href: "/products",
    },
    {
      label: "New inquiries",
      value: String(newInquiries),
      hint: "awaiting first contact",
      icon: Inbox,
      href: "/inquiries?status=NEW",
    },
    {
      label: "Inquiries, 30 days",
      value: String(inquiries30d),
      hint: "all statuses",
      icon: TrendingUp,
      href: "/inquiries",
    },
  ];

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Catalogue health and inquiry activity at a glance."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="p-5 transition-all hover:-translate-y-0.5 hover:shadow-md">
              <div className="flex items-start justify-between">
                <span className="flex size-9 items-center justify-center rounded-lg bg-brand-tint text-brand">
                  <stat.icon className="size-4" aria-hidden />
                </span>
              </div>
              <p className="mt-3 text-2xl font-semibold tabular-nums text-ink">
                {stat.value}
              </p>
              <p className="text-xs font-medium text-body">{stat.label}</p>
              <p className="mt-0.5 text-[11px] text-faint">{stat.hint}</p>
            </Card>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader
            title="Recent inquiries"
            description="Newest first"
            action={
              <Button asChild variant="outline" size="sm">
                <Link href="/inquiries">
                  View all
                  <ArrowRight className="size-3.5" aria-hidden />
                </Link>
              </Button>
            }
          />
          {recentInquiries.length === 0 ? (
            <div className="p-5">
              <EmptyState
                icon={<Inbox className="size-8" />}
                title="No inquiries yet"
                description="They will appear here the moment someone presses Send Inquiry on the storefront."
              />
            </div>
          ) : (
            <ul className="divide-y divide-line">
              {recentInquiries.map((inquiry) => (
                <li key={inquiry.id}>
                  <Link
                    href={`/inquiries/${inquiry.id}`}
                    className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-surface"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-medium text-ink">
                          #{inquiry.ref}
                        </span>
                        <Badge tone={STATUS_TONE[inquiry.status]}>
                          {inquiry.status.toLowerCase()}
                        </Badge>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-muted">
                        {inquiry.name || inquiry.company || "Anonymous"} ·{" "}
                        {inquiry._count.items} item
                        {inquiry._count.items === 1 ? "" : "s"} ·{" "}
                        {inquiry.source.toLowerCase()}
                      </p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-sm font-medium tabular-nums text-ink">
                        {inquiry.totalEstimate
                          ? formatBDT(inquiry.totalEstimate.toNumber())
                          : "—"}
                      </p>
                      <p className="text-[11px] text-faint">
                        {inquiry.createdAt.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader
              title="Data health"
              description={`${warnings.length} warning${warnings.length === 1 ? "" : "s"}, ${infos.length} note${infos.length === 1 ? "" : "s"}`}
            />
            <div className="max-h-96 overflow-y-auto scrollbar-thin">
              {health.length === 0 ? (
                <p className="flex items-center gap-2 px-5 py-6 text-sm text-success">
                  <CheckCircle2 className="size-4" aria-hidden />
                  Everything looks correct.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {[...warnings, ...infos].map((issue, i) => (
                    <li key={`${issue.productId}-${issue.kind}-${i}`}>
                      <Link
                        href={`/products/${issue.productId}`}
                        className="flex gap-2.5 px-5 py-3 transition-colors hover:bg-surface"
                      >
                        {issue.severity === "warning" ? (
                          <AlertTriangle
                            className="mt-0.5 size-3.5 shrink-0 text-warning"
                            aria-hidden
                          />
                        ) : (
                          <Info
                            className="mt-0.5 size-3.5 shrink-0 text-info"
                            aria-hidden
                          />
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-ink">
                            {issue.productName}
                          </p>
                          <p className="mt-0.5 text-xs leading-relaxed text-muted">
                            {issue.message}
                          </p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          <Card>
            <CardHeader
              title="Most asked about"
              description="Last 30 days"
            />
            {topProducts.length === 0 ? (
              <p className="px-5 py-6 text-sm text-muted">
                No inquiry data yet.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {topProducts.map((row) => (
                  <li
                    key={row.productId ?? row.productNameSnapshot}
                    className="flex items-center justify-between px-5 py-2.5"
                  >
                    <span className="truncate text-xs text-body">
                      {row.productNameSnapshot}
                    </span>
                    <span className="ml-3 shrink-0 text-xs font-semibold tabular-nums text-ink">
                      {row._count._all}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}
