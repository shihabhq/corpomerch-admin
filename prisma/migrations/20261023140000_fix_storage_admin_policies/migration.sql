-- Fix: storage uploads failed for everyone.
--
-- The admin write policies on product-images / site-assets checked admin_users
-- directly. Signed-in users have no privileges on that table (RLS hardening
-- revokes them), so evaluating the policy raised "permission denied for table
-- admin_users" — and because Postgres evaluates every permissive INSERT policy,
-- that error also blocked Connect customers' own uploads (and admin uploads).
--
-- The check moves into a SECURITY DEFINER function, which reads admin_users as
-- its owner and exposes only a boolean.
CREATE OR REPLACE FUNCTION public.is_active_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admin_users a WHERE a.id = auth.uid() AND a.is_active)
$$;

REVOKE ALL ON FUNCTION public.is_active_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_active_admin() TO authenticated;

DO $$
BEGIN
  DROP POLICY IF EXISTS "corpomerch admin write"  ON storage.objects;
  DROP POLICY IF EXISTS "corpomerch admin update" ON storage.objects;
  DROP POLICY IF EXISTS "corpomerch admin delete" ON storage.objects;

  CREATE POLICY "corpomerch admin write" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id IN ('product-images', 'site-assets') AND public.is_active_admin());

  CREATE POLICY "corpomerch admin update" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id IN ('product-images', 'site-assets') AND public.is_active_admin());

  CREATE POLICY "corpomerch admin delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id IN ('product-images', 'site-assets') AND public.is_active_admin());
EXCEPTION
  WHEN insufficient_privilege OR undefined_table THEN
    RAISE NOTICE 'skipped storage policies (insufficient privilege) - apply in the dashboard';
END;
$$;