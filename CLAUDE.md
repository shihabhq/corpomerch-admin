@AGENTS.md

# CorpoMerch — Admin Panel (`corpomerch-admin`)

Internal back-office for **CorpoMerch by Backstage**. Manages the product catalogue, pricing,
site content, and the WhatsApp inquiry inbox for the storefront in `../corpomerch-client`.

**This app owns the database.** The Prisma schema and every migration live here. The storefront
holds a read-only copy of the schema and must never migrate.

---

## 1. What this app is for

CorpoMerch supplies customised corporate merchandise and print (ID cards, lanyards, keyrings,
pens, drinkware, bags, certificates, magazines, banners, backdrops) to businesses and event
organisers in Dhaka. The storefront is a **catalogue-and-quote site with no checkout** — every
customer action ends in a WhatsApp message.

So this admin has **no orders, no payments, no shipping, no customers, no stock**. It has:

1. **Catalogue** — products, their variants, their quantity-break pricing, their images.
2. **Inquiries** — the inbox of WhatsApp quote requests, with a sales pipeline.
3. **Site content** — banners, portfolio, partners, testimonials, FAQs, settings.

The single most important screen in the whole app is the **product form**. Everything else is
ordinary CRUD. Budget your effort accordingly.

---

## 2. Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 16 App Router, React 19, TypeScript strict |
| UI | **shadcn/ui** (Radix + Tailwind v4) — unlike the storefront, which is deliberately hand-rolled |
| Tables | `@tanstack/react-table` |
| Forms | `react-hook-form` + `zod` via `@hookform/resolvers` |
| Drag & drop | `@dnd-kit/*` — image and spec-row reordering |
| Toasts | `sonner` |
| Charts | `recharts` (dashboard only) |
| Data | **Prisma** — schema owner, all migrations |
| Auth | **Supabase Auth** (email + password) via `@supabase/ssr` |
| Storage | **Supabase Storage** — buckets `product-images`, `site-assets` |
| Images | `sharp` server-side for WebP conversion |

Tailwind v4 CSS-first: tokens live in the `@theme` block of `src/app/globals.css`. No
`tailwind.config.*`. Keep the shadcn palette neutral — this is a tool, not a brand surface; the
CorpoMerch red is reserved for destructive/primary accents.

---

## 3. Architecture rules

### Prisma is the source of truth

```
prisma/schema.prisma        canonical — edit here, nowhere else
prisma/migrations/          committed, ordered, never edited after being applied
prisma/seed.ts              idempotent, re-runnable
```

- **Never modify the database by hand** (no Supabase Studio table edits, no ad-hoc SQL in the
  dashboard). Every change is `prisma migrate dev --name <what_changed>`.
- Things Prisma's DSL cannot express — tsvector + trigger, `pg_trgm` indexes, partial unique
  indexes, `ENABLE ROW LEVEL SECURITY`, storage buckets — go in a **hand-edited migration**
  created with `prisma migrate dev --create-only`.
- After any schema change, tell the storefront: `cd ../corpomerch-client && npm run sync:schema && npx prisma generate`.
- `DATABASE_URL` is the Supabase **pooler** (port 6543, `?pgbouncer=true&connection_limit=1`);
  `DIRECT_URL` is the direct connection (port 5432) used by `migrate`. Both are required.

### Auth and authorisation

- Login is Supabase Auth email + password. There is **no public sign-up** — admins are created
  by an existing admin, which inserts both an `auth.users` row and an `AdminUser` row.
- `middleware.ts` refreshes the session and redirects unauthenticated requests to `/login`.
- **Middleware is not authorisation.** Every server action independently calls
  `requireAdmin()` (`src/lib/auth.ts`), which verifies the session *and* that a matching
  `AdminUser` row exists with `isActive: true`. A session alone is not enough.
- **The service-role key must never appear in application code.** It is used by
  `prisma/seed.ts` only. Prisma already connects as a privileged role; adding a service key to a
  server action buys nothing and risks it being bundled. RLS is enabled deny-by-default across
  every table as a hard lock behind the public anon key.

### Mutations

- All writes are **server actions** (`"use server"`), never route handlers.
- Shape: `requireAdmin()` → parse with a zod schema → mutate in a `prisma.$transaction` →
  `recomputeProductPricing(productId)` → `revalidatePath()` → notify the storefront.
- Return `{ ok: true, data }` or `{ ok: false, error }`. Never throw raw Prisma errors at the UI —
  map P2002 (unique violation) to a field-level message.
- **Deletes are soft** (`deletedAt`) for `Product`, `Sku` and `Category`. Historical
  `InquiryItem` rows reference SKUs; a hard delete breaks the inbox retroactively.
- On publish, `POST ${STOREFRONT_URL}/api/revalidate` with `REVALIDATE_SECRET` so ISR pages
  refresh immediately instead of waiting an hour.

---

## 4. Data model

```
Category ──< ProductCategory >── Product ──< ProductImage
                                    │            └── optionValueId?  (NULL = shared gallery)
                                    ├──< ProductOption (position 1-3)
                                    │        └──< ProductOptionValue
                                    └──< Sku ──< SkuOptionValue
                                            └──< PriceTier (minQty → unitPrice)

Inquiry ──< InquiryItem                 AdminUser
Partner · PortfolioItem · HomepageBanner · Testimonial · Faq · SiteSetting
```

### Invariants you are responsible for

1. **Price lives on the SKU, never on the product.** A SKU is one combination of option values.
2. **Every product has at least one SKU.** A product with no options gets one `isDefault: true`
   SKU with zero `SkuOptionValue` rows. Creating a product must create that SKU — the storefront
   has exactly one code path and relies on this.
3. **Only option `position: 1` may carry images.** Positions 2–3 change price but not the
   gallery. Reject an image assigned to an axis-2 or axis-3 value.
4. **`ProductImage.optionValueId` must belong to this product and to axis 1.** Enforced in the
   zod schema and the server action, not by a DB trigger.
5. **`SkuOptionValue.optionValueId` must belong to the referenced `optionId`.** Same.
6. **Tiers are open-ended minimums**, `[{50,15},{100,12}]` = *50–99 → ৳15, 100+ → ৳12*.
   `@@unique([skuId, minQty])` prevents duplicates; the form must also prevent them client-side
   with a clear message rather than surfacing a P2002.
7. **`optionSignature`** is the ordered, comma-joined list of chosen `optionValueId`s, computed
   in TypeScript (`buildOptionSignature()`). With `@@unique([productId, optionSignature])` it is
   what makes "Generate SKUs" idempotent. Never write it by hand.
8. **Money and quantity are `Decimal(12,2)`**, never `Float`, never `Int`. Banners sell per sqft
   and quantities are fractional. Coerce with `new Prisma.Decimal(...)`, compare with `.eq()` /
   `.gte()`, and convert to `number` only at the UI boundary.
9. **`Product.specs` is an ordered array** `[{group?, key, value}]`, not an object. Key order is
   meaningful and duplicate keys must not collapse. (The reference admin stored it as an object
   on the edit page and as an array on the add page — that bug silently lost data. Don't.)
10. **`minUnitPrice` / `maxUnitPrice` / `effectiveMoq` on `Product` are denormalised** and must be
    recomputed by `recomputeProductPricing()` after *any* change to SKUs, tiers, MOQ or pricing
    mode. The storefront's listing pages read these directly; stale values mean wrong prices on
    the site.

---

## 5. The product form

`/products/new` and `/products/[id]` render **one shared `<ProductForm>` component**. Do not
create two files. (The reference admin has two copy-pasted 800-line pages that have already
drifted apart — that is the specific mistake being avoided here.)

One `react-hook-form` instance and one zod schema span all seven tabs; the tab strip shows a
dot on any tab with a validation error.

| Tab | Contents |
|---|---|
| **Basics** | name, auto-slug (editable, uniqueness-checked on blur), subtitle, categories (multi-select, exactly one primary), tags, unit + unit label, `qtyStep`, MOQ, lead time, featured, badge, status |
| **Description** | markdown editor + live preview (long form) and a short/card description with a character counter. **Required to publish.** |
| **Specifications** | dnd-kit reorderable `{group?, key, value}` rows, with per-category quick-add templates (e.g. Print → GSM / Size / Colours / Binding / Finish). **≥1 row required to publish.** |
| **Images** | reorderable grid; drop → WebP → Storage; each image assignable to an axis-1 option value or left shared; set primary |
| **Variants** | up to 3 axes, each with ordered values (label, code, swatch, sort, default) and a `CHIP / SWATCH / DROPDOWN / IMAGE` renderer; **Generate SKUs** |
| **Pricing** | per-SKU tier editor, bulk tier editor, per-SKU MOQ override, POR toggles, live storefront preview, "price this quantity" probe |
| **SEO** | title, description, OG image override, live Google-result preview with length counters |

### Generate SKUs

Materialises the cartesian product of all axis values. It must:

- be **idempotent** — re-running creates nothing new, because `optionSignature` already exists;
- **never destroy existing tiers** — only insert missing combinations;
- **refuse above 64 combinations** with a clear message (3 axes × 5 values = 125 SKUs, each
  needing its own tier table — that is a data-entry disaster, not a feature);
- mark combinations that disappear from the axes as `isActive: false`, not deleted.

`isActive: false` is also how the admin excludes impossible combinations (a ring-style lanyard
has no 2.5 cm width, say) without deleting rows.

### Bulk tier editor

The moment a product has more than ~4 SKUs, entering tiers one at a time is the bottleneck.
Provide "apply this tier table to selected SKUs" with a preview of what will be overwritten.

### Validation warnings — surface, never silence

These are **warnings, not errors** (the underlying data is legitimately messy) and must be
visible in the form and aggregated on the dashboard:

- MOQ is below the lowest tier's `minQty` *(real case: Water Bottle MOQ 20, tiers start at 50)*
- a SKU has neither price tiers nor `priceOnRequest`
- two tiers share a `minQty`
- an axis-1 value has no images while a sibling value does *(customers see the shared gallery)*
- publishing without a primary image, a description, or any specs

---

## 6. Other screens

| Route | Notes |
|---|---|
| `/login` | Supabase email + password. Reject sessions with no active `AdminUser` row and sign them straight back out. |
| `/` | Dashboard: counts, inquiries over time, top-inquired products, recent inquiries, and the data-health warning list from §5 |
| `/products` | TanStack Table — server-side search/filter/sort/pagination. **Never fetch every product with all relations**; that is exactly what the reference admin does and it will not scale. Bulk publish / unpublish / delete, row duplicate. |
| `/categories` | dnd-kit tree, reorder and re-parent, max depth 2 |
| `/inquiries` | Inbox with pipeline `NEW → CONTACTED → QUOTED → WON → LOST` (+`SPAM`), assignee, internal notes, "Reply on WhatsApp" deep link, CSV export |
| `/portfolio` `/partners` `/banners` `/testimonials` `/faqs` | Straightforward CRUD with image upload and drag-order |
| `/settings` | `SiteSetting` singleton — WhatsApp number, contact block, SEO defaults, socials |
| `/users` | `AdminUser` CRUD; deactivate rather than delete |

Shell: `(auth)` and `(dashboard)` route groups, collapsible icon sidebar, nav defined as a
**data array** in `src/config/nav.ts` with `usePathname()` active state — never inline JSX.

---

## 7. Image pipeline

```
drop file → validate (type, ≤10 MB) → sharp → WebP q82 at 1000/800/400 px
          → + 16px base64 blur placeholder
          → upload to product-images/products/{slug}/{n}.webp
          → insert ProductImage { storagePath, width, height, blurDataUrl, alt, sortOrder }
```

- **Product images are square.** Warn on upload if the source is not 1:1 — all existing assets
  are 1000×1000 and the storefront renders `aspect-square object-contain` throughout.
- Store the **path**, not the full URL. Build public URLs through `src/lib/storage.ts` so the
  bucket host can change without a data migration.
- `alt` text is required. Default it to the product name plus the option-value label.
- Deleting a `ProductImage` row must also remove the object from Storage, or the bucket
  accumulates orphans forever.

---

## 8. Folder conventions

```
src/
├─ app/
│  ├─ (auth)/login/
│  ├─ (dashboard)/…                     one folder per route above
│  └─ actions/                          "use server" — one file per domain
├─ components/
│  ├─ ui/                               shadcn primitives (generated; edit sparingly)
│  ├─ layout/                           Sidebar, Topbar, PageHeader
│  ├─ data-table/                       one generic DataTable + column helpers — reuse it
│  └─ products/                         ProductForm and its seven tab panels
├─ lib/          prisma · auth · storage · pricing · validation · utils
├─ config/       nav.ts · spec-templates.ts
└─ types/
```

`components/data-table/` exists so every list screen shares one table with one search/filter/
pagination implementation. Do not hand-roll a `<table>` per page.

`src/lib/pricing.ts` mirrors the storefront's `resolvePrice()` so the "price this quantity"
probe and the storefront agree exactly. If you change one, change both — the pricing preview
lying to the admin is worse than having no preview.

---

## 9. Environment

```
DATABASE_URL                        Supabase pooler, port 6543, ?pgbouncer=true&connection_limit=1
DIRECT_URL                          Supabase direct, port 5432 — migrations only
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY  anon key — Auth and public Storage reads only
SUPABASE_SECRET_KEY                 service role — prisma/seed.ts ONLY, never imported by app code
STOREFRONT_URL                      https://corpomerch.com
REVALIDATE_SECRET                   shared with the storefront's /api/revalidate
```

`.gitignore` covers `.env*`. The DB password that shipped in the initial scaffold should be
rotated before this repo goes anywhere.

## 10. Commands

```
npm run dev
npm run build                                   must pass clean before hand-off
npx prisma migrate dev --name <what_changed>
npx prisma migrate dev --create-only            for hand-written SQL
npx prisma studio
npm run seed                                    tsx prisma/seed.ts — idempotent, safe to re-run
```

---

## 11. Corpomerch Connect (NFC cards)

- `/connect` creates card links (`ConnectCard`). A customer claims one by registering at `<CONNECT_APP_URL>/<slug>` in `../corpomerch-connect` — this app never creates customer accounts.
- Schema for `connect_cards` / `connect_profiles` lives here; after changes run `npm run sync:schema` in both `corpomerch-client` and `corpomerch-connect`.
- `CONNECT_APP_URL` is the public origin of the Connect app.
- `npm run seed -- --only=connect-plus` loads just the Connect Plus product without touching other catalogue rows.
