-- =============================================================
-- Maarifa — Database Schema (PostgreSQL / Supabase)
-- MVP: production-ready but lean. French-first academic repository.
-- Run in Supabase SQL Editor. Idempotent-ish (uses IF NOT EXISTS where safe).
-- =============================================================
-- Sections:
--   0. Extensions
--   1. Helper functions (roles, slugs, timestamps)
--   2. Reference tables (universities, faculties, departments, categories)
--   3. profiles (users + authors + admins, role-based)
--   4. publications + files + keywords + authors
--   5. engagement (downloads, views, saved, reports)
--   6. audit_logs
--   7. Indexes (search + foreign keys)
--   8. Full-text search (tsvector + trigger)
--   9. Counter RPCs (download/view) - safe for anonymous
--  10. Row Level Security (RLS) policies
--  11. Storage buckets strategy (run via dashboard or SQL)
--  12. Seed reference data (sample)
--  13. DEFERRED (v1.1+) tables - DO NOT run at MVP
-- =============================================================

-- 0. EXTENSIONS ------------------------------------------------
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "unaccent";    -- accent-insensitive search (FR)

-- Allow helper functions (section 1) to reference tables created later in this
-- same script. Postgres validates `language sql` function bodies at creation
-- time; turning this off defers that so script order doesn't matter.
set check_function_bodies = off;

-- 1. HELPER FUNCTIONS -----------------------------------------
-- NOTE: role-helper functions that query public.profiles are defined in
-- section 3, AFTER the profiles table exists (avoids "relation does not exist").

-- Auto-update updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end; $$;

-- 2. REFERENCE TABLES -----------------------------------------

create table if not exists public.universities (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  acronym     text,
  city        text not null default 'Bukavu',
  created_at  timestamptz not null default now()
);

create table if not exists public.faculties (
  id             uuid primary key default gen_random_uuid(),
  university_id  uuid not null references public.universities(id) on delete cascade,
  name           text not null,
  created_at     timestamptz not null default now(),
  unique (university_id, name)
);

create table if not exists public.departments (
  id          uuid primary key default gen_random_uuid(),
  faculty_id  uuid not null references public.faculties(id) on delete cascade,
  name        text not null,
  created_at  timestamptz not null default now(),
  unique (faculty_id, name)
);

create table if not exists public.categories (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  description text,
  created_at  timestamptz not null default now()
);

-- 3. PROFILES (users + authors + admins) ----------------------

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text not null,
  slug          text not null unique,
  email         text,
  role          text not null default 'reader'
                check (role in ('reader','author','moderator','admin')),
  bio           text,
  avatar_url    text,
  university_id uuid references public.universities(id) on delete set null,
  faculty_id    uuid references public.faculties(id)    on delete set null,
  department_id uuid references public.departments(id)  on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create trigger trg_profiles_updated
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row when an auth user signs up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  base_slug text;
  final_slug text;
  n int := 0;
begin
  base_slug := regexp_replace(lower(coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1))),
                              '[^a-z0-9]+','-','g');
  base_slug := trim(both '-' from base_slug);
  if base_slug = '' then base_slug := 'user'; end if;
  final_slug := base_slug;
  while exists (select 1 from public.profiles where slug = final_slug) loop
    n := n + 1;
    final_slug := base_slug || '-' || n;
  end loop;

  insert into public.profiles (id, full_name, slug, email)
  values (new.id,
          coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email,'@',1)),
          final_slug,
          new.email);
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Role-helper functions (defined here, now that public.profiles exists).
-- security definer -> bypasses RLS, avoiding recursion in profiles policies.
create or replace function public.current_user_role()
returns text language sql security definer set search_path = public stable as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create or replace function public.is_staff()  -- moderator or admin
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce(public.current_user_role() in ('moderator','admin'), false);
$$;

-- 4. PUBLICATIONS ---------------------------------------------

create table if not exists public.publications (
  id               uuid primary key default gen_random_uuid(),
  owner_id         uuid not null references public.profiles(id) on delete cascade,
  title            text not null,
  slug             text not null unique,
  abstract         text,
  type             text not null
                   check (type in ('memoire','these','article','rapport','etude_cas','projet_innovation','publication','autre')),
  university_id    uuid references public.universities(id) on delete set null,
  faculty_id       uuid references public.faculties(id)    on delete set null,
  department_id    uuid references public.departments(id)  on delete set null,
  category_id      uuid references public.categories(id)   on delete set null,
  year             int  check (year between 1950 and 2100),
  language         text not null default 'fr' check (language in ('fr','en','sw','other')),
  status           text not null default 'draft'
                   check (status in ('draft','pending','published','rejected')),
  rejection_reason text,
  view_count       int  not null default 0,
  download_count   int  not null default 0,
  search_vector    tsvector,
  published_at     timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

create trigger trg_publications_updated
  before update on public.publications
  for each row execute function public.set_updated_at();

create table if not exists public.publication_files (
  id              uuid primary key default gen_random_uuid(),
  publication_id  uuid not null references public.publications(id) on delete cascade,
  storage_path    text not null,
  file_name       text not null,
  file_size       bigint not null,
  mime_type       text not null default 'application/pdf',
  is_primary      boolean not null default true,
  created_at      timestamptz not null default now()
);

create table if not exists public.keywords (
  id          uuid primary key default gen_random_uuid(),
  name        text not null unique,
  slug        text not null unique,
  created_at  timestamptz not null default now()
);

create table if not exists public.publication_keywords (
  publication_id uuid not null references public.publications(id) on delete cascade,
  keyword_id     uuid not null references public.keywords(id)     on delete cascade,
  primary key (publication_id, keyword_id)
);

create table if not exists public.publication_authors (
  id              uuid primary key default gen_random_uuid(),
  publication_id  uuid not null references public.publications(id) on delete cascade,
  profile_id      uuid references public.profiles(id) on delete set null,
  author_name     text not null,
  position        int  not null default 1,
  created_at      timestamptz not null default now()
);

-- 5. ENGAGEMENT -----------------------------------------------

create table if not exists public.downloads (
  id              uuid primary key default gen_random_uuid(),
  publication_id  uuid not null references public.publications(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete set null,
  ip_hash         text,
  created_at      timestamptz not null default now()
);

create table if not exists public.views (
  id              uuid primary key default gen_random_uuid(),
  publication_id  uuid not null references public.publications(id) on delete cascade,
  user_id         uuid references public.profiles(id) on delete set null,
  ip_hash         text,
  created_at      timestamptz not null default now()
);

create table if not exists public.saved_publications (
  user_id         uuid not null references public.profiles(id) on delete cascade,
  publication_id  uuid not null references public.publications(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (user_id, publication_id)
);

create table if not exists public.reports (
  id              uuid primary key default gen_random_uuid(),
  publication_id  uuid not null references public.publications(id) on delete cascade,
  reporter_id     uuid references public.profiles(id) on delete set null,
  reason          text not null
                  check (reason in ('plagiat','contenu_inapproprie','droit_auteur','spam','autre')),
  details         text,
  status          text not null default 'open'
                  check (status in ('open','reviewed','dismissed','actioned')),
  created_at      timestamptz not null default now()
);

-- 6. AUDIT LOGS -----------------------------------------------

create table if not exists public.audit_logs (
  id           uuid primary key default gen_random_uuid(),
  actor_id     uuid references public.profiles(id) on delete set null,
  action       text not null,
  entity_type  text not null,
  entity_id    uuid,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now()
);

-- 7. INDEXES --------------------------------------------------

create index if not exists idx_pub_status        on public.publications(status);
create index if not exists idx_pub_published_at   on public.publications(published_at desc);
create index if not exists idx_pub_owner          on public.publications(owner_id);
create index if not exists idx_pub_university     on public.publications(university_id);
create index if not exists idx_pub_faculty        on public.publications(faculty_id);
create index if not exists idx_pub_department     on public.publications(department_id);
create index if not exists idx_pub_category       on public.publications(category_id);
create index if not exists idx_pub_type           on public.publications(type);
create index if not exists idx_pub_year           on public.publications(year);
create index if not exists idx_pub_search         on public.publications using gin(search_vector);

create index if not exists idx_faculties_univ     on public.faculties(university_id);
create index if not exists idx_departments_fac    on public.departments(faculty_id);
create index if not exists idx_pubfiles_pub       on public.publication_files(publication_id);
create index if not exists idx_pubkw_kw           on public.publication_keywords(keyword_id);
create index if not exists idx_pubauthors_pub     on public.publication_authors(publication_id);
create index if not exists idx_pubauthors_profile on public.publication_authors(profile_id);
create index if not exists idx_downloads_pub      on public.downloads(publication_id);
create index if not exists idx_views_pub          on public.views(publication_id);
create index if not exists idx_saved_user         on public.saved_publications(user_id);
create index if not exists idx_reports_status     on public.reports(status);
create index if not exists idx_audit_entity       on public.audit_logs(entity_type, entity_id);

-- 8. FULL-TEXT SEARCH -----------------------------------------
-- French config + unaccent; weights: title (A) > keywords/abstract (B/C).

create or replace function public.publications_search_refresh()
returns trigger language plpgsql as $$
begin
  new.search_vector :=
      setweight(to_tsvector('french', unaccent(coalesce(new.title,''))), 'A')
    || setweight(to_tsvector('french', unaccent(coalesce(new.abstract,''))), 'C');
  return new;
end; $$;

create trigger trg_publications_search
  before insert or update of title, abstract on public.publications
  for each row execute function public.publications_search_refresh();

-- Helper for app-side search:
--   select * from publications
--   where status='published'
--     and search_vector @@ plainto_tsquery('french', unaccent($1))
--   order by ts_rank(search_vector, plainto_tsquery('french', unaccent($1))) desc;

-- 9. COUNTER RPCs (safe for anonymous via RLS-bypassing definer) --

create or replace function public.increment_view(p_publication_id uuid, p_ip_hash text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.publications set view_count = view_count + 1
    where id = p_publication_id and status = 'published';
  insert into public.views (publication_id, user_id, ip_hash)
    values (p_publication_id, auth.uid(), p_ip_hash);
end; $$;

create or replace function public.increment_download(p_publication_id uuid, p_ip_hash text default null)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.publications set download_count = download_count + 1
    where id = p_publication_id and status = 'published';
  insert into public.downloads (publication_id, user_id, ip_hash)
    values (p_publication_id, auth.uid(), p_ip_hash);
end; $$;

grant execute on function public.increment_view(uuid, text)     to anon, authenticated;
grant execute on function public.increment_download(uuid, text) to anon, authenticated;

-- 10. ROW LEVEL SECURITY --------------------------------------
-- Strategy:
--   * Reference + published content: world-readable.
--   * Owners manage their own drafts/files.
--   * Staff (moderator/admin) manage everything.
--   * Counters/reports handled via RPC or permissive insert.

alter table public.universities          enable row level security;
alter table public.faculties             enable row level security;
alter table public.departments           enable row level security;
alter table public.categories            enable row level security;
alter table public.profiles              enable row level security;
alter table public.publications          enable row level security;
alter table public.publication_files     enable row level security;
alter table public.keywords              enable row level security;
alter table public.publication_keywords  enable row level security;
alter table public.publication_authors   enable row level security;
alter table public.downloads             enable row level security;
alter table public.views                 enable row level security;
alter table public.saved_publications    enable row level security;
alter table public.reports               enable row level security;
alter table public.audit_logs            enable row level security;

-- Reference tables: public read, staff write
create policy ref_read_univ   on public.universities for select using (true);
create policy ref_read_fac    on public.faculties    for select using (true);
create policy ref_read_dep    on public.departments  for select using (true);
create policy ref_read_cat    on public.categories   for select using (true);
create policy ref_write_univ  on public.universities for all using (public.is_staff()) with check (public.is_staff());
create policy ref_write_fac   on public.faculties    for all using (public.is_staff()) with check (public.is_staff());
create policy ref_write_dep   on public.departments  for all using (public.is_staff()) with check (public.is_staff());
create policy ref_write_cat   on public.categories   for all using (public.is_staff()) with check (public.is_staff());

-- profiles: public read; self update; staff manage
create policy profiles_read       on public.profiles for select using (true);
create policy profiles_update_own on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_staff_all  on public.profiles for all using (public.is_staff()) with check (public.is_staff());
-- (insert handled by handle_new_user trigger; no public insert policy)

-- publications: read published OR own OR staff; owner CRUD own; staff all
create policy pub_read on public.publications for select
  using (status = 'published' or owner_id = auth.uid() or public.is_staff());
create policy pub_insert_own on public.publications for insert
  with check (owner_id = auth.uid());
create policy pub_update_own on public.publications for update
  using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy pub_delete_own on public.publications for delete
  using (owner_id = auth.uid());
create policy pub_staff_all on public.publications for all
  using (public.is_staff()) with check (public.is_staff());

-- helper predicate inlined: can the current user touch this publication?
-- (owner of parent publication OR staff)

-- publication_files
create policy files_read on public.publication_files for select using (
  exists (select 1 from public.publications p where p.id = publication_id
          and (p.status='published' or p.owner_id = auth.uid() or public.is_staff())));
create policy files_write_own on public.publication_files for all using (
  exists (select 1 from public.publications p where p.id = publication_id
          and (p.owner_id = auth.uid() or public.is_staff()))
) with check (
  exists (select 1 from public.publications p where p.id = publication_id
          and (p.owner_id = auth.uid() or public.is_staff())));

-- keywords: public read; authenticated may insert (to tag their work); staff manage
create policy kw_read   on public.keywords for select using (true);
create policy kw_insert on public.keywords for insert to authenticated with check (true);
create policy kw_staff  on public.keywords for all using (public.is_staff()) with check (public.is_staff());

-- publication_keywords / authors: gated by parent ownership
create policy pubkw_read on public.publication_keywords for select using (
  exists (select 1 from public.publications p where p.id = publication_id
          and (p.status='published' or p.owner_id = auth.uid() or public.is_staff())));
create policy pubkw_write on public.publication_keywords for all using (
  exists (select 1 from public.publications p where p.id = publication_id
          and (p.owner_id = auth.uid() or public.is_staff()))
) with check (
  exists (select 1 from public.publications p where p.id = publication_id
          and (p.owner_id = auth.uid() or public.is_staff())));

create policy pubauth_read on public.publication_authors for select using (
  exists (select 1 from public.publications p where p.id = publication_id
          and (p.status='published' or p.owner_id = auth.uid() or public.is_staff())));
create policy pubauth_write on public.publication_authors for all using (
  exists (select 1 from public.publications p where p.id = publication_id
          and (p.owner_id = auth.uid() or public.is_staff()))
) with check (
  exists (select 1 from public.publications p where p.id = publication_id
          and (p.owner_id = auth.uid() or public.is_staff())));

-- downloads / views: no direct select for public; staff read. Inserts go through RPC.
create policy dl_staff_read on public.downloads for select using (public.is_staff());
create policy vw_staff_read on public.views     for select using (public.is_staff());

-- saved_publications: user manages own
create policy saved_own on public.saved_publications for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- reports: anyone (incl. anon) may file; staff read/manage
create policy reports_insert on public.reports for insert with check (true);
create policy reports_staff  on public.reports for all using (public.is_staff()) with check (public.is_staff());

-- audit_logs: staff read only; writes via security-definer code/server
create policy audit_staff_read on public.audit_logs for select using (public.is_staff());

-- 11. STORAGE BUCKETS -----------------------------------------
-- Create in Dashboard (Storage) or via SQL below.
--   Bucket "publications" : PRIVATE. PDFs served via signed URLs (count downloads via RPC).
--   Bucket "avatars"      : PUBLIC. Small profile images.
--
-- insert into storage.buckets (id, name, public) values
--   ('publications','publications', false),
--   ('avatars','avatars', true)
-- on conflict (id) do nothing;
--
-- Storage RLS (examples):
--   avatars  : public read; authenticated users write into their own folder (name like auth.uid()||'/%').
--   publications: read via signed URL only; insert by authenticated; update/delete by owner folder or staff.
--   Keep PDF path convention: publications/<publication_id>/<filename>.pdf

-- 12. SEED REFERENCE DATA (sample — edit for real institutions) -

insert into public.categories (name, slug, description) values
  ('Santé',            'sante',            'Travaux liés à la santé et la médecine'),
  ('Sciences sociales','sciences-sociales','Sociologie, anthropologie, etc.'),
  ('Économie & gestion','economie-gestion','Économie, gestion, finance'),
  ('Droit',            'droit',            'Sciences juridiques'),
  ('Sciences & tech',  'sciences-tech',    'Sciences exactes et technologies'),
  ('Agronomie & environnement','agro-environnement','Agronomie, environnement, développement rural'),
  ('Éducation',        'education',        'Sciences de l''éducation')
on conflict (slug) do nothing;

insert into public.universities (name, acronym, city) values
  ('Université Catholique de Bukavu','UCB','Bukavu'),
  ('Université Évangélique en Afrique','UEA','Bukavu'),
  ('Institut Supérieur Pédagogique de Bukavu','ISP Bukavu','Bukavu'),
  ('Institut Supérieur de Développement Rural','ISDR','Bukavu'),
  ('Université Officielle de Bukavu','UOB','Bukavu')
on conflict (name) do nothing;

-- =============================================================
-- 13. DEFERRED TABLES (v1.1+) — DO NOT RUN AT MVP
-- Uncomment when the corresponding features are scheduled.
-- =============================================================
/*
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text,            -- 'ngo','company','government','other'
  city text,
  website text,
  verified boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  status text not null default 'visible' check (status in ('visible','hidden')),
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  publication_id uuid not null references public.publications(id) on delete cascade,
  reviewer_id uuid not null references public.profiles(id) on delete cascade,
  rating int check (rating between 1 and 5),
  body text,
  status text not null default 'pending' check (status in ('pending','published','hidden')),
  created_at timestamptz not null default now(),
  unique (publication_id, reviewer_id)
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
*/
-- =============================================================
-- END
-- =============================================================
