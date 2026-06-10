-- =============================================================
-- Maarifa — Add text alignment for the publication summary (abstract).
-- Run once in the Supabase SQL Editor. Safe to re-run.
-- =============================================================

alter table public.publications
  add column if not exists abstract_align text not null default 'left'
  check (abstract_align in ('left', 'center', 'right', 'justify'));

-- =============================================================
-- END
-- =============================================================
