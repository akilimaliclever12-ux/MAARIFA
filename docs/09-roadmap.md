# 09 — Engineering Roadmap

**Assumptions:** one solo founder + Claude Code, ~$0 budget, free tiers. ~4 weeks to a launchable MVP. Sequence favors a working vertical slice early, then breadth. Adjust pace to real availability.

**Definition of Done (MVP):** A real student can sign up, upload a mémoire, get it approved, and another person can search, find, download, and WhatsApp-share it — on a low-end Android over a weak connection.

---

## Week 1 — Foundation & vertical slice

**Goals**
- Project scaffolded; Supabase up; auth + DB working; one publication visible end-to-end (even rough).

**Deliverables**
- Next.js (App Router, TS, Tailwind) project; folder structure per CLAUDE.md.
- Supabase project created; run `docs/04-database-schema.sql` (tables, RLS, RPCs, seed).
- Storage buckets: `publications` (private), `avatars` (public) + policies.
- Supabase clients: `lib/supabase/{browser,server,admin}.ts`; `middleware.ts` for sessions.
- Auth: signup, login, logout; `profiles` auto-created; protected routes.
- `.env.example`; deploy skeleton to Vercel; connect domain (or vercel subdomain).
- A hardcoded/manual publication rendering on a detail page (proves DB + Storage read).

**Risks**
- Supabase/Next SSR auth wiring (cookies) is fiddly → follow `@supabase/ssr` docs closely.
- RLS misconfig blocks reads → test policies early with anon vs authed.

**Success criteria**
- Can sign up, log in, see a profile; one publication row renders from the DB; app deploys on Vercel.

---

## Week 2 — Publishing & moderation (core loop)

**Goals**
- Authors can upload; moderators can approve/reject; approved work goes live.

**Deliverables**
- Upload form (F3): PDF + metadata + keywords + co-authors; client+server validation (zod); size/type limits; attestation checkbox.
- Storage upload to private bucket; `publications` + `publication_files` + joins written.
- Draft vs submit (status `draft`/`pending`); "Mes publications" list.
- Moderation queue (F4): list pending, approve (→ published) / reject (+reason); `audit_logs`.
- Author profile edit (F2) + public author page.
- Transactional emails (F13) for submitted/approved/rejected (Resend) — or Supabase emails first.

**Risks**
- File upload + RLS on Storage → verify owner-only writes, signed reads.
- Multi-step form complexity → keep it one clear screen; save draft to avoid data loss.

**Success criteria**
- End-to-end: upload → pending → approve → publicly visible. Reject path works with reason + email.

---

## Week 3 — Discovery & sharing

**Goals**
- Readers can find and consume work fast; sharing works on WhatsApp.

**Deliverables**
- Home + listing (F5): recent + popular, pagination, publication cards.
- Search (F6): full-text (French + unaccent) + filters (type/university/faculty/category/year).
- Publication detail (F7): metadata, abstract, authors, keywords; view counter (`increment_view`).
- Download (F8): signed URL + `increment_download`; published-only guard.
- WhatsApp share (F9) + Open Graph tags (title, abstract, image).
- Save/favorites (F10); report (F11).
- SEO (F15): sitemap, robots, metadata; submit to Search Console.
- Performance pass: image lazy-load, payload budget, no PDF auto-load.

**Risks**
- Search relevance/perf on French text → confirm GIN index + ranking; test accents.
- OG previews not rendering in WhatsApp → validate with a real share + debugger.

**Success criteria**
- Search returns relevant results < 1 s; detail page < 3 s on throttled 3G; WhatsApp share shows a rich preview; download counts increment.

---

## Week 4 — Polish, seed, launch

**Goals**
- Harden, fill with real content, soft-launch to first users/universities.

**Deliverables**
- Minimal admin dashboard (F12): counts, latest submissions, open reports.
- Empty/error/loading states; French copy review; mobile QA on real low-end Android.
- Accessibility pass (contrast, labels, keyboard, tap targets).
- RLS audit: anon can't read drafts; non-owners can't edit; staff can moderate.
- **Seed 100+ real publications** (with author consent) from 2–3 universities.
- Backups enabled; free-tier usage check; basic error logging (optional Sentry).
- Landing/about page explaining mission + how to publish; outreach materials (WhatsApp-ready).
- Soft launch: share with first author cohort + partner contacts; collect feedback.

**Risks**
- Cold start (no content) → seeding is the priority, not more features.
- Last-mile bugs in critical path → freeze scope; fix the publish/find/download loop only.

**Success criteria**
- 100+ live publications; the full critical path works on a real phone; first external users have published and downloaded; feedback loop open. Log issues in `docs/10-journal-erreurs.md`.

---

## Post-launch (ongoing, not Week 1–4)
- Iterate on feedback; fix top friction in upload/search.
- Begin Phase 2 monetization groundwork (grants, institutional conversations) — see `docs/07-monetization.md`.
- Pull v1.1 items (English toggle, analytics for authors, trusted-uploader) from `docs/05-feature-backlog.md` based on demand.

## Cross-week principles
- Ship the **critical path** before any nice-to-have.
- Choose the **simpler architecture that launches faster** (founder rule).
- Test on **low-end Android + throttled network** every week.
- Keep within **free tiers**; flag any cost before adding it.
- Commit small, deploy often, verify the publish→find→download loop after each deploy.
