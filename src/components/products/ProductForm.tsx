"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useRef, useState, useTransition } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  Check,
  ExternalLink,
  ImagePlus,
  Info,
  Loader2,
  Plus,
  Sparkles,
  Star,
  Trash2,
  Wand2,
} from "lucide-react";
import { toast } from "sonner";

import { saveProduct } from "@/app/actions/products";
import {
  Badge,
  Button,
  Card,
  CardHeader,
  Checkbox,
  Field,
  Input,
  Label,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@/components/ui";
import { SPEC_TEMPLATES } from "@/config/spec-templates";
import { buildTierRanges, resolvePrice } from "@/lib/pricing";
import { imageUrl } from "@/lib/storage";
import { processAndUpload } from "@/lib/upload";
import { cn, formatBDT, formatTierRange, slugify } from "@/lib/utils";
import {
  DISPLAYS,
  productFormSchema,
  STATUSES,
  UNITS,
  type ProductFormValues,
} from "@/lib/validation";

const MAX_GENERATED_SKUS = 64;

export interface CategoryOption {
  id: string;
  name: string;
  parentName: string | null;
}

export function ProductForm({
  defaultValues,
  categories,
  isNew,
  storefrontUrl,
}: {
  defaultValues: ProductFormValues;
  categories: CategoryOption[];
  isNew: boolean;
  storefrontUrl: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [tab, setTab] = useState("basics");

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
    mode: "onBlur",
  });

  const {
    register,
    control,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors, isDirty },
  } = form;

  const specs = useFieldArray({ control, name: "specs" });
  const images = useFieldArray({ control, name: "images" });
  const options = useFieldArray({ control, name: "options" });
  const skus = useFieldArray({ control, name: "skus" });

  const watchedOptions = useWatch({ control, name: "options" }) ?? [];
  const watchedSkus = useWatch({ control, name: "skus" }) ?? [];
  const watchedImages = useWatch({ control, name: "images" }) ?? [];
  const unit = watch("unit");
  const unitLabelValue = watch("unitLabel");
  const qtyStep = watch("qtyStep") || 1;
  const slug = watch("slug");
  const status = watch("status");

  const axis1 = watchedOptions.find((o) => o?.position === 1);

  // Which tabs carry a validation error — shown as a dot on the tab.
  const tabErrors = {
    basics: Boolean(
      errors.name ||
        errors.slug ||
        errors.categoryIds ||
        errors.primaryCategoryId ||
        errors.qtyStep ||
        errors.moq ||
        errors.leadTimeDaysMax,
    ),
    content: Boolean(errors.description || errors.shortDescription),
    specs: Boolean(errors.specs),
    images: Boolean(errors.images),
    variants: Boolean(errors.options),
    pricing: Boolean(errors.skus),
    seo: Boolean(errors.seoTitle || errors.seoDescription),
  };

  function onSubmit(values: ProductFormValues) {
    startTransition(async () => {
      const result = await saveProduct(values);
      if (result.ok) {
        toast.success(isNew ? "Product created" : "Changes saved");
        if (isNew) router.push(`/products/${result.data.id}`);
        else router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {/* Sticky action bar */}
      <div className="sticky top-0 z-20 -mx-4 mb-6 flex flex-wrap items-center gap-3 border-b border-line bg-surface/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-ink">
            {watch("name") || "Untitled product"}
          </p>
          <p className="truncate font-mono text-[11px] text-faint">/{slug || "…"}</p>
        </div>

        <Controller
          control={control}
          name="status"
          render={({ field }) => (
            <select
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              aria-label="Publish status"
              className="h-9 rounded-lg border border-line bg-white px-3 text-sm text-ink outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s === "PUBLISHED" ? "Published" : s === "DRAFT" ? "Draft" : "Archived"}
                </option>
              ))}
            </select>
          )}
        />

        {!isNew && status === "PUBLISHED" ? (
          <a
            href={`${storefrontUrl}/products/${slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden h-9 items-center gap-1.5 rounded-lg border border-line-strong px-3 text-sm text-ink hover:bg-white sm:inline-flex"
          >
            <ExternalLink className="size-3.5" aria-hidden />
            View
          </a>
        ) : null}

        <Button type="submit" disabled={pending || (!isDirty && !isNew)}>
          {pending ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
          {pending ? "Saving…" : isNew ? "Create product" : "Save changes"}
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          {(
            [
              ["basics", "Basics"],
              ["content", "Description"],
              ["specs", `Specifications (${specs.fields.length})`],
              ["images", `Images (${images.fields.length})`],
              ["variants", `Variants (${options.fields.length})`],
              ["pricing", `Pricing (${skus.fields.length})`],
              ["seo", "SEO"],
            ] as const
          ).map(([value, label]) => (
            <TabsTrigger key={value} value={value}>
              {label}
              {tabErrors[value as keyof typeof tabErrors] ? (
                <span
                  className="ml-1.5 inline-block size-1.5 rounded-full bg-brand align-middle"
                  aria-label="has errors"
                />
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ─── BASICS ─────────────────────────────────────────────────── */}
        <TabsContent value="basics">
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <Card className="p-5">
              <div className="space-y-4">
                <Field
                  label="Product name"
                  htmlFor="name"
                  required
                  error={errors.name?.message}
                >
                  <Input
                    id="name"
                    {...register("name")}
                    onBlur={(e) => {
                      register("name").onBlur(e);
                      if (isNew && !getValues("slug")) {
                        setValue("slug", slugify(e.target.value), {
                          shouldDirty: true,
                        });
                      }
                    }}
                    placeholder="ID Card (Regular)"
                  />
                </Field>

                <Field
                  label="URL slug"
                  htmlFor="slug"
                  required
                  error={errors.slug?.message}
                  hint={`Storefront address: /products/${slug || "…"}`}
                >
                  <Input id="slug" {...register("slug")} placeholder="id-card-regular" />
                </Field>

                <Field
                  label="Subtitle"
                  htmlFor="subtitle"
                  hint="One short line under the title, e.g. “Printed paper event badge”."
                >
                  <Input id="subtitle" {...register("subtitle")} />
                </Field>

                <Field
                  label="Tags"
                  htmlFor="tags"
                  hint="Comma separated. Used by site search and the tag links on the product page."
                >
                  <Controller
                    control={control}
                    name="tags"
                    render={({ field }) => (
                      <Input
                        id="tags"
                        defaultValue={field.value.join(", ")}
                        onBlur={(e) =>
                          field.onChange(
                            e.target.value
                              .split(",")
                              .map((t) => t.trim().toLowerCase())
                              .filter(Boolean),
                          )
                        }
                        placeholder="id card, event badge, conference"
                      />
                    )}
                  />
                </Field>
              </div>
            </Card>

            <div className="space-y-6">
              <Card>
                <CardHeader title="Categories" description="One must be primary." />
                <div className="max-h-64 space-y-1 overflow-y-auto p-4 scrollbar-thin">
                  <Controller
                    control={control}
                    name="categoryIds"
                    render={({ field }) => (
                      <>
                        {categories.map((category) => {
                          const checked = field.value.includes(category.id);
                          const isPrimary = watch("primaryCategoryId") === category.id;
                          return (
                            <div
                              key={category.id}
                              className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-surface"
                            >
                              <Checkbox
                                checked={checked}
                                onCheckedChange={(next) => {
                                  const set = new Set(field.value);
                                  if (next) set.add(category.id);
                                  else set.delete(category.id);
                                  const list = [...set];
                                  field.onChange(list);
                                  if (!list.includes(watch("primaryCategoryId"))) {
                                    setValue("primaryCategoryId", list[0] ?? "", {
                                      shouldDirty: true,
                                    });
                                  }
                                }}
                                id={`cat-${category.id}`}
                              />
                              <label
                                htmlFor={`cat-${category.id}`}
                                className="flex-1 cursor-pointer text-sm text-body"
                              >
                                {category.parentName ? (
                                  <span className="text-faint">
                                    {category.parentName} /{" "}
                                  </span>
                                ) : null}
                                {category.name}
                              </label>
                              {checked ? (
                                <button
                                  type="button"
                                  onClick={() =>
                                    setValue("primaryCategoryId", category.id, {
                                      shouldDirty: true,
                                    })
                                  }
                                  className={cn(
                                    "rounded p-1 transition-colors",
                                    isPrimary
                                      ? "text-brand"
                                      : "text-faint hover:text-ink",
                                  )}
                                  title={isPrimary ? "Primary category" : "Make primary"}
                                >
                                  <Star
                                    className="size-3.5"
                                    fill={isPrimary ? "currentColor" : "none"}
                                  />
                                </button>
                              ) : null}
                            </div>
                          );
                        })}
                      </>
                    )}
                  />
                </div>
                {errors.categoryIds || errors.primaryCategoryId ? (
                  <p className="border-t border-line px-4 py-2 text-xs text-brand">
                    {errors.categoryIds?.message ?? errors.primaryCategoryId?.message}
                  </p>
                ) : null}
              </Card>

              <Card>
                <CardHeader title="Ordering & units" />
                <div className="space-y-4 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Sold by" htmlFor="unit">
                      <Controller
                        control={control}
                        name="unit"
                        render={({ field }) => (
                          <select
                            id="unit"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="h-9 w-full rounded-lg border border-line bg-white px-3 text-sm outline-none focus:border-brand/40 focus:ring-2 focus:ring-brand/15"
                          >
                            {UNITS.map((u) => (
                              <option key={u} value={u}>
                                {u.toLowerCase()}
                              </option>
                            ))}
                          </select>
                        )}
                      />
                    </Field>
                    <Field label="Unit label" htmlFor="unitLabel" hint="e.g. sq.ft.">
                      <Input id="unitLabel" {...register("unitLabel")} />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      label="Quantity step"
                      htmlFor="qtyStep"
                      error={errors.qtyStep?.message}
                    >
                      <Input
                        id="qtyStep"
                        type="number"
                        step="0.5"
                        {...register("qtyStep", { valueAsNumber: true })}
                      />
                    </Field>
                    <Field
                      label="MOQ"
                      htmlFor="moq"
                      hint="Product default; a variant can override."
                    >
                      <Input
                        id="moq"
                        type="number"
                        step="1"
                        {...register("moq", {
                          setValueAs: (v) => (v === "" ? null : Number(v)),
                        })}
                      />
                    </Field>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Lead time min (days)" htmlFor="ltMin">
                      <Input
                        id="ltMin"
                        type="number"
                        {...register("leadTimeDaysMin", {
                          setValueAs: (v) => (v === "" ? null : Number(v)),
                        })}
                      />
                    </Field>
                    <Field
                      label="Lead time max"
                      htmlFor="ltMax"
                      error={errors.leadTimeDaysMax?.message}
                    >
                      <Input
                        id="ltMax"
                        type="number"
                        {...register("leadTimeDaysMax", {
                          setValueAs: (v) => (v === "" ? null : Number(v)),
                        })}
                      />
                    </Field>
                  </div>

                  <Field label="Badge text" htmlFor="badgeText" hint="e.g. Next-day print">
                    <Input id="badgeText" {...register("badgeText")} />
                  </Field>

                  <div className="flex items-center justify-between rounded-lg bg-surface px-3 py-2.5">
                    <Label htmlFor="isFeatured">Feature on the home page</Label>
                    <Controller
                      control={control}
                      name="isFeatured"
                      render={({ field }) => (
                        <Switch
                          id="isFeatured"
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>

                  <Field
                    label="Sort order"
                    htmlFor="sortOrder"
                    hint="Lower numbers appear first."
                  >
                    <Input
                      id="sortOrder"
                      type="number"
                      {...register("sortOrder", { valueAsNumber: true })}
                    />
                  </Field>
                </div>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* ─── DESCRIPTION ────────────────────────────────────────────── */}
        <TabsContent value="content">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <div className="space-y-4">
                <Field
                  label="Short description"
                  htmlFor="shortDescription"
                  required
                  error={errors.shortDescription?.message}
                  hint={`Shown on cards and in search results. ${
                    (watch("shortDescription") ?? "").length
                  }/400 characters.`}
                >
                  <Textarea
                    id="shortDescription"
                    rows={3}
                    {...register("shortDescription")}
                    placeholder="One or two sentences: what it is and who buys it."
                  />
                </Field>

                <Field
                  label="Full description"
                  htmlFor="description"
                  required
                  error={errors.description?.message}
                  hint="Markdown. Blank lines separate paragraphs; ** ** for bold; - for bullets."
                >
                  <Textarea
                    id="description"
                    rows={18}
                    className="font-mono text-xs"
                    {...register("description")}
                  />
                </Field>
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Preview"
                description="Roughly how the storefront will render it."
              />
              <div className="p-5">
                <p className="text-sm leading-relaxed text-body">
                  {watch("shortDescription") || (
                    <span className="text-faint">No short description yet.</span>
                  )}
                </p>
                <hr className="my-4 border-line" />
                <div className="space-y-3 text-sm leading-relaxed text-body">
                  {(watch("description") ?? "")
                    .split(/\n{2,}/)
                    .filter(Boolean)
                    .map((para, i) => (
                      <p key={i}>
                        {para.split(/\*\*(.+?)\*\*/g).map((chunk, j) =>
                          j % 2 === 1 ? (
                            <strong key={j} className="font-semibold text-ink">
                              {chunk}
                            </strong>
                          ) : (
                            <span key={j}>{chunk}</span>
                          ),
                        )}
                      </p>
                    ))}
                  {!watch("description") ? (
                    <p className="text-faint">No description yet.</p>
                  ) : null}
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>

        {/* ─── SPECIFICATIONS ─────────────────────────────────────────── */}
        <TabsContent value="specs">
          <Card>
            <CardHeader
              title="Specifications"
              description="Stored as an ordered list, so the sequence you set here is the sequence customers see."
              action={
                <div className="flex gap-2">
                  <select
                    onChange={(e) => {
                      const template = SPEC_TEMPLATES.find(
                        (t) => t.name === e.target.value,
                      );
                      if (template) {
                        for (const row of template.rows) specs.append(row);
                        toast.success(`Added ${template.rows.length} rows`);
                      }
                      e.target.value = "";
                    }}
                    className="h-8 rounded-lg border border-line bg-white px-2 text-xs outline-none"
                    aria-label="Insert a specification template"
                  >
                    <option value="">Insert template…</option>
                    {SPEC_TEMPLATES.map((t) => (
                      <option key={t.name} value={t.name}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => specs.append({ group: "", key: "", value: "" })}
                  >
                    <Plus className="size-3.5" aria-hidden />
                    Add row
                  </Button>
                </div>
              }
            />

            {specs.fields.length === 0 ? (
              <p className="px-5 py-8 text-center text-sm text-muted">
                No specifications yet. A published product needs at least one.
              </p>
            ) : (
              <ul className="divide-y divide-line">
                {specs.fields.map((field, index) => (
                  <li
                    key={field.id}
                    className="grid grid-cols-[8rem_10rem_1fr_auto] items-start gap-2 p-3"
                  >
                    <Input
                      {...register(`specs.${index}.group`)}
                      placeholder="Group"
                      aria-label={`Row ${index + 1} group`}
                    />
                    <Input
                      {...register(`specs.${index}.key`)}
                      placeholder="Key"
                      aria-label={`Row ${index + 1} key`}
                      aria-invalid={Boolean(errors.specs?.[index]?.key)}
                    />
                    <Input
                      {...register(`specs.${index}.value`)}
                      placeholder="Value"
                      aria-label={`Row ${index + 1} value`}
                      aria-invalid={Boolean(errors.specs?.[index]?.value)}
                    />
                    <div className="flex gap-0.5">
                      <IconButton
                        label="Move up"
                        disabled={index === 0}
                        onClick={() => specs.move(index, index - 1)}
                      >
                        <ArrowUp className="size-3.5" />
                      </IconButton>
                      <IconButton
                        label="Move down"
                        disabled={index === specs.fields.length - 1}
                        onClick={() => specs.move(index, index + 1)}
                      >
                        <ArrowDown className="size-3.5" />
                      </IconButton>
                      <IconButton label="Remove" onClick={() => specs.remove(index)}>
                        <Trash2 className="size-3.5" />
                      </IconButton>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </TabsContent>

        {/* ─── IMAGES ─────────────────────────────────────────────────── */}
        <TabsContent value="images">
          <ImagesPanel
            images={images}
            watchedImages={watchedImages}
            axis1={axis1}
            slug={slug}
            setValue={setValue}
            register={register}
            error={
              typeof errors.images?.message === "string"
                ? errors.images.message
                : undefined
            }
          />
        </TabsContent>

        {/* ─── VARIANTS ───────────────────────────────────────────────── */}
        <TabsContent value="variants">
          <VariantsPanel
            options={options}
            watchedOptions={watchedOptions}
            control={control}
            register={register}
            skus={skus}
            watchedSkus={watchedSkus}
            setValue={setValue}
            getValues={getValues}
          />
        </TabsContent>

        {/* ─── PRICING ────────────────────────────────────────────────── */}
        <TabsContent value="pricing">
          <PricingPanel
            skus={skus}
            watchedSkus={watchedSkus}
            watchedOptions={watchedOptions}
            control={control}
            register={register}
            setValue={setValue}
            getValues={getValues}
            unit={unit}
            unitLabel={unitLabelValue ?? null}
            qtyStep={qtyStep}
            productMoq={watch("moq") ?? null}
            pricingMode={watch("pricingMode")}
          />
        </TabsContent>

        {/* ─── SEO ────────────────────────────────────────────────────── */}
        <TabsContent value="seo">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card className="p-5">
              <div className="space-y-4">
                <Field
                  label="SEO title"
                  htmlFor="seoTitle"
                  error={errors.seoTitle?.message}
                  hint={`${(watch("seoTitle") ?? "").length}/70 — leave blank to auto-generate from the product name.`}
                >
                  <Input id="seoTitle" {...register("seoTitle")} />
                </Field>
                <Field
                  label="Meta description"
                  htmlFor="seoDescription"
                  error={errors.seoDescription?.message}
                  hint={`${(watch("seoDescription") ?? "").length}/180 — lead with the starting price and MOQ; those are what people search for.`}
                >
                  <Textarea id="seoDescription" rows={4} {...register("seoDescription")} />
                </Field>
              </div>
            </Card>

            <Card>
              <CardHeader title="Google preview" description="Approximate." />
              <div className="p-5">
                <div className="rounded-lg border border-line p-4">
                  <p className="truncate text-xs text-muted">
                    {storefrontUrl.replace(/^https?:\/\//, "")} › products › {slug}
                  </p>
                  <p className="mt-1 truncate text-lg text-[#1a0dab]">
                    {watch("seoTitle") ||
                      `${watch("name") || "Product"} — Custom Printing & Bulk Pricing`}
                  </p>
                  <p className="mt-1 line-clamp-2 text-sm text-[#4d5156]">
                    {watch("seoDescription") ||
                      watch("shortDescription") ||
                      "Add a meta description to control what appears here."}
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </form>
  );
}

// ─── Small shared control ────────────────────────────────────────────────────

function IconButton({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="rounded-lg p-1.5 text-faint transition-colors hover:bg-surface-alt hover:text-ink disabled:pointer-events-none disabled:opacity-30"
    >
      {children}
    </button>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */

// ─── Images ──────────────────────────────────────────────────────────────────

function ImagesPanel({
  images,
  watchedImages,
  axis1,
  slug,
  setValue,
  register,
  error,
}: {
  images: any;
  watchedImages: any[];
  axis1: any;
  slug: string;
  setValue: any;
  register: any;
  error?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        const uploaded = await processAndUpload(file, slug);
        if (!uploaded.wasSquare) {
          toast.warning(`${file.name} wasn't square`, {
            description:
              "It has been padded to 1000×1000 so it matches the rest of the catalogue.",
          });
        }
        images.append({
          storagePath: uploaded.storagePath,
          externalUrl: null,
          alt: "",
          width: uploaded.width,
          height: uploaded.height,
          blurDataUrl: uploaded.blurDataUrl,
          optionValueCode: null,
          isPrimary: images.fields.length === 0,
        });
      }
      toast.success("Uploaded");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  // Warn when one axis-1 value has imagery and a sibling does not — the
  // customer silently falls back to the shared gallery.
  const missingValueImages = useMemo(() => {
    if (!axis1?.values?.length) return [];
    const used = new Set(
      watchedImages.map((i) => i?.optionValueCode).filter(Boolean),
    );
    if (used.size === 0) return [];
    return axis1.values
      .filter((v: any) => !used.has(v.valueCode))
      .map((v: any) => v.label);
  }, [axis1, watchedImages]);

  return (
    <Card>
      <CardHeader
        title="Images"
        description="Square 1000×1000 is the house standard; anything else is padded on upload."
        action={
          <>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
            <Button
              type="button"
              size="sm"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden />
              ) : (
                <ImagePlus className="size-3.5" aria-hidden />
              )}
              {uploading ? "Uploading…" : "Upload images"}
            </Button>
          </>
        }
      />

      {missingValueImages.length > 0 ? (
        <p className="flex items-start gap-2 border-b border-line bg-info-tint px-5 py-2.5 text-xs text-info">
          <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          {axis1.name}: {missingValueImages.join(", ")} has no image while other
          values do — customers selecting it will see the shared gallery.
        </p>
      ) : null}

      {error ? (
        <p className="border-b border-line bg-brand-tint px-5 py-2.5 text-xs text-brand">
          {error}
        </p>
      ) : null}

      {images.fields.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-muted">
          No images yet. Drop in a square product shot to get started.
        </p>
      ) : (
        <ul className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-3">
          {images.fields.map((field: any, index: number) => {
            const value = watchedImages[index];
            const url = imageUrl(value ?? {});
            return (
              <li
                key={field.id}
                className="overflow-hidden rounded-xl border border-line"
              >
                <div className="relative aspect-square bg-surface">
                  {url ? (
                    <Image
                      src={url}
                      alt=""
                      fill
                      sizes="240px"
                      className="object-contain p-3"
                      unoptimized
                    />
                  ) : null}
                  {value?.isPrimary ? (
                    <span className="absolute left-2 top-2">
                      <Badge tone="brand">Primary</Badge>
                    </span>
                  ) : null}
                </div>

                <div className="space-y-2 border-t border-line p-3">
                  <Input
                    {...register(`images.${index}.alt`)}
                    placeholder="Alt text (required)"
                    aria-label="Alt text"
                    className="h-8 text-xs"
                  />

                  {axis1?.values?.length ? (
                    <select
                      value={value?.optionValueCode ?? ""}
                      onChange={(e) =>
                        setValue(
                          `images.${index}.optionValueCode`,
                          e.target.value || null,
                          { shouldDirty: true },
                        )
                      }
                      aria-label="Attach to variant"
                      className="h-8 w-full rounded-lg border border-line bg-white px-2 text-xs outline-none"
                    >
                      <option value="">Shared — shown for all variants</option>
                      {axis1.values.map((v: any) => (
                        <option key={v.valueCode} value={v.valueCode}>
                          {axis1.name}: {v.label}
                        </option>
                      ))}
                    </select>
                  ) : null}

                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      onClick={() => {
                        watchedImages.forEach((_, i) =>
                          setValue(`images.${i}.isPrimary`, i === index, {
                            shouldDirty: true,
                          }),
                        );
                      }}
                      className={cn(
                        "inline-flex items-center gap-1 rounded px-1.5 py-1 text-[11px] font-medium transition-colors",
                        value?.isPrimary
                          ? "text-brand"
                          : "text-faint hover:text-ink",
                      )}
                    >
                      <Star
                        className="size-3"
                        fill={value?.isPrimary ? "currentColor" : "none"}
                      />
                      Primary
                    </button>

                    <div className="flex gap-0.5">
                      <IconButton
                        label="Move left"
                        disabled={index === 0}
                        onClick={() => images.move(index, index - 1)}
                      >
                        <ArrowUp className="size-3.5 -rotate-90" />
                      </IconButton>
                      <IconButton
                        label="Move right"
                        disabled={index === images.fields.length - 1}
                        onClick={() => images.move(index, index + 1)}
                      >
                        <ArrowDown className="size-3.5 -rotate-90" />
                      </IconButton>
                      <IconButton
                        label="Remove"
                        onClick={() => images.remove(index)}
                      >
                        <Trash2 className="size-3.5" />
                      </IconButton>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}

// ─── Variants ────────────────────────────────────────────────────────────────

function VariantsPanel({
  options,
  watchedOptions,
  control,
  register,
  skus,
  watchedSkus,
  setValue,
  getValues,
}: {
  options: any;
  watchedOptions: any[];
  control: any;
  register: any;
  skus: any;
  watchedSkus: any[];
  setValue: any;
  getValues: any;
}) {
  function generateSkus() {
    const current = getValues("options") as any[];
    const active = current.filter((o) => o?.values?.length);

    if (active.length === 0) {
      toast.error("Add an option axis with at least one value first.");
      return;
    }

    const sorted = [...active].sort((a, b) => a.position - b.position);
    let combos: Record<string, string>[] = [{}];
    for (const option of sorted) {
      const next: Record<string, string>[] = [];
      for (const combo of combos) {
        for (const value of option.values) {
          next.push({ ...combo, [option.name]: value.valueCode });
        }
      }
      combos = next;
    }

    if (combos.length > MAX_GENERATED_SKUS) {
      toast.error(
        `That would create ${combos.length} variants (limit ${MAX_GENERATED_SKUS}).`,
        {
          description:
            "Each variant needs its own price table. Split this into separate products instead.",
        },
      );
      return;
    }

    const existing = getValues("skus") as any[];
    const signature = (codes: Record<string, string>) =>
      sorted.map((o) => codes[o.name] ?? "").join("|");
    const seen = new Set(existing.map((s) => signature(s.valueCodes ?? {})));

    // Idempotent: only append combinations that don't already exist, so
    // re-running never wipes tiers that have already been entered.
    let added = 0;
    for (const combo of combos) {
      if (seen.has(signature(combo))) continue;
      skus.append({
        skuCode: "",
        valueCodes: combo,
        moq: null,
        priceOnRequest: false,
        isActive: true,
        tiers: [],
      });
      added++;
    }

    toast.success(
      added === 0
        ? "All combinations already exist"
        : `Added ${added} variant${added === 1 ? "" : "s"}`,
      { description: `${combos.length} total combinations.` },
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Option axes"
          description="Up to three. Axis 1 is the only one that swaps the gallery images; 2 and 3 affect price only."
          action={
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={options.fields.length >= 3}
              onClick={() =>
                options.append({
                  position: options.fields.length + 1,
                  name: "",
                  helpText: "",
                  displayAs: "CHIP",
                  values: [
                    { label: "", valueCode: "", swatchHex: "", description: "", isDefault: true },
                  ],
                })
              }
            >
              <Plus className="size-3.5" aria-hidden />
              Add axis
            </Button>
          }
        />

        {options.fields.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted">
            No options. This product has a single variant — set its price on the
            Pricing tab.
          </p>
        ) : (
          <div className="divide-y divide-line">
            {options.fields.map((field: any, oi: number) => (
              <OptionEditor
                key={field.id}
                index={oi}
                control={control}
                register={register}
                setValue={setValue}
                option={watchedOptions[oi]}
                onRemove={() => options.remove(oi)}
              />
            ))}
          </div>
        )}
      </Card>

      <Card>
        <CardHeader
          title="Variants"
          description={`${watchedSkus.length} combination${watchedSkus.length === 1 ? "" : "s"}. Generating is safe to re-run — it never overwrites prices you have already entered.`}
          action={
            <Button type="button" size="sm" onClick={generateSkus}>
              <Wand2 className="size-3.5" aria-hidden />
              Generate variants
            </Button>
          }
        />
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line bg-surface text-left">
                {["Combination", "SKU code", "Active", ""].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2 text-xs font-semibold uppercase tracking-[0.06em] text-muted"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {skus.fields.map((field: any, si: number) => {
                const sku = watchedSkus[si];
                const label =
                  Object.entries(sku?.valueCodes ?? {})
                    .map(([name, code]) => {
                      const option = watchedOptions.find((o) => o?.name === name);
                      const value = option?.values?.find(
                        (v: any) => v.valueCode === code,
                      );
                      return `${name}: ${value?.label ?? code}`;
                    })
                    .join(" · ") || "Default (no options)";

                return (
                  <tr key={field.id}>
                    <td className="px-4 py-2 text-xs text-body">{label}</td>
                    <td className="px-4 py-2">
                      <Input
                        {...register(`skus.${si}.skuCode`)}
                        placeholder="Optional"
                        className="h-8 w-40 font-mono text-xs"
                        aria-label="SKU code"
                      />
                    </td>
                    <td className="px-4 py-2">
                      <Controller
                        control={control}
                        name={`skus.${si}.isActive`}
                        render={({ field: f }) => (
                          <Switch checked={f.value} onCheckedChange={f.onChange} />
                        )}
                      />
                    </td>
                    <td className="px-4 py-2 text-right">
                      <IconButton label="Remove" onClick={() => skus.remove(si)}>
                        <Trash2 className="size-3.5" />
                      </IconButton>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="border-t border-line px-4 py-2.5 text-xs text-faint">
          Switching a variant off keeps its history but hides it from the
          storefront — use it for combinations that cannot actually be made.
        </p>
      </Card>
    </div>
  );
}

function OptionEditor({
  index,
  control,
  register,
  setValue,
  option,
  onRemove,
}: {
  index: number;
  control: any;
  register: any;
  setValue: any;
  option: any;
  onRemove: () => void;
}) {
  const values = useFieldArray({ control, name: `options.${index}.values` });

  return (
    <div className="p-5">
      <div className="flex flex-wrap items-end gap-3">
        <Field label="Axis name" className="min-w-40 flex-1">
          <Input
            {...register(`options.${index}.name`)}
            placeholder="Material"
            onBlur={(e: any) => {
              register(`options.${index}.name`).onBlur(e);
            }}
          />
        </Field>

        <Field label="Position" className="w-24">
          <Controller
            control={control}
            name={`options.${index}.position`}
            render={({ field }) => (
              <select
                value={field.value}
                onChange={(e) => field.onChange(Number(e.target.value))}
                className="h-9 w-full rounded-lg border border-line bg-white px-2 text-sm outline-none"
              >
                {[1, 2, 3].map((p) => (
                  <option key={p} value={p}>
                    {p}
                    {p === 1 ? " (images)" : ""}
                  </option>
                ))}
              </select>
            )}
          />
        </Field>

        <Field label="Rendered as" className="w-36">
          <Controller
            control={control}
            name={`options.${index}.displayAs`}
            render={({ field }) => (
              <select
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                className="h-9 w-full rounded-lg border border-line bg-white px-2 text-sm outline-none"
              >
                {DISPLAYS.map((d) => (
                  <option key={d} value={d}>
                    {d.toLowerCase()}
                  </option>
                ))}
              </select>
            )}
          />
        </Field>

        <Field label="Help text" className="min-w-48 flex-1">
          <Input
            {...register(`options.${index}.helpText`)}
            placeholder="Shown under the axis label"
          />
        </Field>

        <IconButton label="Remove axis" onClick={onRemove}>
          <Trash2 className="size-3.5" />
        </IconButton>
      </div>

      <div className="mt-4 rounded-lg border border-line">
        <div className="flex items-center justify-between border-b border-line bg-surface px-3 py-2">
          <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
            Values
          </span>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() =>
              values.append({
                label: "",
                valueCode: "",
                swatchHex: "",
                description: "",
                isDefault: false,
              })
            }
          >
            <Plus className="size-3.5" aria-hidden />
            Add value
          </Button>
        </div>

        <ul className="divide-y divide-line">
          {values.fields.map((field, vi) => (
            <li
              key={field.id}
              className="grid grid-cols-[1fr_1fr_6rem_auto_auto] items-center gap-2 p-2.5"
            >
              <Input
                {...register(`options.${index}.values.${vi}.label`)}
                placeholder="Label, e.g. Wood"
                className="h-8 text-xs"
                onBlur={(e: any) => {
                  register(`options.${index}.values.${vi}.label`).onBlur(e);
                  const codePath = `options.${index}.values.${vi}.valueCode`;
                  if (!option?.values?.[vi]?.valueCode && e.target.value) {
                    setValue(codePath, slugify(e.target.value), {
                      shouldDirty: true,
                    });
                  }
                }}
              />
              <Input
                {...register(`options.${index}.values.${vi}.valueCode`)}
                placeholder="url-code"
                className="h-8 font-mono text-xs"
              />
              <Input
                {...register(`options.${index}.values.${vi}.swatchHex`)}
                placeholder="#D12429"
                className="h-8 font-mono text-xs"
              />
              <label className="flex items-center gap-1.5 text-[11px] text-muted">
                <Controller
                  control={control}
                  name={`options.${index}.values.${vi}.isDefault`}
                  render={({ field: f }) => (
                    <Checkbox
                      checked={f.value}
                      onCheckedChange={(checked) => {
                        // Only one default per axis.
                        option?.values?.forEach((_: any, i: number) =>
                          setValue(
                            `options.${index}.values.${i}.isDefault`,
                            checked ? i === vi : false,
                            { shouldDirty: true },
                          ),
                        );
                      }}
                    />
                  )}
                />
                Default
              </label>
              <IconButton label="Remove value" onClick={() => values.remove(vi)}>
                <Trash2 className="size-3.5" />
              </IconButton>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Pricing ─────────────────────────────────────────────────────────────────

function PricingPanel({
  skus,
  watchedSkus,
  watchedOptions,
  control,
  register,
  setValue,
  getValues,
  unit,
  unitLabel,
  qtyStep,
  productMoq,
  pricingMode,
}: {
  skus: any;
  watchedSkus: any[];
  watchedOptions: any[];
  control: any;
  register: any;
  setValue: any;
  getValues: any;
  unit: any;
  unitLabel: string | null;
  qtyStep: number;
  productMoq: number | null;
  pricingMode: "TIERED" | "ON_REQUEST";
}) {
  const [probeQty, setProbeQty] = useState(100);
  const [bulkTarget, setBulkTarget] = useState<number | null>(null);

  function applyTiersToAll(sourceIndex: number) {
    const tiers = getValues(`skus.${sourceIndex}.tiers`);
    if (!tiers?.length) {
      toast.error("That variant has no tiers to copy.");
      return;
    }
    const all = getValues("skus") as any[];
    all.forEach((_, i) => {
      if (i === sourceIndex) return;
      setValue(`skus.${i}.tiers`, JSON.parse(JSON.stringify(tiers)), {
        shouldDirty: true,
      });
    });
    setBulkTarget(null);
    toast.success(`Applied to ${all.length - 1} other variant(s)`);
  }

  return (
    <div className="space-y-6">
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Controller
              control={control}
              name="pricingMode"
              render={({ field }) => (
                <Switch
                  checked={field.value === "ON_REQUEST"}
                  onCheckedChange={(checked) =>
                    field.onChange(checked ? "ON_REQUEST" : "TIERED")
                  }
                />
              )}
            />
            <span className="text-body">
              Whole product is <strong className="text-ink">price on request</strong>
            </span>
          </label>
          <p className="text-xs text-faint">
            {pricingMode === "ON_REQUEST"
              ? "The storefront shows a quote panel instead of a price table. Both buttons still work."
              : "Individual variants can still be marked price-on-request below."}
          </p>

          <div className="ml-auto flex items-center gap-2">
            <Label htmlFor="probe">Price check at</Label>
            <Input
              id="probe"
              type="number"
              value={probeQty}
              onChange={(e) => setProbeQty(Number(e.target.value) || 0)}
              className="h-8 w-24 text-xs"
            />
          </div>
        </div>
      </Card>

      {skus.fields.map((field: any, si: number) => (
        <SkuPricingCard
          key={field.id}
          index={si}
          sku={watchedSkus[si]}
          watchedOptions={watchedOptions}
          control={control}
          register={register}
          unit={unit}
          unitLabel={unitLabel}
          qtyStep={qtyStep}
          productMoq={productMoq}
          pricingMode={pricingMode}
          probeQty={probeQty}
          bulkOpen={bulkTarget === si}
          onBulkToggle={() => setBulkTarget(bulkTarget === si ? null : si)}
          onApplyToAll={() => applyTiersToAll(si)}
          totalSkus={skus.fields.length}
        />
      ))}
    </div>
  );
}

function SkuPricingCard({
  index,
  sku,
  watchedOptions,
  control,
  register,
  unit,
  unitLabel,
  qtyStep,
  productMoq,
  pricingMode,
  probeQty,
  bulkOpen,
  onBulkToggle,
  onApplyToAll,
  totalSkus,
}: any) {
  const tiers = useFieldArray({ control, name: `skus.${index}.tiers` });

  const label =
    Object.entries(sku?.valueCodes ?? {})
      .map(([name, code]) => {
        const option = watchedOptions.find((o: any) => o?.name === name);
        return option?.values?.find((v: any) => v.valueCode === code)?.label ?? code;
      })
      .join(" / ") || "Default variant";

  const tierValues = (sku?.tiers ?? [])
    .filter((t: any) => t && Number.isFinite(t.minQty))
    .map((t: any) => ({ minQty: Number(t.minQty), unitPrice: Number(t.unitPrice) }));

  const ranges = buildTierRanges(tierValues, qtyStep);
  const effectiveMoq = sku?.moq ?? productMoq ?? tierValues[0]?.minQty ?? null;
  const moqBelowTier =
    effectiveMoq != null &&
    tierValues.length > 0 &&
    effectiveMoq < Math.min(...tierValues.map((t: any) => t.minQty));

  const probe = resolvePrice({
    product: { pricingMode, moq: productMoq, qtyStep, unit },
    sku: {
      id: "probe",
      priceOnRequest: Boolean(sku?.priceOnRequest),
      moq: sku?.moq ?? null,
      priceTiers: tierValues,
    },
    quantity: probeQty,
  });

  const noPrice = !sku?.priceOnRequest && tierValues.length === 0;

  return (
    <Card>
      <CardHeader
        title={label}
        description={sku?.skuCode ? `SKU ${sku.skuCode}` : undefined}
        action={
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-muted">
              <Controller
                control={control}
                name={`skus.${index}.priceOnRequest`}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
              On request
            </label>
            {totalSkus > 1 ? (
              <Button type="button" size="sm" variant="outline" onClick={onBulkToggle}>
                <Sparkles className="size-3.5" aria-hidden />
                Copy to all
              </Button>
            ) : null}
          </div>
        }
      />

      {bulkOpen ? (
        <div className="flex items-center gap-3 border-b border-line bg-warning-tint px-5 py-3">
          <AlertTriangle className="size-4 shrink-0 text-warning" aria-hidden />
          <p className="flex-1 text-xs text-warning">
            This replaces the tier table on every other variant of this product.
          </p>
          <Button type="button" size="sm" onClick={onApplyToAll}>
            <Check className="size-3.5" aria-hidden />
            Apply
          </Button>
        </div>
      ) : null}

      {noPrice ? (
        <p className="flex items-start gap-2 border-b border-line bg-warning-tint px-5 py-2.5 text-xs text-warning">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          No tiers and not marked price-on-request — this variant will show as
          unpriced on the storefront.
        </p>
      ) : null}

      {moqBelowTier ? (
        <p className="flex items-start gap-2 border-b border-line bg-warning-tint px-5 py-2.5 text-xs text-warning">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          MOQ {effectiveMoq} is below the lowest tier (
          {Math.min(...tierValues.map((t: any) => t.minQty))}). Quantities in
          between are quoted at the lowest tier&apos;s rate.
        </p>
      ) : null}

      <div className="grid gap-5 p-5 lg:grid-cols-[1.4fr_1fr]">
        <div>
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
              Quantity breaks
            </span>
            <div className="flex items-center gap-2">
              <Input
                {...register(`skus.${index}.moq`, {
                  setValueAs: (v: string) => (v === "" ? null : Number(v)),
                })}
                type="number"
                placeholder={`MOQ (${productMoq ?? "—"})`}
                aria-label="Variant MOQ override"
                className="h-8 w-28 text-xs"
              />
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={sku?.priceOnRequest}
                onClick={() =>
                  tiers.append({
                    minQty: tierValues.length
                      ? Math.max(...tierValues.map((t: any) => t.minQty)) * 2
                      : (effectiveMoq ?? 1),
                    unitPrice: 0,
                    compareAtPrice: null,
                    note: "",
                  })
                }
              >
                <Plus className="size-3.5" aria-hidden />
                Tier
              </Button>
            </div>
          </div>

          {tiers.fields.length === 0 ? (
            <p className="rounded-lg border border-dashed border-line py-6 text-center text-xs text-muted">
              {sku?.priceOnRequest
                ? "Price on request — no tiers needed."
                : "No tiers yet."}
            </p>
          ) : (
            <ul className="space-y-2">
              {tiers.fields.map((tierField, ti) => (
                <li
                  key={tierField.id}
                  className="grid grid-cols-[1fr_1fr_auto] items-center gap-2"
                >
                  <Input
                    {...register(`skus.${index}.tiers.${ti}.minQty`, {
                      valueAsNumber: true,
                    })}
                    type="number"
                    step="any"
                    placeholder="From qty"
                    aria-label="Minimum quantity"
                    className="h-8 text-xs tabular-nums"
                  />
                  <Input
                    {...register(`skus.${index}.tiers.${ti}.unitPrice`, {
                      valueAsNumber: true,
                    })}
                    type="number"
                    step="any"
                    placeholder="৳ per unit"
                    aria-label="Unit price"
                    className="h-8 text-xs tabular-nums"
                  />
                  <IconButton label="Remove tier" onClick={() => tiers.remove(ti)}>
                    <Trash2 className="size-3.5" />
                  </IconButton>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-lg bg-surface p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-muted">
            Storefront preview
          </p>

          {ranges.length === 0 ? (
            <p className="mt-2 text-sm text-ink">
              {sku?.priceOnRequest || pricingMode === "ON_REQUEST"
                ? "Price on request"
                : "—"}
            </p>
          ) : (
            <table className="mt-2 w-full text-xs">
              <tbody>
                {ranges.map((range) => (
                  <tr
                    key={range.index}
                    className={cn(
                      "border-b border-line last:border-0",
                      range.index === probe.tierIndex &&
                        !probe.isPriceOnRequest &&
                        "font-semibold text-brand",
                    )}
                  >
                    <td className="py-1.5 tabular-nums">
                      {formatTierRange(range.minQty, range.maxQty, unit, unitLabel)}
                    </td>
                    <td className="py-1.5 text-right tabular-nums">
                      {formatBDT(range.unitPrice)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          <hr className="my-3 border-line" />
          <p className="text-xs text-muted">
            At <span className="font-medium tabular-nums text-ink">{probeQty}</span>:{" "}
            {probe.isPriceOnRequest ? (
              <span className="font-medium text-ink">on request</span>
            ) : (
              <>
                <span className="font-medium tabular-nums text-ink">
                  {formatBDT(probe.unitPrice)}
                </span>{" "}
                each ={" "}
                <span className="font-semibold tabular-nums text-brand">
                  {formatBDT(probe.lineTotal)}
                </span>
              </>
            )}
          </p>
          {probe.belowMoq ? (
            <p className="mt-1 text-[11px] text-warning">
              Below MOQ ({probe.moq}).
            </p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
