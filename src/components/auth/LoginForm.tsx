"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { AlertCircle, Loader2 } from "lucide-react";

import { Button, Field, Input } from "@/components/ui";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const DENIED_MESSAGE =
  "That account exists but has not been granted admin access. Ask an existing administrator to add you on the Admin users screen, then sign in again.";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "/";
  const denied = searchParams.get("denied") === "1";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(denied ? DENIED_MESSAGE : null);
  const [busy, setBusy] = useState(false);

  /**
   * Clear the rejected session. Without this the cookie survives, proxy.ts
   * keeps seeing a signed-in user, and any navigation restarts the redirect
   * loop this page exists to break.
   */
  useEffect(() => {
    if (!denied) return;
    void createSupabaseBrowserClient().auth.signOut();
  }, [denied]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      // Don't reveal whether the address exists.
      setError("Those credentials didn't work. Check and try again.");
      setBusy(false);
      return;
    }

    // A session alone is not authorisation — requireAdmin() on the dashboard
    // checks for an active admin_users row and bounces back here if there
    // isn't one.
    router.push(next);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label="Email address" htmlFor="email" required>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="username"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@backstage.com"
        />
      </Field>

      <Field label="Password" htmlFor="password" required>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
      </Field>

      {error ? (
        <p
          role="alert"
          className="flex items-start gap-2 rounded-lg border border-brand/20 bg-brand-tint px-3 py-2.5 text-xs text-brand"
        >
          <AlertCircle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
