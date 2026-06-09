# Maarifa

> The digital memory of South Kivu's research and intellectual production.

**Maarifa** (Swahili for *knowledge*) is a mobile-first platform that lets students, researchers, universities, and professionals in Bukavu and South Kivu, DRC publish, discover, preserve, and share academic work — mémoires, research papers, articles, case studies, reports, and innovation projects.

## Why this exists

Local academic work in South Kivu is produced every year and then lost — stored on personal laptops, printed once, never indexed, never found again. Maarifa makes this knowledge **discoverable, durable, and shareable** (especially over WhatsApp), building the largest digital repository of intellectual production from the region.

## Tech stack (lean, free-tier first)

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (Postgres + Auth + Storage)
- **Hosting:** Vercel (free tier)
- **Email:** Resend (free tier)
- **Analytics:** Plausible or Vercel Analytics (lightweight)

## Project documents

Read these before writing code. They are the single source of truth.

| # | Document | Purpose |
|---|----------|---------|
| — | [CLAUDE.md](./CLAUDE.md) | Project memory for Claude Code (read first every session) |
| 01 | [Brand Brief](./docs/01-brand-brief.md) | Identity, voice, colors, typography |
| 02 | [Product Requirements (PRD)](./docs/02-prd.md) | Problem, solution, scope, personas |
| 03 | [Data Dictionary](./docs/03-data-dictionary.md) | Every table, field, relationship |
| 04 | [Database Schema (SQL)](./docs/04-database-schema.sql) | Production-ready Supabase SQL + RLS |
| 05 | [Feature Backlog](./docs/05-feature-backlog.md) | MVP → v1.1 → v2.0 |
| 06 | [User Flows](./docs/06-user-flows.md) | Mermaid diagrams of key journeys |
| 07 | [Monetization Strategy](./docs/07-monetization.md) | 3-phase revenue plan |
| 08 | [Integrations](./docs/08-integrations.md) | Cost, complexity, MVP necessity |
| 09 | [Engineering Roadmap](./docs/09-roadmap.md) | 4-week solo-founder plan |
| 10 | [Journal d'erreurs](./docs/10-journal-erreurs.md) | Incident log + procedures |

## Bilingual

The app is **bilingual: French (default) + English**, via locale-prefixed routes (`/fr`, `/en`). UI strings live in [`messages/fr.json`](./messages/fr.json) and [`messages/en.json`](./messages/en.json); `middleware.ts` auto-detects and redirects to a locale. A language switcher is in the header.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000 → redirects to /fr
```

The repo ships a `.env.local` with **placeholders** so it boots immediately. To connect a real database, follow **[SETUP.md](./SETUP.md)** (create a Supabase project, run the schema, add your keys).

```bash
npm run build        # production build
npm run typecheck    # tsc --noEmit
npm run lint
```

## Status

🟢 **Week 1 in progress** — Next.js 15 + TypeScript + Tailwind scaffolded; bilingual i18n, Supabase auth wiring (signup/login/logout), middleware session refresh, home/browse/detail pages reading from the DB, protected dashboard. Build + typecheck pass. **Next:** connect Supabase via [SETUP.md](./SETUP.md), then Week 2 (upload + moderation).
