-- =============================================================
-- Maarifa — University (institution) pages. Run once in Supabase SQL Editor.
-- Adds universities.slug (for /universites/<slug>) + logo_url, backfills slugs,
-- and auto-generates a slug for any future university.
-- =============================================================

alter table public.universities add column if not exists slug text;
alter table public.universities add column if not exists logo_url text;

-- Backfill slugs from acronym (preferred) or name, accent-insensitive.
update public.universities
set slug = lower(trim(both '-' from regexp_replace(
  unaccent(coalesce(nullif(acronym, ''), name)), '[^a-zA-Z0-9]+', '-', 'g')))
where slug is null or slug = '';

-- Resolve any accidental duplicates by appending a short id fragment.
update public.universities u
set slug = u.slug || '-' || left(u.id::text, 4)
where exists (
  select 1 from public.universities u2 where u2.slug = u.slug and u2.id <> u.id
);

create unique index if not exists idx_universities_slug on public.universities(slug);

-- Auto-slug new universities.
create or replace function public.universities_set_slug()
returns trigger language plpgsql as $$
begin
  if new.slug is null or new.slug = '' then
    new.slug := lower(trim(both '-' from regexp_replace(
      unaccent(coalesce(nullif(new.acronym, ''), new.name)), '[^a-zA-Z0-9]+', '-', 'g')));
  end if;
  return new;
end; $$;

drop trigger if exists trg_universities_slug on public.universities;
create trigger trg_universities_slug
  before insert on public.universities
  for each row execute function public.universities_set_slug();

-- =============================================================
-- END
-- =============================================================
