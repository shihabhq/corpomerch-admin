"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Copy, Download, ExternalLink, Link2, Loader2, Plus, QrCode, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createConnectCard,
  deleteConnectCard,
  getConnectCardQr,
  setConnectCardActive,
} from "@/app/actions/connect";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  EmptyState,
  Field,
  Input,
  Switch,
} from "@/components/ui";
import { slugify } from "@/lib/utils";

export interface ConnectCardRow {
  id: string;
  slug: string;
  url: string;
  label: string | null;
  ownerEmail: string | null;
  claimed: boolean;
  claimedAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface QrState {
  slug: string;
  url: string;
  svg: string;
  png: string;
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

export function ConnectManager({ cards }: { cards: ConnectCardRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState({ label: "", slug: "" });
  const [slugTouched, setSlugTouched] = useState(false);
  const [fieldError, setFieldError] = useState<{ field?: string; error: string } | null>(null);
  const [qr, setQr] = useState<QrState | null>(null);

  const claimedCount = cards.filter((c) => c.claimed).length;
  const slugPreview = slugTouched ? draft.slug : slugify(draft.label);

  function create() {
    setFieldError(null);
    startTransition(async () => {
      const result = await createConnectCard({
        label: draft.label,
        slug: slugTouched ? draft.slug : undefined,
      });
      if (result.ok) {
        await navigator.clipboard?.writeText(result.data.url).catch(() => {});
        toast.success("Link created and copied", { description: result.data.url });
        setCreateOpen(false);
        setDraft({ label: "", slug: "" });
        setSlugTouched(false);
        router.refresh();
      } else {
        setFieldError({ field: result.field, error: result.error });
      }
    });
  }

  function showQr(card: ConnectCardRow) {
    startTransition(async () => {
      const result = await getConnectCardQr(card.id);
      if (result.ok) setQr({ slug: card.slug, ...result.data });
      else toast.error(result.error);
    });
  }

  function copy(url: string) {
    navigator.clipboard
      ?.writeText(url)
      .then(() => toast.success("Link copied"))
      .catch(() => toast.error("Could not copy — select the link manually."));
  }

  function toggle(card: ConnectCardRow, next: boolean) {
    startTransition(async () => {
      const result = await setConnectCardActive(card.id, next);
      if (result.ok) {
        toast.success(next ? "Link re-enabled" : "Link disabled");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  function remove(card: ConnectCardRow) {
    if (!window.confirm(`Delete the unclaimed link "${card.slug}"? A printed card pointing at it will stop working.`)) return;
    startTransition(async () => {
      const result = await deleteConnectCard(card.id);
      if (result.ok) {
        toast.success("Link deleted");
        router.refresh();
      } else toast.error(result.error);
    });
  }

  return (
    <>
      <Card>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-ink">Cards</h2>
            <p className="text-xs text-muted">
              {cards.length} created · {claimedCount} claimed · {cards.length - claimedCount} waiting for their first tap
            </p>
          </div>
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus className="size-3.5" aria-hidden />
            New card link
          </Button>
        </div>

        {cards.length === 0 ? (
          <EmptyState
            title="No cards yet"
            description="Create a link, program it into the customer's NFC chip, and print its QR code on the card."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-left">
                {["Customer", "Link", "Status", "Created", "Active", ""].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {cards.map((card) => (
                <tr key={card.id} className="hover:bg-surface">
                  <td className="px-5 py-3">
                    <p className="font-medium text-ink">{card.label ?? "—"}</p>
                    {card.ownerEmail ? <p className="text-xs text-muted">{card.ownerEmail}</p> : null}
                  </td>
                  <td className="px-5 py-3">
                    <button
                      type="button"
                      onClick={() => copy(card.url)}
                      className="group inline-flex items-center gap-1.5 font-mono text-xs text-body hover:text-ink"
                      title="Copy link"
                    >
                      <Link2 className="size-3 text-faint" aria-hidden />
                      {card.url.replace(/^https?:\/\//, "")}
                      <Copy className="size-3 opacity-0 transition-opacity group-hover:opacity-100" aria-hidden />
                    </button>
                  </td>
                  <td className="px-5 py-3">
                    {card.claimed ? (
                      <Badge tone="success">claimed {card.claimedAt ? fmt(card.claimedAt) : ""}</Badge>
                    ) : (
                      <Badge tone="warning">unclaimed</Badge>
                    )}
                  </td>
                  <td className="px-5 py-3 text-xs text-faint">{fmt(card.createdAt)}</td>
                  <td className="px-5 py-3">
                    <Switch
                      checked={card.isActive}
                      disabled={pending}
                      onCheckedChange={(v) => toggle(card, v)}
                      aria-label={`Toggle ${card.slug}`}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-1">
                      <Button type="button" variant="ghost" size="icon" disabled={pending} onClick={() => showQr(card)} aria-label="Show QR code">
                        <QrCode className="size-4" aria-hidden />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" asChild>
                        <a href={card.url} target="_blank" rel="noopener noreferrer" aria-label="Open link">
                          <ExternalLink className="size-4" aria-hidden />
                        </a>
                      </Button>
                      {!card.claimed ? (
                        <Button type="button" variant="ghost" size="icon" disabled={pending} onClick={() => remove(card)} aria-label="Delete link">
                          <Trash2 className="size-4" aria-hidden />
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader
            title="New card link"
            description="The customer registers at this link the first time they tap or scan their card."
          />
          <div className="space-y-4">
            <Field label="Customer name" htmlFor="cardLabel" required>
              <Input
                id="cardLabel"
                value={draft.label}
                onChange={(e) => setDraft((d) => ({ ...d, label: e.target.value }))}
                placeholder="Customer's full name"
                aria-invalid={fieldError?.field === "label"}
                autoFocus
              />
            </Field>
            <Field
              label="Link"
              htmlFor="cardSlug"
              hint={slugPreview ? `Final link: …/${slugPreview}` : "Built from the name unless you type one."}
            >
              <Input
                id="cardSlug"
                value={slugPreview}
                onChange={(e) => {
                  setSlugTouched(true);
                  setDraft((d) => ({ ...d, slug: slugify(e.target.value) }));
                }}
                className="font-mono text-xs"
                aria-invalid={fieldError?.field === "slug"}
              />
            </Field>
            {fieldError ? <p className="text-xs text-brand">{fieldError.error}</p> : null}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
                Cancel
              </Button>
              <Button type="button" onClick={create} disabled={pending || !draft.label.trim()}>
                {pending ? <Loader2 className="size-3.5 animate-spin" aria-hidden /> : null}
                Create link
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={qr !== null} onOpenChange={(o) => !o && setQr(null)}>
        <DialogContent>
          <DialogHeader title="QR code" description="Print this on the card. It encodes the link below." />
          {qr ? (
            <div className="space-y-4">
              <div
                className="mx-auto size-56 rounded-lg border border-line bg-white p-2 [&>svg]:size-full"
                dangerouslySetInnerHTML={{ __html: qr.svg }}
              />
              <p className="break-all text-center font-mono text-xs text-muted">{qr.url}</p>
              <div className="flex justify-center gap-2">
                <Button type="button" variant="outline" onClick={() => copy(qr.url)}>
                  <Copy className="size-3.5" aria-hidden />
                  Copy link
                </Button>
                <Button type="button" asChild>
                  <a href={qr.png} download={`connect-${qr.slug}.png`}>
                    <Download className="size-3.5" aria-hidden />
                    Download PNG
                  </a>
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
