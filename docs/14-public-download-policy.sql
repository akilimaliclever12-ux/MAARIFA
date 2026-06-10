-- =============================================================
-- Maarifa — Allow LOGGED-IN users to download PUBLISHED publications
-- without the service-role key. Run once in the Supabase SQL Editor.
-- (Safe to re-run: drops the policy first.)
--
-- A storage SELECT policy: an AUTHENTICATED user may read an object in the
-- `publications` bucket IF it belongs to a published publication. Anonymous
-- (logged-out) users cannot read/download. Drafts/pending stay private to
-- owner/staff via the existing policy. This lets the app sign download URLs
-- with the session client — no service-role key needed.
-- =============================================================

drop policy if exists "pub_select_published" on storage.objects;

create policy "pub_select_published"
  on storage.objects for select
  to authenticated
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

-- =============================================================
-- END
-- =============================================================
