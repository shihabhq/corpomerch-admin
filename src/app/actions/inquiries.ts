"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { ActionResult } from "@/app/actions/products";

const STATUSES = [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "WON",
  "LOST",
  "SPAM",
] as const;

export type InquiryStatusValue = (typeof STATUSES)[number];

export async function updateInquiry(
  id: string,
  data: { status?: InquiryStatusValue; internalNote?: string; assignToMe?: boolean },
): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  if (data.status && !STATUSES.includes(data.status)) {
    return { ok: false, error: "Unknown status." };
  }

  await prisma.inquiry.update({
    where: { id },
    data: {
      ...(data.status ? { status: data.status } : {}),
      ...(data.internalNote !== undefined
        ? { internalNote: data.internalNote.slice(0, 4000) }
        : {}),
      ...(data.assignToMe ? { assignedTo: auth.session.userId } : {}),
    },
  });

  revalidatePath("/inquiries");
  revalidatePath(`/inquiries/${id}`);
  revalidatePath("/");
  return { ok: true, data: undefined };
}

export async function bulkUpdateInquiryStatus(
  ids: string[],
  status: InquiryStatusValue,
): Promise<ActionResult> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  await prisma.inquiry.updateMany({ where: { id: { in: ids } }, data: { status } });

  revalidatePath("/inquiries");
  revalidatePath("/");
  return { ok: true, data: undefined };
}

/** CSV export of the current filter. Returned as a string for the browser to save. */
export async function exportInquiriesCsv(
  status?: InquiryStatusValue,
): Promise<ActionResult<string>> {
  const auth = await assertAdmin();
  if (!auth.ok) return { ok: false, error: auth.error };

  const inquiries = await prisma.inquiry.findMany({
    where: status ? { status } : {},
    orderBy: { createdAt: "desc" },
    take: 5000,
    include: { items: true },
  });

  const escape = (value: unknown) => {
    const s = value === null || value === undefined ? "" : String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };

  const header = [
    "ref",
    "created",
    "status",
    "source",
    "name",
    "company",
    "phone",
    "email",
    "total_estimate",
    "items",
    "detail",
  ];

  const rows = inquiries.map((inquiry) =>
    [
      inquiry.ref,
      inquiry.createdAt.toISOString(),
      inquiry.status,
      inquiry.source,
      inquiry.name,
      inquiry.company,
      inquiry.phone,
      inquiry.email,
      inquiry.totalEstimate?.toString() ?? "",
      inquiry.items.length,
      inquiry.items
        .map(
          (item) =>
            `${item.productNameSnapshot} x${item.quantity.toString()}${
              item.unitPrice ? ` @ ${item.unitPrice.toString()}` : " (on request)"
            }`,
        )
        .join(" | "),
    ]
      .map(escape)
      .join(","),
  );

  return { ok: true, data: [header.join(","), ...rows].join("\n") };
}
