-- =============================================================
-- Maarifa — Publication first-page thumbnails. Run once in Supabase SQL Editor.
-- Adds publications.thumbnail_url + a public `thumbnails` storage bucket.
-- Thumbnails are generated in the uploader's browser (pdf.js) at upload time.
-- =============================================================

-- 1. Column for the thumbnail image URL (public).
alter table public.publications
  add column if not exists thumbnail_url text;

-- 2. Public bucket for thumbnails (small JPEGs; safe to be public).
insert into storage.buckets (id, name, public) values
  ('thumbnails', 'thumbnails', true)
on conflict (id) do nothing;

-- 3. Policies: public read; authenticated users manage files in their own folder.
create policy "thumbnails_public_read"
  on storage.objects for select
  using (bucket_id = 'thumbnails');

create policy "thumbnails_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "thumbnails_update_own"
  on storage.objects for update to authenticated
  using (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "thumbnails_delete_own"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'thumbnails'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- =============================================================
-- END
-- =============================================================
