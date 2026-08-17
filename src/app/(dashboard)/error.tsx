"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCcw } from "lucide-react";

import { Button, Card } from "@/components/ui";

/**
 * Scoped to the dashboard group, so a failed page still renders inside the
 * sidebar shell and the operator can navigate somewhere else instead of
 * hitting a dead end.
 */
export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[admin]", error);
  }, [error]);

  // The pooler is in Tokyo and the admin is entirely dynamic, so a dropped
  // connection is the overwhelmingly likely cause. Say so — it changes what
  // the operator does next.
  const looksLikeDatabase = /prisma|connect|timeout|pool|ECONNRESET|terminat/i.test(
    error.message,
  );

  return (
    <Card className="mx-auto max-w-lg p-8 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-warning-tint text-warning">
        <AlertTriangle className="size-6" aria-hidden />
      </span>

      <h1 className="mt-5 text-lg font-semibold text-ink">
        This screen failed to load
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        {looksLikeDatabase
          ? "The database connection dropped. This is usually transient — try again in a moment."
          : "Something went wrong rendering this page. Nothing has been saved or changed."}
      </p>

      <div className="mt-6 flex justify-center gap-3">
        <Button type="button" onClick={reset}>
          <RotateCcw className="size-4" aria-hidden />
          Try again
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back to dashboard</Link>
        </Button>
      </div>

      {error.digest ? (
        <p className="mt-5 font-mono text-[11px] text-faint">
          error {error.digest}
        </p>
      ) : null}
    </Card>
  );
}
