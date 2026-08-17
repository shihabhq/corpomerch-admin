"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  deleteContent,
  saveContent,
  type ContentKind,
} from "@/app/actions/content";
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
  Label,
  Switch,
  Textarea,
} from "@/components/ui";

/**
 * One CRUD screen driven by a field spec, shared by FAQs, partners,
 * testimonials, banners and portfolio entries.
 *
 * Five nearly-identical screens would be five places to fix the same bug —
 * which is exactly what happened in the reference admin.
 */

export type FieldType = "text" | "textarea" | "number" | "switch" | "date" | "select";

export interface ContentField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  hint?: string;
  placeholder?: string;
  options?: { value: string; label: string }[];
  /** Show in the list table as well as the form. */
  inList?: boolean;
  /** Full width in the two-column form grid. */
  wide?: boolean;
}

export type ContentRow = Record<string, unknown> & { id: string };

export function ContentManager({
  kind,
  rows,
  fields,
  title,
  emptyTitle,
  emptyDescription,
  defaults = {},
}: {
  kind: ContentKind;
  rows: ContentRow[];
  fields: ContentField[];
  title: string;
  emptyTitle: string;
  emptyDescription: string;
  defaults?: Record<string, unknown>;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<ContentRow | null>(null);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Record<string, unknown>>({});

  const listFields = fields.filter((f) => f.inList);

  function startCreate() {
    const initial: Record<string, unknown> = { sortOrder: rows.length * 10, ...defaults };
    for (const field of fields) {
      if (!(field.name in initial)) {
        initial[field.name] = field.type === "switch" ? true : "";
      }
    }
    setDraft(initial);
    setEditing(null);
    setOpen(true);
  }

  function startEdit(row: ContentRow) {
    setDraft({ ...row });
    setEditing(row);
    setOpen(true);
  }

  function submit() {
    startTransition(async () => {
      const result = await saveContent(kind, {
        ...draft,
        id: editing?.id,
      });
      if (result.ok) {
        toast.success(editing ? "Saved" : "Created");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove(row: ContentRow) {
    const label = String(row[listFields[0]?.name ?? "id"] ?? "this item");
    if (!confirm(`Delete “${label}”? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteContent(kind, row.id);
      if (result.ok) {
        toast.success("Deleted");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <>
      <Card>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-ink">{title}</h2>
            <p className="text-xs text-muted">
              {rows.length} item{rows.length === 1 ? "" : "s"}
            </p>
          </div>
          <Button type="button" size="sm" onClick={startCreate}>
            <Plus className="size-3.5" aria-hidden />
            Add
          </Button>
        </div>

        {rows.length === 0 ? (
          <div className="p-5">
            <EmptyState
              title={emptyTitle}
              description={emptyDescription}
              action={
                <Button type="button" size="sm" onClick={startCreate}>
                  <Plus className="size-3.5" aria-hidden />
                  Add the first one
                </Button>
              }
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-line bg-surface text-left">
                  {listFields.map((field) => (
                    <th
                      key={field.name}
                      className="px-4 py-2.5 text-xs font-semibold uppercase tracking-[0.06em] text-muted"
                    >
                      {field.label}
                    </th>
                  ))}
                  <th className="px-4 py-2.5" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {rows.map((row) => (
                  <tr key={row.id} className="hover:bg-surface">
                    {listFields.map((field) => {
                      const value = row[field.name];
                      return (
                        <td key={field.name} className="max-w-md px-4 py-2.5">
                          {field.type === "switch" ? (
                            <Badge tone={value ? "success" : "muted"}>
                              {value ? "active" : "hidden"}
                            </Badge>
                          ) : (
                            <span className="line-clamp-2 text-xs text-body">
                              {value === null || value === undefined || value === ""
                                ? "—"
                                : String(value)}
                            </span>
                          )}
                        </td>
                      );
                    })}
                    <td className="px-4 py-2.5">
                      <div className="flex justify-end gap-0.5">
                        <button
                          type="button"
                          onClick={() => startEdit(row)}
                          className="rounded-lg p-1.5 text-faint hover:bg-surface-alt hover:text-ink"
                          aria-label="Edit"
                        >
                          <Pencil className="size-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => remove(row)}
                          className="rounded-lg p-1.5 text-faint hover:bg-surface-alt hover:text-brand"
                          aria-label="Delete"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader title={editing ? `Edit ${title.toLowerCase()}` : `New ${title.toLowerCase()}`} />

          <div className="grid gap-4 sm:grid-cols-2">
            {fields.map((field) => {
              const id = `field-${field.name}`;
              const value = draft[field.name];
              const set = (v: unknown) =>
                setDraft((prev) => ({ ...prev, [field.name]: v }));

              if (field.type === "switch") {
                return (
                  <div
                    key={field.name}
                    className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5 sm:col-span-2"
                  >
                    <Label htmlFor={id}>{field.label}</Label>
                    <Switch
                      id={id}
                      checked={Boolean(value)}
                      onCheckedChange={set}
                    />
                  </div>
                );
              }

              return (
                <Field
                  key={field.name}
                  label={field.label}
                  htmlFor={id}
                  required={field.required}
                  hint={field.hint}
                  className={field.wide ? "sm:col-span-2" : undefined}
                >
                  {field.type === "textarea" ? (
                    <Textarea
                      id={id}
                      rows={4}
                      value={String(value ?? "")}
                      placeholder={field.placeholder}
                      onChange={(e) => set(e.target.value)}
                    />
                  ) : field.type === "select" ? (
                    <select
                      id={id}
                      value={String(value ?? "")}
                      onChange={(e) => set(e.target.value)}
                      className="h-9 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
                    >
                      <option value="">—</option>
                      {field.options?.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <Input
                      id={id}
                      type={
                        field.type === "number"
                          ? "number"
                          : field.type === "date"
                            ? "date"
                            : "text"
                      }
                      value={
                        field.type === "date" && value
                          ? String(value).slice(0, 10)
                          : String(value ?? "")
                      }
                      placeholder={field.placeholder}
                      onChange={(e) =>
                        set(
                          field.type === "number"
                            ? Number(e.target.value)
                            : e.target.value,
                        )
                      }
                    />
                  )}
                </Field>
              );
            })}
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {editing ? "Save changes" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
