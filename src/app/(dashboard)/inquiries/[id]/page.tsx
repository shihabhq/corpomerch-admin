import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Mail, Phone, User } from "lucide-react";

import { InquiryDetailPanel } from "@/components/inquiries/InquiryDetailPanel";
import { PageHeader } from "@/components/layout/PageHeader";
import { Badge, Card, CardHeader } from "@/components/ui";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatBDT, formatQty } from "@/lib/utils";
import { STATUS_TONE } from "@/components/inquiries/InquiriesTable";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/inquiries/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;
  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    select: { ref: true },
  });
  return { title: inquiry ? `#${inquiry.ref}` : "Inquiry" };
}

export default async function InquiryDetailPage(
  props: PageProps<"/inquiries/[id]">,
) {
  await requireAdmin();
  const { id } = await props.params;

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      items: { orderBy: { createdAt: "asc" } },
      assignee: { select: { fullName: true, email: true } },
    },
  });

  if (!inquiry) notFound();

  const storefront = process.env.STOREFRONT_URL ?? "http://localhost:3000";

  return (
    <>
      <Link
        href="/inquiries"
        className="mb-4 inline-flex items-center gap-1.5 text-xs text-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="size-3.5" aria-hidden />
        All inquiries
      </Link>

      <PageHeader
        title={`#${inquiry.ref}`}
        description={`${inquiry.source.toLowerCase()} · ${inquiry.createdAt.toLocaleString("en-GB", {
          dateStyle: "full",
          timeStyle: "short",
        })}`}
        action={<Badge tone={STATUS_TONE[inquiry.status]}>{inquiry.status.toLowerCase()}</Badge>}
      />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr] lg:items-start">
        <div className="space-y-6">
          <Card>
            <CardHeader
              title="What they asked for"
              description={`${inquiry.items.length} line${inquiry.items.length === 1 ? "" : "s"}. Prices are the server-computed figures frozen at submission.`}
            />
            <ul className="divide-y divide-line">
              {inquiry.items.map((item) => {
                const options = Array.isArray(item.optionsSnapshot)
                  ? (item.optionsSnapshot as { option: string; value: string }[])
                  : [];
                return (
                  <li key={item.id} className="px-5 py-3.5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <a
                          href={`${storefront}/products/${item.productSlugSnapshot}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm font-medium text-ink hover:text-brand"
                        >
                          {item.productNameSnapshot}
                        </a>
                        {options.length > 0 ? (
                          <p className="mt-0.5 text-xs text-muted">
                            {options.map((o) => `${o.option}: ${o.value}`).join(" · ")}
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs tabular-nums text-body">
                          {formatQty(item.quantity.toNumber(), item.unitSnapshot)}
                          {item.unitPrice
                            ? ` @ ${formatBDT(item.unitPrice.toNumber())}`
                            : " — price on request"}
                        </p>
                        {item.note ? (
                          <p className="mt-1.5 rounded-lg bg-surface px-2.5 py-1.5 text-xs text-muted">
                            {item.note}
                          </p>
                        ) : null}
                      </div>
                      <p className="shrink-0 text-sm font-semibold tabular-nums text-ink">
                        {item.lineTotal ? formatBDT(item.lineTotal.toNumber()) : "—"}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="flex items-center justify-between border-t border-line bg-surface px-5 py-3">
              <span className="text-sm font-medium text-body">Estimated total</span>
              <span className="text-base font-semibold tabular-nums text-brand">
                {inquiry.totalEstimate
                  ? formatBDT(inquiry.totalEstimate.toNumber())
                  : "—"}
              </span>
            </div>
          </Card>

          {inquiry.message ? (
            <Card>
              <CardHeader title="Their message" />
              <p className="whitespace-pre-wrap px-5 py-4 text-sm leading-relaxed text-body">
                {inquiry.message}
              </p>
            </Card>
          ) : null}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader title="Contact" />
            <dl className="divide-y divide-line">
              {[
                { icon: User, label: "Name", value: inquiry.name },
                { icon: Building2, label: "Company", value: inquiry.company },
                { icon: Phone, label: "Phone", value: inquiry.phone },
                { icon: Mail, label: "Email", value: inquiry.email },
              ].map((row) => (
                <div key={row.label} className="flex items-center gap-3 px-5 py-2.5">
                  <row.icon className="size-3.5 shrink-0 text-faint" aria-hidden />
                  <dt className="w-20 shrink-0 text-xs text-muted">{row.label}</dt>
                  <dd className="min-w-0 flex-1 truncate text-xs text-ink">
                    {row.value || <span className="text-faint">not given</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </Card>

          <InquiryDetailPanel
            id={inquiry.id}
            ref_={inquiry.ref}
            status={inquiry.status}
            internalNote={inquiry.internalNote ?? ""}
            phone={inquiry.phone}
            assignee={
              inquiry.assignee
                ? (inquiry.assignee.fullName ?? inquiry.assignee.email)
                : null
            }
          />

          <Card>
            <CardHeader title="Technical" />
            <dl className="space-y-2 px-5 py-4 text-[11px]">
              <div>
                <dt className="text-muted">Referer</dt>
                <dd className="break-all font-mono text-faint">
                  {inquiry.referer ?? "—"}
                </dd>
              </div>
              <div>
                <dt className="text-muted">User agent</dt>
                <dd className="break-all font-mono text-faint">
                  {inquiry.userAgent ?? "—"}
                </dd>
              </div>
            </dl>
          </Card>
        </div>
      </div>
    </>
  );
}
