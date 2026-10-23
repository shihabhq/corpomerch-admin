-- Corpomerch Connect: NFC digital business cards.

CREATE TABLE "connect_cards" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT,
    "owner_id" UUID,
    "owner_email" TEXT,
    "claimed_at" TIMESTAMPTZ(6),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" UUID,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "connect_cards_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "connect_profiles" (
    "id" UUID NOT NULL,
    "card_id" UUID NOT NULL,
    "full_name" TEXT NOT NULL DEFAULT '',
    "job_title" TEXT,
    "company" TEXT,
    "bio" TEXT,
    "avatar_path" TEXT,
    "theme" TEXT NOT NULL DEFAULT 'ember',
    "color_mode" TEXT NOT NULL DEFAULT 'system',
    "items" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "connect_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "connect_cards_slug_key" ON "connect_cards"("slug");
CREATE UNIQUE INDEX "connect_cards_owner_id_key" ON "connect_cards"("owner_id");
CREATE INDEX "connect_cards_created_at_idx" ON "connect_cards"("created_at");
CREATE UNIQUE INDEX "connect_profiles_card_id_key" ON "connect_profiles"("card_id");

ALTER TABLE "connect_profiles"
  ADD CONSTRAINT "connect_profiles_card_id_fkey"
  FOREIGN KEY ("card_id") REFERENCES "connect_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "connect_email_verifications" (
    "id" UUID NOT NULL,
    "user_id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "card_slug" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMPTZ(6) NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_sent_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "connect_email_verifications_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "connect_email_verifications_user_id_key" ON "connect_email_verifications"("user_id");
ALTER TABLE "connect_email_verifications"
  ADD CONSTRAINT "connect_email_verifications_user_fk"
  FOREIGN KEY ("user_id") REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE "connect_email_verifications" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "connect_email_verifications" FROM anon, authenticated;
-- Tie the owner to Supabase Auth (Prisma cannot express cross-schema FKs).
-- SET NULL: deleting the auth user frees the card to be claimed again.
ALTER TABLE "connect_cards"
  ADD CONSTRAINT "connect_cards_owner_auth_fk"
  FOREIGN KEY ("owner_id") REFERENCES auth.users(id) ON DELETE SET NULL;

-- Deny-by-default behind the public anon key, like every other table. Prisma
-- connects as a privileged role, so the apps are unaffected.
ALTER TABLE "connect_cards"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "connect_profiles" ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON "connect_cards"    FROM anon, authenticated;
REVOKE ALL ON "connect_profiles" FROM anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────────
-- Storage.
--
-- Until now ANY signed-in user could write to product-images / site-assets
-- ("TO authenticated" with no further check). That was fine while only admins
-- could sign in. Connect customers now sign in to the same Supabase project, so
-- those write policies are narrowed to active admin_users.
--
-- Customers get their own public bucket, writable only inside a folder named
-- after their own user id.
-- ─────────────────────────────────────────────────────────────────────────────
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('connect-avatars', 'connect-avatars', true, 2097152,
          ARRAY['image/webp','image/png','image/jpeg'])
  ON CONFLICT (id) DO NOTHING;

  DROP POLICY IF EXISTS "corpomerch public read"  ON storage.objects;
  DROP POLICY IF EXISTS "corpomerch admin write"  ON storage.objects;
  DROP POLICY IF EXISTS "corpomerch admin update" ON storage.objects;
  DROP POLICY IF EXISTS "corpomerch admin delete" ON storage.objects;
  DROP POLICY IF EXISTS "connect owner write"     ON storage.objects;
  DROP POLICY IF EXISTS "connect owner update"    ON storage.objects;
  DROP POLICY IF EXISTS "connect owner delete"    ON storage.objects;

  CREATE POLICY "corpomerch public read" ON storage.objects
    FOR SELECT TO anon, authenticated
    USING (bucket_id IN ('product-images', 'site-assets', 'connect-avatars'));

  CREATE POLICY "corpomerch admin write" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id IN ('product-images', 'site-assets')
      AND EXISTS (SELECT 1 FROM public.admin_users a WHERE a.id = auth.uid() AND a.is_active)
    );

  CREATE POLICY "corpomerch admin update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (
      bucket_id IN ('product-images', 'site-assets')
      AND EXISTS (SELECT 1 FROM public.admin_users a WHERE a.id = auth.uid() AND a.is_active)
    );

  CREATE POLICY "corpomerch admin delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id IN ('product-images', 'site-assets')
      AND EXISTS (SELECT 1 FROM public.admin_users a WHERE a.id = auth.uid() AND a.is_active)
    );

  CREATE POLICY "connect owner write" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'connect-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

  CREATE POLICY "connect owner update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'connect-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

  CREATE POLICY "connect owner delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'connect-avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION
  WHEN insufficient_privilege OR undefined_table THEN
    RAISE NOTICE 'skipped storage setup (insufficient privilege) — apply bucket + policies in the dashboard';
END;
$$;
