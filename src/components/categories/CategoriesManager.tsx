"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CornerDownRight, Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { deleteCategory, saveCategory } from "@/app/actions/content";
import {
  Badge,
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  Field,
  Input,
  Textarea,
} from "@/components/ui";
import { slugify } from "@/lib/utils";

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  description: string | null;
  iconKey: string | null;
  sortOrder: number;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  productCount: number;
  childCount: number;
}

type Draft = Partial<CategoryRow>;

export function CategoriesManager({ categories }: { categories: CategoryRow[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>({});

  const parents = categories.filter((c) => c.parentId === null);
  const childrenOf = (id: string) => categories.filter((c) => c.parentId === id);

  function startCreate(parentId: string | null) {
    setDraft({
      name: "",
      slug: "",
      parentId,
      description: "",
      iconKey: "",
      sortOrder: categories.length * 10,
      status: "PUBLISHED",
    });
    setOpen(true);
  }

  function submit() {
    startTransition(async () => {
      const result = await saveCategory({
        id: draft.id,
        name: draft.name ?? "",
        slug: draft.slug || undefined,
        parentId: draft.parentId ?? null,
        description: draft.description ?? null,
        iconKey: draft.iconKey ?? null,
        sortOrder: draft.sortOrder ?? 0,
        status: draft.status ?? "PUBLISHED",
      });
      if (result.ok) {
        toast.success(draft.id ? "Category saved" : "Category created");
        setOpen(false);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function remove(category: CategoryRow) {
    if (!confirm(`Delete “${category.name}”?`)) return;
    startTransition(async () => {
      const result = await deleteCategory(category.id);
      if (result.ok) {
        toast.success("Deleted");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function Row({ category, nested }: { category: CategoryRow; nested?: boolean }) {
    return (
      <div
        className={`flex items-center gap-3 px-5 py-3 hover:bg-surface ${
          nested ? "pl-12" : ""
        }`}
      >
        {nested ? (
          <CornerDownRight className="size-3.5 shrink-0 text-faint" aria-hidden />
        ) : null}

        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">{category.name}</p>
          <p className="font-mono text-[11px] text-faint">/{category.slug}</p>
        </div>

        <Badge tone={category.status === "PUBLISHED" ? "success" : "muted"}>
          {category.status.toLowerCase()}
        </Badge>

        <span className="w-24 shrink-0 text-right text-xs tabular-nums text-muted">
          {category.productCount} product{category.productCount === 1 ? "" : "s"}
        </span>

        <div className="flex shrink-0 gap-0.5">
          {!nested ? (
            <button
              type="button"
              onClick={() => startCreate(category.id)}
              className="rounded-lg p-1.5 text-faint hover:bg-surface-alt hover:text-ink"
              aria-label={`Add a sub-category under ${category.name}`}
              title="Add sub-category"
            >
              <Plus className="size-3.5" />
            </button>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setDraft(category);
              setOpen(true);
            }}
            className="rounded-lg p-1.5 text-faint hover:bg-surface-alt hover:text-ink"
            aria-label={`Edit ${category.name}`}
          >
            <Pencil className="size-3.5" />
          </button>
          <button
            type="button"
            onClick={() => remove(category)}
            className="rounded-lg p-1.5 text-faint hover:bg-surface-alt hover:text-brand"
            aria-label={`Delete ${category.name}`}
          >
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <Card>
        <div className="flex items-center justify-between border-b border-line px-5 py-3.5">
          <div>
            <h2 className="text-sm font-semibold text-ink">Category tree</h2>
            <p className="text-xs text-muted">
              {categories.length} categories · {parents.length} top level
            </p>
          </div>
          <Button type="button" size="sm" onClick={() => startCreate(null)}>
            <Plus className="size-3.5" aria-hidden />
            Add top-level
          </Button>
        </div>

        <div className="divide-y divide-line">
          {parents.map((parent) => (
            <div key={parent.id}>
              <Row category={parent} />
              {childrenOf(parent.id).map((child) => (
                <div key={child.id} className="border-t border-line">
                  <Row category={child} nested />
                </div>
              ))}
            </div>
          ))}
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader
            title={draft.id ? "Edit category" : "New category"}
            description={
              draft.parentId
                ? "This will be a sub-category."
                : "A top-level category. It can hold sub-categories."
            }
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="cat-name" required className="sm:col-span-2">
              <Input
                id="cat-name"
                value={draft.name ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                onBlur={(e) =>
                  setDraft((d) => ({
                    ...d,
                    slug: d.slug || slugify(e.target.value),
                  }))
                }
              />
            </Field>

            <Field
              label="Slug"
              htmlFor="cat-slug"
              hint="Storefront URL: /categories/…"
            >
              <Input
                id="cat-slug"
                value={draft.slug ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, slug: e.target.value }))}
              />
            </Field>

            <Field
              label="Icon"
              htmlFor="cat-icon"
              hint="A lucide icon name, e.g. Package."
            >
              <Input
                id="cat-icon"
                value={draft.iconKey ?? ""}
                onChange={(e) => setDraft((d) => ({ ...d, iconKey: e.target.value }))}
              />
            </Field>

            <Field
              label="Description"
              htmlFor="cat-desc"
              className="sm:col-span-2"
              hint="Shown on the category page and used as its meta description."
            >
              <Textarea
                id="cat-desc"
                rows={3}
                value={draft.description ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, description: e.target.value }))
                }
              />
            </Field>

            <Field label="Parent" htmlFor="cat-parent">
              <select
                id="cat-parent"
                value={draft.parentId ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, parentId: e.target.value || null }))
                }
                className="h-9 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand/40"
              >
                <option value="">None (top level)</option>
                {parents
                  .filter((p) => p.id !== draft.id)
                  .map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
              </select>
            </Field>

            <Field label="Sort order" htmlFor="cat-sort">
              <Input
                id="cat-sort"
                type="number"
                value={draft.sortOrder ?? 0}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, sortOrder: Number(e.target.value) }))
                }
              />
            </Field>

            <Field label="Status" htmlFor="cat-status" className="sm:col-span-2">
              <select
                id="cat-status"
                value={draft.status ?? "PUBLISHED"}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    status: e.target.value as CategoryRow["status"],
                  }))
                }
                className="h-9 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand/40"
              >
                <option value="PUBLISHED">Published</option>
                <option value="DRAFT">Draft</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </Field>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={submit} disabled={pending}>
              {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
              {draft.id ? "Save changes" : "Create"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
