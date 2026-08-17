-- CorpoMerch — hardening migration
--
-- Everything here is something Prisma's DSL cannot express. It is deliberately
-- limited to object types Prisma's migrate-diff IGNORES (extensions, CHECK
-- constraints, functions, triggers, RLS, storage), so it never shows up as
-- drift and never gets "helpfully" dropped by a later `migrate dev`.
--
-- Notably ABSENT on purpose:
--   * partial unique indexes (one primary category / one default sku / one
--     default option value) — Prisma manages indexes and would fight us. These
--     invariants are enforced in the server actions instead. See CLAUDE.md §4.
--   * tsvector + pg_trgm search — over-engineering for a catalogue this size.
--     Search is ILIKE over name/description via Prisma. Revisit past ~1k rows.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Column naming fix: valueCode -> value_code
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "product_option_values" RENAME COLUMN "valueCode" TO "value_code";

ALTER INDEX "product_option_values_option_id_valueCode_key"
  RENAME TO "product_option_values_option_id_value_code_key";

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Variant axes are capped at three, and position is 1-based.
--    Axis 1 is the image-swapping axis; 2 and 3 affect price only.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "product_options"
  ADD CONSTRAINT "product_options_position_range"
  CHECK ("position" BETWEEN 1 AND 3);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Money and quantity must never be negative.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "price_tiers"
  ADD CONSTRAINT "price_tiers_min_qty_positive"    CHECK ("min_qty" > 0),
  ADD CONSTRAINT "price_tiers_unit_price_positive" CHECK ("unit_price" >= 0);

ALTER TABLE "products"
  ADD CONSTRAINT "products_qty_step_positive" CHECK ("qty_step" > 0),
  ADD CONSTRAINT "products_moq_positive"      CHECK ("moq" IS NULL OR "moq" > 0);

ALTER TABLE "skus"
  ADD CONSTRAINT "skus_moq_positive" CHECK ("moq" IS NULL OR "moq" > 0);

ALTER TABLE "inquiry_items"
  ADD CONSTRAINT "inquiry_items_quantity_positive" CHECK ("quantity" > 0);

-- ─────────────────────────────────────────────────────────────────────────────
-- 4. A product image points either at Storage or at an external URL, not both,
--    and not neither.
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE "product_images"
  ADD CONSTRAINT "product_images_one_source" CHECK (
    ("storage_path" IS NOT NULL AND "external_url" IS NULL) OR
    ("storage_path" IS NULL     AND "external_url" IS NOT NULL)
  );

-- ─────────────────────────────────────────────────────────────────────────────
-- 5. Category tree is capped at two levels (the storefront nav is a two-level
--    mega-menu; a third level would silently never render).
-- ─────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.enforce_category_depth()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  grandparent uuid;
BEGIN
  IF NEW.parent_id IS NULL THEN
    RETURN NEW;
  END IF;

  IF NEW.parent_id = NEW.id THEN
    RAISE EXCEPTION 'a category cannot be its own parent' USING ERRCODE = '23514';
  END IF;

  SELECT parent_id INTO grandparent FROM public.categories WHERE id = NEW.parent_id;

  IF grandparent IS NOT NULL THEN
    RAISE EXCEPTION 'categories are limited to 2 levels' USING ERRCODE = '23514';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS t_categories_depth ON public.categories;
CREATE TRIGGER t_categories_depth
  BEFORE INSERT OR UPDATE OF parent_id ON public.categories
  FOR EACH ROW EXECUTE FUNCTION public.enforce_category_depth();

-- ─────────────────────────────────────────────────────────────────────────────
-- 6. Lockdown.
--
-- Neither app talks to PostgREST — all reads and writes go through Prisma,
-- which connects as the table owner and therefore bypasses RLS. The public
-- anon key ships in both browser bundles, so the correct posture for every
-- table is: RLS on, ZERO policies, and no grants to anon/authenticated.
--
-- Deny-by-default beats a large policy suite that has to be kept correct.
-- If a table is ever genuinely meant to be readable by the anon key, add an
-- explicit policy for it in its own migration and say why.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
DECLARE
  t record;
BEGIN
  FOR t IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t.tablename);
    EXECUTE format('REVOKE ALL ON public.%I FROM anon, authenticated', t.tablename);
  END LOOP;
END;
$$;

-- Stop Supabase's default privileges from re-granting on tables added later.
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES    FROM anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON SEQUENCES FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- 7. Storage buckets.
--
-- Public read (product photos are public marketing assets and are served
-- straight from the CDN by next/image); writes restricted to signed-in admins.
-- Wrapped in an exception guard because the migration role may not own
-- storage.objects on every Supabase plan — if it fails, create the buckets
-- once from the dashboard and the rest of the app is unaffected.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES
    ('product-images', 'product-images', true, 10485760,
     ARRAY['image/webp','image/png','image/jpeg','image/avif']),
    ('site-assets',    'site-assets',    true, 10485760,
     ARRAY['image/webp','image/png','image/jpeg','image/avif','image/svg+xml'])
  ON CONFLICT (id) DO NOTHING;
EXCEPTION
  WHEN insufficient_privilege OR undefined_table THEN
    RAISE NOTICE 'skipped bucket creation (insufficient privilege) — create them in the dashboard';
END;
$$;

DO $$
BEGIN
  DROP POLICY IF EXISTS "corpomerch public read"  ON storage.objects;
  DROP POLICY IF EXISTS "corpomerch admin write"  ON storage.objects;
  DROP POLICY IF EXISTS "corpomerch admin update" ON storage.objects;
  DROP POLICY IF EXISTS "corpomerch admin delete" ON storage.objects;

  CREATE POLICY "corpomerch public read" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id IN ('product-images', 'site-assets'));

  CREATE POLICY "corpomerch admin write" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id IN ('product-images', 'site-assets'));

  CREATE POLICY "corpomerch admin update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id IN ('product-images', 'site-assets'));

  CREATE POLICY "corpomerch admin delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id IN ('product-images', 'site-assets'));
EXCEPTION
  WHEN insufficient_privilege OR undefined_table THEN
    RAISE NOTICE 'skipped storage policies (insufficient privilege) — set them in the dashboard';
END;
$$;
