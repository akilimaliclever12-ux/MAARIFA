# CLAUDE.md — Maarifa

> Read this first every session. It is the contract for how we build Maarifa.

## Project Overview

**Maarifa** (Swahili: *knowledge*) is a mobile-first, low-bandwidth digital repository for academic and intellectual work from **Bukavu and South Kivu, DRC**. Students, researchers, universities, and professionals publish, discover, preserve, and share mémoires, theses, research papers, articles, case studies, reports, and innovation projects.

**North star:** A student can publish a mémoire in **< 5 min**; another person can find + download it in **< 1 min**, on a cheap Android phone over a weak connection.

**Stage:** Pre-MVP → MVP. Solo founder, ~$0 budget. Bias to ship.

Full context: `docs/02-prd.md`. Brand: `docs/01-brand-brief.md`.

## Business Model

Free at launch (validate demand). Later: institutional accounts, premium author/visibility features, services. See `docs/07-monetization.md`. **Do not build monetization in the MVP.**

## User Personas (short)

- **Esther** — finalist student: publishes her mémoire, reads similar work. Low data.
- **Dr. Mukala** — researcher/lecturer: archives & spreads his work, guides students.
- **Patrick** — reader: arrives via WhatsApp link, wants a fast download on little data.
- **Mme Furaha** — university librarian: wants her institution's work preserved & credited.
- **Admin/Moderator** — the founder: approves submissions, handles reports.

## Tech Stack

- **Framework:** Next.js (App Router) + TypeScript (strict).
- **Styling:** Tailwind CSS. Mobile-first utility classes.
- **Backend:** Supabase — Postgres, Auth (email/password), Storage. RLS everywhere.
- **DB access:** `@supabase/supabase-js` + `@supabase/ssr` for server components/route handlers.
- **Hosting:** Vercel (free tier).
- **Email:** Resend (transactional only).
- **Analytics:** Plausible or Vercel Analytics (lightweight, privacy-friendly).
- **Edge Functions:** only if strictly necessary (prefer route handlers / RPC).

**Default to the simplest option.** Add a dependency only when it removes real, repeated work.

## Coding Standards

- TypeScript strict; no `any` unless justified with a comment.
- Server Components by default; Client Components (`"use client"`) only when interactivity is required.
- Fetch data on the server; never expose the service-role key to the client.
- Two Supabase clients: **browser** (anon key, RLS) and **server** (anon key + user session). Use the **service-role key only in trusted server code** (e.g. moderation/admin actions), never in the browser bundle.
- Validate all user input (zod) at the boundary (route handlers / server actions).
- Keep components small and focused. Co-locate by feature.
- Handle loading and error states for every async UI.
- Comments explain *why*, not *what*. Match surrounding style.
- French is the UI language; code, identifiers, and comments are in English.

## Naming Conventions

- **DB:** `snake_case`, plural tables, `id` UUID PK, `created_at`/`updated_at`.
- **Files/dirs:** `kebab-case` (`publication-card.tsx`).
- **React components:** `PascalCase`. **Hooks:** `useCamelCase`.
- **Variables/functions:** `camelCase`. **Constants:** `UPPER_SNAKE_CASE`.
- **Types/interfaces:** `PascalCase`. Suffix DB row types `Row` (e.g. `PublicationRow`).
- **Routes:** lowercase, French-friendly slugs (`/publications`, `/auteurs/[slug]`).

## Folder Structure

```
maarifa/
  app/                      # Next.js App Router
    (public)/               # browse, search, publication & author pages
    (auth)/                 # login, signup
    (dashboard)/            # author area: my publications, upload
    (admin)/                # moderation queue, reports
    api/                    # route handlers (download, share, etc.)
    layout.tsx, page.tsx
  components/               # reusable UI (kebab-case files)
    ui/                     # primitives (button, input, card)
  lib/
    supabase/               # browser.ts, server.ts, admin.ts
    validation/             # zod schemas
    utils/                  # slug, format, ip-hash
  types/                    # shared TS types (db types)
  messages/                 # i18n: fr.json, en.json
  docs/                     # the 11 foundation docs (source of truth)
  public/                   # static assets
  middleware.ts             # auth/session refresh
  .env.example
```

## UI Principles

- **Mobile-first.** Design for ~360 px width first; scale up.
- **Thumb-friendly:** tap targets ≥ 44 px; primary actions reachable one-handed.
- **Fast & calm:** minimal layout shift; skeletons over spinners; clear empty states.
- **Few colors, high contrast** (see brand palette). Lake Deep Blue primary, Sunrise Gold accent.
- **French-first** copy; warm, respectful, plain language.
- **No PDF auto-render.** Show metadata + a Download button; never auto-load heavy files.
- **WhatsApp-first sharing:** every publication has a clean URL + Open Graph tags.

## Internationalization (i18n) — bilingual FR/EN

- The app is **bilingual: French (default) + English**. Config in `i18n/config.ts` (`locales`, `defaultLocale='fr'`).
- **Routing:** locale-prefixed routes under `app/[locale]/...`. `middleware.ts` detects locale (cookie → `Accept-Language` → default) and redirects unprefixed paths.
- **Strings:** never hardcode user-facing text. Add keys to **both** `messages/fr.json` and `messages/en.json` (keep them in sync). Server components load strings via `getDictionary(locale)`; pass the `dict` down as props.
- **Links** must include the locale: `` `/${locale}/publications` ``. Use the `LanguageSwitcher` component for toggling.
- Set `<html lang={locale}>` (done in the localized layout).
- Note: localized routes are `force-dynamic` (header reflects per-user auth). Revisit caching when splitting public vs auth UI.

## Accessibility Rules

- WCAG AA contrast minimum (palette is AAA on primary).
- All images have `alt`; icons that convey meaning have labels.
- Full keyboard navigation; visible focus states.
- Semantic HTML (`<main>`, `<nav>`, `<article>`, headings in order).
- Forms: labels tied to inputs, inline error messages, no color-only signaling.
- Respect `prefers-reduced-motion`.

## Performance Requirements

- **Budget:** initial route JS small; list pages < ~200 KB (excluding PDFs). First load < 3 s on 3G.
- Server-render lists; paginate (e.g. 12–20/page); never load all rows.
- Lazy-load images (`next/image`), below-the-fold content, and route segments.
- Cache reference data (universities/categories) and published lists where possible.
- Compress/limit uploads: max PDF size (e.g. 25 MB) enforced client + server.
- Avoid heavy client libraries; prefer native + small utilities.
- Minimize round-trips: select only needed columns.

## Security Rules

- **RLS on every table** (see `docs/04-database-schema.sql`). Never disable it.
- Service-role key: server-only, never shipped to the client. Keys in env vars only.
- Validate & sanitize all inputs (zod). Enforce file type (PDF) and size on the server.
- Authorization via `profiles.role` and RLS helpers (`is_staff()`, `is_admin()`).
- Private `publications` bucket → serve PDFs through **signed URLs**; count via `increment_download` RPC.
- Hash IPs before storing (privacy). No PII beyond what's needed.
- Log sensitive admin/moderation actions to `audit_logs`.
- Author attestation on upload (own work / has rights). Provide takedown + report flow.

## Database Rules

- Schema source of truth: `docs/04-database-schema.sql` + dictionary `docs/03-data-dictionary.md`.
- Changes go through **numbered migrations** (`supabase/migrations/NNNN_*.sql`); never edit prod by hand without recording it.
- Keep it lean: no new table without a clear MVP need. Prefer adding columns to splitting tables.
- Denormalized counters (`view_count`, `download_count`) updated via RPC; event tables are best-effort.
- Always set FK `on delete` behavior intentionally (cascade for children, set null for optional refs).
- Full-text search uses `search_vector` (French + unaccent). Don't bypass it with `ILIKE` scans on large tables.

## Deployment Rules

- Host on Vercel; connect to Supabase project (prod). Keep a separate Supabase project or branch for dev if feasible.
- Env vars set in Vercel + `.env.local` (never commit secrets). Maintain `.env.example`.
- Required env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server), `RESEND_API_KEY`, `NEXT_PUBLIC_SITE_URL`.
- Enable Supabase automated backups. Periodically export critical tables.
- Deploy from `main`; preview deploys for branches. Verify build + basic flow before promoting.
- Monitor free-tier usage (DB size, storage, egress, bandwidth) — alert before limits.

## Documentation Rules

- The 11 `docs/` files are the source of truth; update them when decisions change.
- Update this CLAUDE.md when stack, conventions, or structure change.
- Log incidents in `docs/10-journal-erreurs.md`.
- Keep `README.md` runnable (setup steps current).
- Comment non-obvious logic; document RPCs and RLS intent inline in SQL.

## Testing Rules

- MVP testing is **pragmatic, not exhaustive.** Prioritize:
  - **Critical-path manual checks:** signup → upload → moderate → browse → download → WhatsApp share.
  - **Unit tests** for pure logic (slugs, validation schemas, formatters).
  - **RLS verification:** confirm anon cannot read drafts; non-owners cannot edit; staff can moderate.
- Add a regression test when a bug is fixed (note it in the journal).
- Test on a real low-end Android + throttled network before each release.
- Don't build heavy E2E infra at MVP; add Playwright happy-path tests once flows stabilize.

## Working Agreements (for Claude)

- When in doubt, choose the **simpler architecture that ships faster** (founder's explicit rule).
- Don't add enterprise infrastructure, queues, microservices, or paid services without asking.
- Stay within free tiers unless there is no practical alternative — then flag the cost first.
- Always consider mobile + low bandwidth in every feature.
- Reference the relevant `docs/` file when implementing a feature.
