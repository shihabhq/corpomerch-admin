import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/PageHeader";
import { SettingsForm } from "@/components/settings/SettingsForm";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Site settings" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  await requireAdmin();

  const settings = await prisma.siteSetting.findUnique({ where: { id: 1 } });

  return (
    <>
      <PageHeader
        title="Site settings"
        description="Contact details, the WhatsApp number every inquiry is sent to, and the storefront's default SEO copy."
      />
      <SettingsForm
        defaults={{
          whatsappNumber: settings?.whatsappNumber ?? "8801612170202",
          contactEmail: settings?.contactEmail ?? "backstageltd.int@gmail.com",
          contactPhone: settings?.contactPhone ?? "+880 1612-170202",
          addressLine:
            settings?.addressLine ??
            "Shop 128, 68-69 Concept Tower, Greenroad, Panthapath",
          addressCity: settings?.addressCity ?? "Dhaka 1205, Bangladesh",
          mapUrl: settings?.mapUrl ?? "",
          facebookUrl: settings?.facebookUrl ?? "",
          instagramUrl: settings?.instagramUrl ?? "",
          linkedinUrl: settings?.linkedinUrl ?? "",
          defaultSeoTitle: settings?.defaultSeoTitle ?? "",
          defaultSeoDescription: settings?.defaultSeoDescription ?? "",
          announcementText: settings?.announcementText ?? "",
          announcementActive: settings?.announcementActive ?? false,
        }}
      />
    </>
  );
}
