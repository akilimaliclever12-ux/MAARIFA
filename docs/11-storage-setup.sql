-- =============================================================
-- Maarifa — Storage buckets + policies. Run once in Supabase SQL Editor.
-- Requires the main schema (04-database-schema.sql) to be applied first
-- (it uses public.is_staff()).
-- =============================================================

-- 1. BUCKETS
insert into storage.buckets (id, name, public) values
  ('publications', 'publications', false),  -- private: PDFs served via signed URLs
  ('avatars',      'avatars',      true)    -- public: small profile images
on conflict (id) do nothing;

-- 2. PUBLICATIONS BUCKET POLICIES
-- Path convention: publications/<user_id>/<uuid>.pdf
-- Authenticated users manage files inside their own <user_id>/ folder.
-- Staff (moderator/admin) manage everything. No public read (signed URLs only).

create policy "pub_insert_own_folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'publications'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pub_update_own_folder"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'publications'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pub_delete_own_folder"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'publications'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "pub_select_own_or_staff"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'publications'
    and ((storage.foldername(name))[1] = auth.uid()::text or public.is_staff())
  );

create policy "pub_staff_all"
  on storage.objects for all
  using (bucket_id = 'publications' and public.is_staff())
  with check (bucket_id = 'publications' and public.is_staff());

-- 3. AVATARS BUCKET POLICIES (public read; owners manage own folder)
create policy "avatars_public_read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "avatars_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================
-- END. Public download counting + signed URLs are generated server-side
-- by the app using the service-role key (bypasses these policies safely).
-- =============================================================
