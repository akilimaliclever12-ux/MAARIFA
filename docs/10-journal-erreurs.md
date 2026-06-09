# 10 — Journal d'erreurs (Engineering Incident Log)

A lightweight, solo-founder-friendly log for incidents, bugs, and lessons. Keep it honest and current — future-you (and Claude) will thank you.

---

## How to use this log

1. When something breaks (prod or dev) or a notable bug is found, add an entry using the template below.
2. Give it an **Error ID**: `MAA-YYYYMMDD-NN` (e.g. `MAA-20260615-01`).
3. Fill what you know now; update **Root Cause / Resolution / Status** as you learn.
4. When fixed, add a **regression test** if feasible and note it under Prevention.
5. Keep the most recent entries at the top.

---

## Incident entry template

```md
### MAA-YYYYMMDD-NN — <short title>

- **Date:** YYYY-MM-DD HH:MM (TZ)
- **Error ID:** MAA-YYYYMMDD-NN
- **Environment:** prod | preview | local
- **Severity:** critical | high | medium | low
- **Reported by:** <name / how discovered>
- **Description:** What happened, observed symptoms, error messages, affected feature/route.
- **Root Cause:** The underlying technical cause (fill once known).
- **Impact:** Who/what was affected, for how long, data/users involved.
- **Resolution:** What was changed to fix it (commit/PR link).
- **Prevention:** Test added, guardrail, doc/config change to stop recurrence.
- **Status:** open | investigating | resolved | monitoring | closed
```

---

## Active incidents

> _(none yet)_

## Resolved incidents

> _(none yet)_

---

## Example (delete once you have real entries)

### MAA-20260612-01 — Anonymous users could read draft publications

- **Date:** 2026-06-12 14:30 (CAT)
- **Error ID:** MAA-20260612-01
- **Environment:** preview
- **Severity:** high
- **Reported by:** Self, during RLS audit
- **Description:** A logged-out visitor could open `/publications/<slug>` for a publication with `status='draft'` and see its abstract.
- **Root Cause:** `pub_read` policy `using` clause omitted the status check on a code path that queried by slug via a view without RLS.
- **Impact:** Unpublished drafts briefly exposed on preview; no real user data leaked (no prod users yet).
- **Resolution:** Removed the unrestricted view; query `publications` directly so RLS applies. Commit `abc1234`.
- **Prevention:** Added RLS test: assert anon `select` on a draft returns 0 rows. Documented "never query content through RLS-bypassing views" in CLAUDE.md.
- **Status:** closed

---

# Procedures

## Bug Tracking

- **Where:** This file for incidents/notable bugs; small TODOs can live in code (`// TODO:`) or a simple checklist. Optionally GitHub Issues if the repo is on GitHub.
- **Triage:** Assign severity (critical/high/medium/low). Critical = core path broken (publish/find/download/auth) → fix before anything else.
- **Lifecycle:** open → investigating → resolved → (monitoring) → closed.
- **Critical-path watch:** signup, upload, moderation approve, search, download, WhatsApp share. A break here is always at least *high*.

## Regression Tracking

- Every fixed bug that *can* be tested gets a test (unit for logic; RLS check for auth; happy-path E2E once stable).
- Note the regression test name in the incident's **Prevention** field.
- Before each deploy, manually re-run the critical path on a real low-end Android + throttled network.
- Keep a short **smoke checklist** (below) and run it after every production deploy.

### Smoke checklist (run after each deploy)
- [ ] Sign up + log in works.
- [ ] Upload a draft + submit for moderation.
- [ ] Approve as moderator → publication goes live.
- [ ] Search returns the new publication.
- [ ] Detail page loads; view count increments.
- [ ] Download works (signed URL) + count increments.
- [ ] WhatsApp share shows a rich preview.
- [ ] Anon cannot see drafts or others' private data (spot check).

## Postmortems

Write a short postmortem for any **critical** or **high** incident (or anything user-visible in prod).

- **When:** within 48h of resolution.
- **Format (blameless):**
  - Summary (1–2 lines).
  - Timeline (detection → mitigation → resolution).
  - Root cause.
  - Impact (users, data, duration).
  - What went well / what didn't.
  - Action items (owner + due date) — each should reduce recurrence or detection time.
- Link the postmortem to the incident Error ID. Convert action items into backlog tasks.

## Technical Debt Monitoring

- Maintain a running **Tech Debt** list (section below). Each item: what, why it's debt, risk if ignored, rough effort.
- Tag shortcuts in code with `// TECH-DEBT: <reason>` and add a matching list entry.
- Review the list at the end of each roadmap week; pull high-risk/low-effort items into the next week.
- Don't let debt block the MVP — but record it so it's a choice, not an accident.

### Tech Debt list
| ID | Item | Why it's debt | Risk if ignored | Effort | Status |
|----|------|---------------|-----------------|--------|--------|
| TD-001 | _(example)_ Event tables `views`/`downloads` unbounded | Could exceed free-tier DB size | Hit storage limit | M | open |

---

_Keep this file updated. An incident not written down is a lesson lost._
