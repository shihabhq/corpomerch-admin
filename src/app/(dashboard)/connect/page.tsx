import type { Metadata } from "next";

import { ConnectManager } from "@/components/connect/ConnectManager";
import { PageHeader } from "@/components/layout/PageHeader";
import { requireAdmin } from "@/lib/auth";
import { connectUrl } from "@/lib/connect";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Connect cards" };
export const dynamic = "force-dynamic";

export default async function ConnectCardsPage() {
  await requireAdmin();

  const cards = await prisma.connectCard.findMany({
    orderBy: { createdAt: "desc" },
    take: 500,
    select: {
      id: true,
      slug: true,
      label: true,
      ownerEmail: true,
      ownerId: true,
      claimedAt: true,
      isActive: true,
      createdAt: true,
    },
  });

  return (
    <>
      <PageHeader
        title="Connect cards"
        description="Create the link for a customer's NFC card. They claim it by registering when they first tap or scan."
      />
      <ConnectManager
        cards={cards.map((c) => ({
          id: c.id,
          slug: c.slug,
          url: connectUrl(c.slug),
          label: c.label,
          ownerEmail: c.ownerEmail,
          claimed: c.ownerId !== null,
          claimedAt: c.claimedAt?.toISOString() ?? null,
          isActive: c.isActive,
          createdAt: c.createdAt.toISOString(),
        }))}
      />
    </>
  );
}
