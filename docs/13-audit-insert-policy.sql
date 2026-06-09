-- =============================================================
-- Maarifa — Optional: let staff write audit logs from their own session.
-- Run once in the Supabase SQL Editor. Moderation works WITHOUT this; it only
-- restores audit-log writes now that moderation no longer uses the
-- service-role key. Safe to run anytime.
-- =============================================================

create policy audit_staff_insert on public.audit_logs for insert
  with check (public.is_staff());

-- =============================================================
-- END
-- =============================================================
