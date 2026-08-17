import Link from "next/link";
import { Compass } from "lucide-react";

/**
 * Root 404 — an unknown URL outside the dashboard group. Rendered without the
 * sidebar because the dashboard layout (and its auth check) never runs here.
 */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-sm rounded-xl border border-line bg-white p-8 text-center shadow-sm">
        <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-surface-alt text-muted">
          <Compass className="size-6" aria-hidden />
        </span>

        <p className="mt-5 text-xs font-semibold uppercase tracking-[0.12em] text-brand">
          404
        </p>
        <h1 className="mt-1 text-lg font-semibold text-ink">Page not found</h1>
        <p className="mt-2 text-sm text-muted">
          That address doesn&apos;t exist in the admin panel.
        </p>

        <Link
          href="/"
          className="mt-6 inline-flex h-9 items-center justify-center rounded-lg bg-brand px-4 text-sm font-medium text-white transition-colors hover:bg-brand-dark"
        >
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}
