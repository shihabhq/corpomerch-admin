import type { Metadata } from "next";

import { ContentManager } from "@/components/content/ContentManager";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Portfolio" };
export const dynamic = "force-dynamic";

export default async function PortfolioAdminPage() {
  const rows = await prisma.portfolioItem.findMany({
    orderBy: [{ sortOrder: "asc" }, { eventDate: "desc" }],
  });

  return (
    <>
      <PageHeader
        title="Portfolio"
        description="Case studies shown on /portfolio. These rank well for event-supplier searches, so write them for a reader, not a checklist."
      />
      <ContentManager
        kind="portfolio"
        rows={rows.map((row) => ({
          ...row,
          eventDate: row.eventDate ? row.eventDate.toISOString() : "",
        }))}
        title="Portfolio entry"
        emptyTitle="No case studies yet"
        emptyDescription="Write up a recent event: what it was, what you supplied and in what quantities."
        defaults={{ status: "DRAFT" }}
        fields={[
          {
            name: "title",
            label: "Title",
            type: "text",
            required: true,
            inList: true,
          },
          {
            name: "slug",
            label: "Slug",
            type: "text",
            hint: "Leave blank to generate from the title.",
          },
          { name: "client", label: "Client", type: "text", inList: true },
          {
            name: "eventType",
            label: "Event type",
            type: "text",
            placeholder: "Career fair",
          },
          { name: "eventDate", label: "Event date", type: "date" },
          { name: "summary", label: "Summary", type: "textarea", wide: true },
          {
            name: "description",
            label: "Full write-up",
            type: "textarea",
            wide: true,
          },
          {
            name: "coverPath",
            label: "Cover image path",
            type: "text",
            wide: true,
          },
          {
            name: "status",
            label: "Status",
            type: "select",
            inList: true,
            options: [
              { value: "DRAFT", label: "Draft" },
              { value: "PUBLISHED", label: "Published" },
              { value: "ARCHIVED", label: "Archived" },
            ],
          },
          { name: "sortOrder", label: "Sort order", type: "number" },
        ]}
      />
    </>
  );
}
