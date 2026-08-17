import { Card } from "@/components/ui";
import { cn } from "@/lib/utils";

/**
 * Shared loading skeletons.
 *
 * IMPORTANT: a `loading.tsx` creates a Suspense boundary, and the 200 shell is
 * flushed before any `notFound()` below it can throw — which turns a 404 into a
 * soft 200. So these are only used on leaf routes with no 404-capable
 * descendants. `/products` and `/inquiries` deliberately have none, because
 * `[id]` sits under them. Same rule as the storefront (see its CLAUDE.md).
 */

function Bar({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded bg-surface-alt", className)} />;
}

export function PageHeaderSkeleton() {
  return (
    <div className="mb-6">
      <Bar className="h-6 w-48" />
      <Bar className="mt-2 h-4 w-80 max-w-full" />
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <>
      <PageHeaderSkeleton />
      <Card>
        <div className="border-b border-line p-4">
          <Bar className="h-9 w-full max-w-md" />
        </div>
        <div className="divide-y divide-line">
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 px-5 py-3">
              <Bar className="size-9 shrink-0 rounded-lg" />
              <div className="min-w-0 flex-1">
                <Bar className="h-3.5 w-1/3" />
                <Bar className="mt-1.5 h-3 w-1/4" />
              </div>
              <Bar className="h-5 w-16 shrink-0 rounded-full" />
            </div>
          ))}
        </div>
      </Card>
    </>
  );
}

export function FormSkeleton() {
  return (
    <>
      <PageHeaderSkeleton />
      <div className="space-y-6">
        {[0, 1].map((card) => (
          <Card key={card}>
            <div className="border-b border-line px-5 py-4">
              <Bar className="h-4 w-40" />
            </div>
            <div className="grid gap-4 p-5 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Bar className="h-3 w-24" />
                  <Bar className="mt-1.5 h-9 w-full" />
                </div>
              ))}
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
