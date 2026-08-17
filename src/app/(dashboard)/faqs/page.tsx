import type { Metadata } from "next";

import { ContentManager } from "@/components/content/ContentManager";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "FAQs" };
export const dynamic = "force-dynamic";

export default async function FaqsPage() {
  const rows = await prisma.faq.findMany({ orderBy: [{ sortOrder: "asc" }] });

  return (
    <>
      <PageHeader
        title="FAQs"
        description="Shown on /faq, and the first few appear on the home page. Also emitted as FAQPage structured data, so a clear answer can win a rich result."
      />
      <ContentManager
        kind="faq"
        rows={rows}
        title="FAQ"
        emptyTitle="No FAQs yet"
        emptyDescription="Answer the questions people ask before their first order — MOQ, artwork formats, turnaround, payment terms."
        fields={[
          {
            name: "question",
            label: "Question",
            type: "text",
            required: true,
            inList: true,
            wide: true,
          },
          {
            name: "answer",
            label: "Answer",
            type: "textarea",
            required: true,
            wide: true,
          },
          {
            name: "category",
            label: "Group",
            type: "select",
            inList: true,
            options: [
              { value: "ordering", label: "Ordering & pricing" },
              { value: "printing", label: "Artwork & printing" },
              { value: "delivery", label: "Production & delivery" },
              { value: "payment", label: "Payment" },
            ],
          },
          { name: "sortOrder", label: "Sort order", type: "number" },
          {
            name: "isActive",
            label: "Visible on the site",
            type: "switch",
            inList: true,
          },
        ]}
      />
    </>
  );
}
