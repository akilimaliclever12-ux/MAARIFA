-- =============================================================
-- Maarifa — Migration: social features + more universities
-- Run once in the Supabase SQL Editor (after 04-database-schema.sql).
-- Adds: follows, likes, comments tables (+ RLS); extra universities.
-- =============================================================

-- 1. MORE UNIVERSITIES (South Kivu / Grands Lacs) -------------
insert into public.universities (name, acronym, city) values
  ('Institut Supérieur des Techniques Médicales de Bukavu', 'ISTM', 'Bukavu'),
  ('Université Libre des Grands Lacs', 'ULGL', 'Goma'),
  ('Université Libre des Pays des Grands Lacs', 'ULPGL', 'Goma'),
  ('UNIC / ISGA', 'UNIC/ISGA', 'Bukavu'),
  ('Université de la Nouvelle Pâques', 'UNP', 'Bukavu')
on conflict (name) do nothing;

-- 2. FOLLOWS --------------------------------------------------
create table if not exists public.follows (
  follower_id   uuid not null references public.profiles(id) on delete cascade,
  following_id  uuid not null references public.profiles(id) on delete cascade,
  created_at    timestamptz not null default now(),
  primary key (follower_id, following_id),
  check (follower_id <> following_id)
);
create index if not exists idx_follows_following on public.follows(following_id);

alter table public.follows enable row level security;
create policy follows_read   on public.follows for select using (true);
create policy follows_insert on public.follows for insert to authenticated
  with check (follower_id = auth.uid());
create policy follows_delete on public.follows for delete to authenticated
  using (follower_id = auth.uid());

-- 3. LIKES ----------------------------------------------------
create table if not exists public.likes (
  user_id         uuid not null references public.profiles(id) on delete cascade,
  publication_id  uuid not null references public.publications(id) on delete cascade,
  created_at      timestamptz not null default now(),
  primary key (user_id, publication_id)
);
create index if not exists idx_likes_publication on public.likes(publication_id);

alter table public.likes enable row level security;
create policy likes_read   on public.likes for select using (true);
create policy likes_insert on public.likes for insert to authenticated
  with check (user_id = auth.uid());
create policy likes_delete on public.likes for delete to authenticated
  using (user_id = auth.uid());

-- 4. COMMENTS -------------------------------------------------
create table if not exists public.comments (
  id              uuid primary key default gen_random_uuid(),
  publication_id  uuid not null references public.publications(id) on delete cascade,
  author_id       uuid not null references public.profiles(id) on delete cascade,
  body            text not null check (char_length(body) between 1 and 2000),
  status          text not null default 'visible' check (status in ('visible','hidden')),
  created_at      timestamptz not null default now()
);
create index if not exists idx_comments_publication on public.comments(publication_id, created_at);

alter table public.comments enable row level security;

-- Read visible comments on published works; authors see their own; staff see all.
create policy comments_read on public.comments for select using (
  (status = 'visible'
    and exists (select 1 from public.publications p
                where p.id = publication_id and p.status = 'published'))
  or author_id = auth.uid()
  or public.is_staff()
);

-- Comment only on published works, as yourself.
create policy comments_insert on public.comments for insert to authenticated
  with check (
    author_id = auth.uid()
    and exists (select 1 from public.publications p
                where p.id = publication_id and p.status = 'published')
  );

-- Delete your own comment (or staff).
create policy comments_delete on public.comments for delete to authenticated
  using (author_id = auth.uid() or public.is_staff());

-- Staff can hide/unhide comments.
create policy comments_staff_update on public.comments for update
  using (public.is_staff()) with check (public.is_staff());

-- =============================================================
-- END
-- =============================================================
