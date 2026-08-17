"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Download, Inbox, Search, X } from "lucide-react";
import { toast } from "sonner";

import {
  bulkUpdateInquiryStatus,
  exportInquiriesCsv,
  type InquiryStatusValue,
} from "@/app/actions/inquiries";
import { Badge, Button, Card, Checkbox, EmptyState, Input } from "@/components/ui";
import { cn, formatBDT } from "@/lib/utils";

export interface InquiryRow {
  id: string;
  ref: string;
  status: InquiryStatusValue;
  source: string;
  name: string | null;
  company: string | null;
  phone: string | null;
  totalEstimate: number | null;
  createdAt: string;
  summary: string;
  itemCount: number;
}

export const STATUS_TONE = {
  NEW: "brand",
  CONTACTED: "info",
  QUOTED: "warning",
  WON: "success",
  LOST: "muted",
  SPAM: "muted",
} as const;

/** The sales pipeline, in order. */
export const PIPELINE: InquiryStatusValue[] = [
  "NEW",
  "CONTACTED",
  "QUOTED",
  "WON",
  "LOST",
  "SPAM",
];

export function InquiriesTable({
  inquiries,
  total,
  page,
  perPage,
  statusCounts,
}: {
  inquiries: InquiryRow[];
  total: number;
  page: number;
  perPage: number;
  statusCounts: Record<string, number>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [query, setQuery] = useState(searchParams.get("q") ?? "");

  const activeStatus = searchParams.get("status");
  const pageCount = Math.max(1, Math.ceil(total / perPage));

  function write(updates: Record<string, string | null>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    }
    if (!("page" in updates)) params.delete("page");
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
  }

  function handleExport() {
    startTransition(async () => {
      const result = await exportInquiriesCsv(
        (activeStatus as InquiryStatusValue) ?? undefined,
      );
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const blob = new Blob([result.data], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `corpomerch-inquiries-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("CSV downloaded");
    });
  }

  return (
    <Card>
      <div className="flex flex-col gap-3 border-b border-line p-4 lg:flex-row lg:items-center">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            write({ q: query });
          }}
          className="relative flex-1"
        >
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-faint"
            aria-hidden
          />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by reference, name, company or phone…"
            aria-label="Search inquiries"
            className="pl-9"
          />
          {query ? (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                write({ q: null });
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-faint hover:text-ink"
              aria-label="Clear search"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </form>

        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={handleExport}
        >
          <Download className="size-3.5" aria-hidden />
          Export CSV
        </Button>
      </div>

      {/* Pipeline filter */}
      <div className="flex flex-wrap gap-1 border-b border-line px-4 py-2.5">
        <button
          type="button"
          onClick={() => write({ status: null })}
          className={cn(
            "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors",
            !activeStatus ? "bg-brand-tint text-brand" : "text-muted hover:text-ink",
          )}
        >
          All {total}
        </button>
        {PIPELINE.map((status) => (
          <button
            key={status}
            type="button"
            onClick={() => write({ status })}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-medium capitalize transition-colors",
              activeStatus === status
                ? "bg-brand-tint text-brand"
                : "text-muted hover:text-ink",
            )}
          >
            {status.toLowerCase()} {statusCounts[status] ?? 0}
          </button>
        ))}
      </div>

      {selected.size > 0 ? (
        <div className="flex flex-wrap items-center gap-2 border-b border-line bg-brand-tint px-4 py-2.5">
          <span className="text-xs font-medium text-brand">
            {selected.size} selected — move to
          </span>
          {PIPELINE.map((status) => (
            <Button
              key={status}
              size="sm"
              variant="outline"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await bulkUpdateInquiryStatus([...selected], status);
                  if (result.ok) {
                    toast.success(`Moved to ${status.toLowerCase()}`);
                    setSelected(new Set());
                    router.refresh();
                  } else toast.error(result.error);
                })
              }
              className="capitalize"
            >
              {status.toLowerCase()}
            </Button>
          ))}
        </div>
      ) : null}

      {inquiries.length === 0 ? (
        <div className="p-5">
          <EmptyState
            icon={<Inbox className="size-8" />}
            title="No inquiries here"
            description="They arrive the moment someone presses Send Inquiry on the storefront."
          />
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-left">
                <th className="w-10 px-4 py-2.5">
                  <Checkbox
                    checked={selected.size === inquiries.length}
                    onCheckedChange={(checked) =>
                      setSelected(
                        checked ? new Set(inquiries.map((i) => i.id)) : new Set(),
                      )
                    }
                    aria-label="Select all on this page"
                  />
                </th>
                {["Reference", "Customer", "Items", "Estimate", "Status", "Received"].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-3 py-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-muted"
                    >
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {inquiries.map((inquiry) => (
                <tr key={inquiry.id} className="hover:bg-surface">
                  <td className="px-4 py-2.5">
                    <Checkbox
                      checked={selected.has(inquiry.id)}
                      onCheckedChange={() =>
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (next.has(inquiry.id)) next.delete(inquiry.id);
                          else next.add(inquiry.id);
                          return next;
                        })
                      }
                      aria-label={`Select ${inquiry.ref}`}
                    />
                  </td>
                  <td className="px-3 py-2.5">
                    <Link
                      href={`/inquiries/${inquiry.id}`}
                      className="font-mono text-xs font-medium text-ink hover:text-brand"
                    >
                      #{inquiry.ref}
                    </Link>
                    <p className="text-[11px] lowercase text-faint">{inquiry.source}</p>
                  </td>
                  <td className="px-3 py-2.5">
                    <p className="text-xs font-medium text-ink">
                      {inquiry.name || inquiry.company || "Anonymous"}
                    </p>
                    {inquiry.phone ? (
                      <p className="text-[11px] tabular-nums text-faint">
                        {inquiry.phone}
                      </p>
                    ) : null}
                  </td>
                  <td className="max-w-xs px-3 py-2.5">
                    <p className="truncate text-xs text-muted" title={inquiry.summary}>
                      {inquiry.summary || `${inquiry.itemCount} items`}
                    </p>
                  </td>
                  <td className="px-3 py-2.5 text-xs font-medium tabular-nums text-ink">
                    {inquiry.totalEstimate ? formatBDT(inquiry.totalEstimate) : "—"}
                  </td>
                  <td className="px-3 py-2.5">
                    <Badge tone={STATUS_TONE[inquiry.status]}>
                      {inquiry.status.toLowerCase()}
                    </Badge>
                  </td>
                  <td className="px-3 py-2.5 text-[11px] text-faint">
                    {new Date(inquiry.createdAt).toLocaleString("en-GB", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pageCount > 1 ? (
        <div className="flex items-center justify-between border-t border-line px-4 py-3">
          <p className="text-xs text-muted">
            Page {page} of {pageCount}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={page <= 1}
              onClick={() => write({ page: String(page - 1) })}
            >
              Previous
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={page >= pageCount}
              onClick={() => write({ page: String(page + 1) })}
            >
              Next
            </Button>
          </div>
        </div>
      ) : null}
    </Card>
  );
}
