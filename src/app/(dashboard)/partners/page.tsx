import type { Metadata } from "next";

import { ContentManager } from "@/components/content/ContentManager";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Partners" };
export const dynamic = "force-dynamic";

export default async function PartnersAdminPage() {
  const rows = await prisma.partner.findMany({ orderBy: { sortOrder: "asc" } });

  return (
    <>
      <PageHeader
        title="Partners & clients"
        description="Logos shown on /partners. Only list organisations that have agreed to be named publicly."
      />
      <ContentManager
        kind="partner"
        rows={rows}
        title="Partner"
        emptyTitle="No partners listed"
        emptyDescription="Add client logos once you have permission to display them. Until then the storefront shows a request-references panel instead."
        fields={[
          { name: "name", label: "Name", type: "text", required: true, inList: true },
          {
            name: "logoPath",
            label: "Logo path",
            type: "text",
            hint: "Path inside the site-assets bucket, or a full URL.",
            inList: true,
            wide: true,
          },
          {
            name: "website",
            label: "Website",
            type: "text",
            placeholder: "https://",
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
