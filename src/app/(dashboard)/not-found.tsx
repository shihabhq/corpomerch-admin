import Link from "next/link";
import { FileQuestion, Inbox, Package } from "lucide-react";

import { Button, Card } from "@/components/ui";

/**
 * Rendered when a page inside the dashboard calls notFound() — most often a
 * product or inquiry id that has been deleted, or a stale bookmark. Scoped to
 * the group so it keeps the sidebar.
 */
export default function DashboardNotFound() {
  return (
    <Card className="mx-auto max-w-lg p-8 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-xl bg-surface-alt text-muted">
        <FileQuestion className="size-6" aria-hidden />
      </span>

      <h1 className="mt-5 text-lg font-semibold text-ink">Record not found</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted">
        It may have been archived or deleted, or the link may be out of date.
      </p>

      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Button asChild>
          <Link href="/products">
            <Package className="size-4" aria-hidden />
            All products
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/inquiries">
            <Inbox className="size-4" aria-hidden />
            All inquiries
          </Link>
        </Button>
      </div>
    </Card>
  );
}
