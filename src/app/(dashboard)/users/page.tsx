import type { Metadata } from "next";

import { PageHeader } from "@/components/layout/PageHeader";
import { UsersManager } from "@/components/users/UsersManager";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata: Metadata = { title: "Admin users" };
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const session = await requireAdmin();

  const users = await prisma.adminUser.findMany({
    orderBy: [{ isActive: "desc" }, { createdAt: "asc" }],
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      isActive: true,
      createdAt: true,
    },
  });

  return (
    <>
      <PageHeader
        title="Admin users"
        description="A Supabase session alone grants nothing — access requires an active row here."
      />
      <UsersManager
        users={users.map((u) => ({
          ...u,
          createdAt: u.createdAt.toISOString(),
        }))}
        currentUserId={session.userId}
        supabaseProjectUrl={process.env.NEXT_PUBLIC_SUPABASE_URL ?? ""}
      />
    </>
  );
}
