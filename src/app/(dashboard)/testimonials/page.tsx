import type { Metadata } from "next";

import { ContentManager } from "@/components/content/ContentManager";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Testimonials" };
export const dynamic = "force-dynamic";

export default async function TestimonialsAdminPage() {
  const rows = await prisma.testimonial.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Testimonials"
        description="Client quotes. Use real, attributable ones only — invented praise is both dishonest and easy to spot."
      />
      <ContentManager
        kind="testimonial"
        rows={rows}
        title="Testimonial"
        emptyTitle="No testimonials yet"
        emptyDescription="Ask for two sentences right after a successful delivery — that is when clients are most willing."
        fields={[
          {
            name: "quote",
            label: "Quote",
            type: "textarea",
            required: true,
            inList: true,
            wide: true,
          },
          {
            name: "authorName",
            label: "Author",
            type: "text",
            required: true,
            inList: true,
          },
          { name: "authorRole", label: "Role", type: "text" },
          { name: "company", label: "Company", type: "text", inList: true },
          { name: "avatarPath", label: "Avatar path", type: "text", wide: true },
          { name: "rating", label: "Rating (1-5)", type: "number" },
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
