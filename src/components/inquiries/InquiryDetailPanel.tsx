"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, MessageCircle, UserCheck } from "lucide-react";
import { toast } from "sonner";

import {
  updateInquiry,
  type InquiryStatusValue,
} from "@/app/actions/inquiries";
import { PIPELINE } from "@/components/inquiries/InquiriesTable";
import { Button, Card, CardHeader, Textarea } from "@/components/ui";
import { cn } from "@/lib/utils";

export function InquiryDetailPanel({
  id,
  ref_,
  status,
  internalNote,
  phone,
  assignee,
}: {
  id: string;
  ref_: string;
  status: InquiryStatusValue;
  internalNote: string;
  phone: string | null;
  assignee: string | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [note, setNote] = useState(internalNote);

  function save(data: Parameters<typeof updateInquiry>[1], message: string) {
    startTransition(async () => {
      const result = await updateInquiry(id, data);
      if (result.ok) {
        toast.success(message);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  // Deep-link straight into the existing WhatsApp thread with the reference,
  // so the reply lands in the same conversation the customer started.
  const replyHref = phone
    ? `https://wa.me/${phone.replace(/\D/g, "")}?text=${encodeURIComponent(
        `Hello! Following up on your CorpoMerch inquiry #${ref_}.`,
      )}`
    : null;

  return (
    <Card>
      <CardHeader
        title="Pipeline"
        description={assignee ? `Assigned to ${assignee}` : "Unassigned"}
      />

      <div className="space-y-4 p-4">
        <div className="grid grid-cols-3 gap-1.5">
          {PIPELINE.map((option) => (
            <button
              key={option}
              type="button"
              disabled={pending}
              onClick={() => save({ status: option }, `Moved to ${option.toLowerCase()}`)}
              className={cn(
                "rounded-lg border px-2 py-2 text-xs font-medium capitalize transition-colors",
                option === status
                  ? "border-brand bg-brand-tint text-brand"
                  : "border-line text-muted hover:border-line-strong hover:text-ink",
              )}
            >
              {option.toLowerCase()}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          {replyHref ? (
            <Button asChild size="sm" variant="outline" className="flex-1">
              <a href={replyHref} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="size-3.5 text-[#25D366]" aria-hidden />
                Reply on WhatsApp
              </a>
            </Button>
          ) : null}
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={pending}
            onClick={() => save({ assignToMe: true }, "Assigned to you")}
            className={replyHref ? "" : "flex-1"}
          >
            <UserCheck className="size-3.5" aria-hidden />
            Assign to me
          </Button>
        </div>

        <div>
          <label
            htmlFor="internalNote"
            className="mb-1.5 block text-xs font-medium text-ink"
          >
            Internal note
          </label>
          <Textarea
            id="internalNote"
            rows={5}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Quoted 12,500 including delivery. Waiting on their artwork."
          />
          <Button
            type="button"
            size="sm"
            className="mt-2 w-full"
            disabled={pending || note === internalNote}
            onClick={() => save({ internalNote: note }, "Note saved")}
          >
            {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
            Save note
          </Button>
        </div>
      </div>
    </Card>
  );
}
