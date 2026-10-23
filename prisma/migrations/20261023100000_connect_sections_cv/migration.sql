-- Connect profiles: owner-defined sections (experience, skills, free text...) and a downloadable CV.
ALTER TABLE "connect_profiles"
  ADD COLUMN "sections" JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN "cv_path" TEXT,
  ADD COLUMN "cv_name" TEXT;

-- Public bucket for CVs; writable only inside a folder named after the owner's own user id.
DO $$
BEGIN
  INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  VALUES ('connect-documents', 'connect-documents', true, 5242880, ARRAY['application/pdf'])
  ON CONFLICT (id) DO NOTHING;

  DROP POLICY IF EXISTS "connect docs read"   ON storage.objects;
  DROP POLICY IF EXISTS "connect docs write"  ON storage.objects;
  DROP POLICY IF EXISTS "connect docs update" ON storage.objects;
  DROP POLICY IF EXISTS "connect docs delete" ON storage.objects;

  CREATE POLICY "connect docs read" ON storage.objects
    FOR SELECT TO anon, authenticated USING (bucket_id = 'connect-documents');

  CREATE POLICY "connect docs write" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'connect-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

  CREATE POLICY "connect docs update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'connect-documents' AND (storage.foldername(name))[1] = auth.uid()::text);

  CREATE POLICY "connect docs delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'connect-documents' AND (storage.foldername(name))[1] = auth.uid()::text);
EXCEPTION
  WHEN insufficient_privilege OR undefined_table THEN
    RAISE NOTICE 'skipped storage setup (insufficient privilege) — apply bucket + policies in the dashboard';
END;
$$;