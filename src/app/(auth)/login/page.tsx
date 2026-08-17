import type { Metadata } from "next";
import { Suspense } from "react";

import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <p className="text-lg font-semibold tracking-tight text-ink">
            CorpoMerch <span className="text-brand">Admin</span>
          </p>
          <p className="mt-1 text-xs text-muted">
            Catalogue and inquiry management
          </p>
        </div>

        <div className="rounded-xl border border-line bg-white p-6 shadow-sm">
          <Suspense
            fallback={<div className="h-52 animate-pulse rounded-lg bg-surface-alt" />}
          >
            <LoginForm />
          </Suspense>
        </div>

        <p className="mt-5 text-center text-xs text-faint">
          Accounts are created by an existing administrator. There is no public
          sign-up.
        </p>
      </div>
    </main>
  );
}
