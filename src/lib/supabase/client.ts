"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Browser client. Used for sign-in, sign-out and Storage uploads only. */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
