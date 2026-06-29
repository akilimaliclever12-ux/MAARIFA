-- =============================================================
-- Maarifa — University manager dashboard (Phase 1). Run once.
-- Adds university_managers (who manages which university) + manages_university()
-- helper + a logos bucket. Granting/removing a row here is the access control
-- (and the paywall) for a university's private dashboard.
-- =============================================================

create table if not exists public.university_managers (
  user_id        uuid not null references public.profiles(id) on delete cascade,
  university_id  uuid not null references public.universities(id) on delete cascade,
  created_at     timestamptz not null default now(),
  primary key (user_id, university_id)
);
create index if not exists idx_university_managers_uni on public.university_managers(university_id);

alter table public.university_managers enable row level security;

-- A user sees their own management rows; staff manage all assignments.
create policy um_read_own on public.university_managers for select
  using (user_id = auth.uid() or public.is_staff());
create policy um_staff_all on public.university_managers for all
  using (public.is_staff()) with check (public.is_staff());

-- True if the current user manages the given university (bypasses RLS safely).
create or replace function public.manages_university(p_university_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.university_managers
    where user_id = auth.uid() and university_id = p_university_id
  );
$$;

-- Managers may update their own university (e.g. set the logo).
create policy univ_manager_update on public.universities for update
  using (public.manages_university(id)) with check (public.manages_university(id));

-- Public bucket for university logos.
insert into storage.buckets (id, name, public) values ('logos', 'logos', true)
on conflict (id) do nothing;

create policy logos_public_read on storage.objects for select using (bucket_id = 'logos');
create policy logos_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy logos_update_own on storage.objects for update to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);
create policy logos_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'logos' and (storage.foldername(name))[1] = auth.uid()::text);

-- =============================================================
-- To grant a university dashboard to someone (run as needed):
--   insert into public.university_managers (user_id, university_id)
--   select p.id, u.id from public.profiles p, public.universities u
--   where p.email = 'dean@example.com' and u.slug = 'uob'
--   on conflict do nothing;
-- =============================================================
