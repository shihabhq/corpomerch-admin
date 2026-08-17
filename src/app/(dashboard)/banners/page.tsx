import type { Metadata } from "next";

import { ContentManager } from "@/components/content/ContentManager";
import { PageHeader } from "@/components/layout/PageHeader";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Banners" };
export const dynamic = "force-dynamic";

export default async function BannersAdminPage() {
  const rows = await prisma.homepageBanner.findMany({
    orderBy: { sortOrder: "asc" },
  });

  return (
    <>
      <PageHeader
        title="Homepage banners"
        description="While this is empty the storefront renders its designed typographic hero with a rotating product collage — a perfectly good default. Add banners only when you have wide campaign artwork (roughly 2:1), not square product shots."
      />
      <ContentManager
        kind="banner"
        rows={rows}
        title="Banner"
        emptyTitle="No banners — the designed hero is in use"
        emptyDescription="Nothing is broken. Add a banner here only when there is real campaign artwork worth leading with."
        fields={[
          {
            name: "title",
            label: "Headline",
            type: "text",
            required: true,
            inList: true,
          },
          { name: "subtitle", label: "Subheading", type: "text", wide: true },
          {
            name: "imagePath",
            label: "Image path",
            type: "text",
            required: true,
            wide: true,
            hint: "Path inside the site-assets bucket, or a full URL.",
          },
          {
            name: "mobileImagePath",
            label: "Mobile image path",
            type: "text",
            wide: true,
          },
          {
            name: "alt",
            label: "Alt text",
            type: "text",
            required: true,
            wide: true,
          },
          { name: "ctaLabel", label: "Button label", type: "text" },
          {
            name: "ctaHref",
            label: "Button link",
            type: "text",
            placeholder: "/products",
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
