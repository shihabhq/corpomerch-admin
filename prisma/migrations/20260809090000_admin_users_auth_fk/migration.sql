-- Tie admin_users to Supabase Auth.
--
-- Prisma cannot express a cross-schema foreign key, so without this an
-- admin_users row can reference a user id that does not exist — and
-- grantAdmin()'s "no such Supabase user" branch could never actually fire.
--
-- ON DELETE CASCADE: deleting the auth user removes their admin grant too,
-- rather than leaving an orphan row that looks like valid access.
ALTER TABLE public.admin_users
  ADD CONSTRAINT admin_users_auth_user_fk
  FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;
