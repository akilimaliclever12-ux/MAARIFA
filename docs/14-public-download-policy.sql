-- =============================================================
-- Maarifa — Allow downloads of PUBLISHED publications without the
-- service-role key. Run once in the Supabase SQL Editor.
--
-- Adds a storage SELECT policy: anyone may read an object in the
-- `publications` bucket IF it belongs to a published publication. Drafts /
-- pending files stay private (only owner or staff). This lets the app sign
-- download URLs with the anon/session client — no service-role key needed.
-- =============================================================

create policy "pub_select_published"
  on storage.objects for select
  using (
    bucket_id = 'publications'
    and exists (
      select 1
      from public.publication_files pf
      join public.publications p on p.id = pf.publication_id
      where pf.storage_path = storage.objects.name
        and p.status = 'published'
    )
  );

-- Note: this is an additional permissive policy. The existing owner/staff
-- SELECT policy (from 11-storage-setup.sql) still applies for unpublished files.
-- =============================================================
-- END
-- =============================================================
