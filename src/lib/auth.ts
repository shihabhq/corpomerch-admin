import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export interface AdminSession {
  userId: string;
  email: string;
  fullName: string | null;
  role: "ADMIN" | "EDITOR";
}

/**
 * A valid Supabase session is NOT authorisation.
 *
 * Anyone who can reach the Supabase project could in principle obtain a session.
 * Authorisation is the `admin_users` row: it must exist and be active. Every
 * server action calls requireAdmin() independently — proxy.ts only handles
 * redirects and cookie refresh, and must never be treated as the gate.
 */
export const getAdminSession = cache(async (): Promise<AdminSession | null> => {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;

  const admin = await prisma.adminUser.findUnique({
    where: { id: user.id },
    select: { id: true, email: true, fullName: true, role: true, isActive: true },
  });

  if (!admin?.isActive) return null;

  return {
    userId: admin.id,
    email: admin.email,
    fullName: admin.fullName,
    role: admin.role,
  };
});

/**
 * Use at the top of every page and server action behind the dashboard.
 *
 * The `denied` flag matters: without it, a visitor holding a valid Supabase
 * session but no admin_users row bounces between here and proxy.ts forever
 * (proxy sees a session and pushes them to `/`, this pushes them back). The
 * login page reads the flag, signs the stale session out and explains why.
 */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (session) return session;

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  redirect(user ? "/login?denied=1" : "/login");
}

/** Server-action variant: returns an error object instead of redirecting. */
export async function assertAdmin(): Promise<
  { ok: true; session: AdminSession } | { ok: false; error: string }
> {
  const session = await getAdminSession();
  if (!session) {
    return { ok: false, error: "Not authorised. Sign in again." };
  }
  return { ok: true, session };
}
