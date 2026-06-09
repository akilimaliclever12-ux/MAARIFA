# 08 — Integrations Document

**Rule:** minimize third-party dependencies; stay on free tiers; avoid vendor lock-in. Each integration must earn its place.

Legend — **MVP necessity:** ✅ Yes (build now) · ⏳ Later · ❌ No (avoid for MVP).

---

## Recommended cheapest viable stack (MVP)

> **Supabase** (DB + Auth + Storage) + **Vercel** (hosting) + **Resend** (email) + **Plausible/Vercel Analytics** + **WhatsApp share links** + **Google Search Console**. Everything else is later.

---

## 1. Supabase — ✅ Yes
- **Purpose:** Postgres database, Auth (email/password), file Storage (PDFs, avatars), RLS, RPC.
- **Cost:** Free tier (e.g. 500 MB DB, 1 GB storage, social/email auth, limited bandwidth). Pro ~$25/mo when you outgrow it.
- **Complexity:** Low–Medium (core of the app).
- **Required keys:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only).
- **Risks:** Free-tier limits (DB size, storage, egress); some lock-in (mitigated: it's standard Postgres → exportable). Project pausing on inactivity (free tier).
- **MVP necessity:** ✅ Core backend.

## 2. Vercel — ✅ Yes
- **Purpose:** Host the Next.js app; CI/CD from Git; preview deploys; CDN.
- **Cost:** Free Hobby tier (sufficient for MVP, non-commercial-ish usage). Pro $20/mo later.
- **Complexity:** Low.
- **Required keys:** none (Git connection); set env vars in dashboard.
- **Risks:** Hobby tier usage limits/fair-use; serverless cold starts. Alternative: Netlify, Cloudflare Pages.
- **MVP necessity:** ✅ (or any Next.js host).

## 3. Resend — ✅ Yes
- **Purpose:** Transactional email (account confirmation, submission received, approved/rejected).
- **Cost:** Free tier (~3,000 emails/mo, 100/day). Plenty for MVP.
- **Complexity:** Low.
- **Required keys:** `RESEND_API_KEY`; verified sending domain (DNS records) recommended.
- **Risks:** Deliverability if domain not verified; daily cap on free tier.
- **MVP necessity:** ✅ (could defer if using Supabase's built-in auth emails only — but Resend is cheap and flexible).
- **Note:** Supabase Auth can send confirmation emails itself at first; add Resend for custom/app emails.

## 4. WhatsApp (share links) — ✅ Yes
- **Purpose:** One-tap sharing via `https://wa.me/?text=...`; primary distribution channel.
- **Cost:** Free (just URL links + Open Graph tags). No API needed.
- **Complexity:** Very low.
- **Required keys:** none.
- **Risks:** none for share links. (The paid **WhatsApp Business API** for sending messages is ❌ for MVP.)
- **MVP necessity:** ✅ (link sharing). Business API ❌.

## 5. Plausible / Vercel Analytics — ✅ Yes (lightweight)
- **Purpose:** Privacy-friendly traffic analytics; understand usage.
- **Cost:** Vercel Web Analytics free tier; Plausible paid (~$9/mo) or self-host; or Cloudflare Web Analytics (free).
- **Complexity:** Low.
- **Required keys:** Plausible domain / Vercel built-in.
- **Risks:** minimal. Avoid heavy Google Analytics for bandwidth/perf reasons.
- **MVP necessity:** ✅ Use the free option (Vercel or Cloudflare Web Analytics).

## 6. Google Search Console — ✅ Yes
- **Purpose:** SEO monitoring, indexing, sitemap submission.
- **Cost:** Free.
- **Complexity:** Low (verify domain, submit sitemap).
- **Required keys:** verification token (DNS/meta).
- **Risks:** none.
- **MVP necessity:** ✅ (essential for discovery).

## 7. Cloudinary — ⏳ Later
- **Purpose:** Image optimization/transforms (avatars, thumbnails).
- **Cost:** Free tier generous.
- **Complexity:** Low–Medium.
- **Why later:** Supabase Storage + `next/image` cover MVP image needs. Add only if image processing becomes a real need.
- **MVP necessity:** ❌ (use Supabase Storage + next/image).

## 8. OpenAI / Anthropic (AI) — ⏳ Later
- **Purpose:** Semantic search, auto-summaries/keywords, recommendations (v2.0, F30).
- **Cost:** Pay-per-use (variable; can grow). Embeddings are cheap-ish; generation costs add up.
- **Complexity:** Medium–High.
- **Required keys:** `OPENAI_API_KEY` / `ANTHROPIC_API_KEY`.
- **Risks:** Ongoing cost, latency, over-engineering. **Do not build for MVP** (founder constraint: design for AI later, don't over-engineer).
- **MVP necessity:** ❌. Keep schema/search ready, integrate post-validation.

## 9. ORCID — ⏳ Later
- **Purpose:** Verified researcher identity linking.
- **Cost:** Free (public API).
- **Complexity:** Medium (OAuth).
- **Risks:** Low adoption among local students initially; adds onboarding friction.
- **MVP necessity:** ❌ (v2.0, F29).

## 10. Crossref / DataCite (DOI) — ⏳ Later
- **Purpose:** Mint citable DOIs for works.
- **Cost:** DataCite/Crossref membership has annual fees + per-DOI; not free.
- **Complexity:** Medium–High.
- **Risks:** Cost + governance; only worth it once credibility/volume justify it.
- **MVP necessity:** ❌ (v2.0, F29; possibly a revenue add-on).

## 11. Payments — Mobile money (M-Pesa/Airtel/Orange) — ⏳ Later
- **Purpose:** Accept payments in DRC (Phase 2/3 monetization).
- **Cost:** Transaction fees; aggregator setup (e.g. Flutterwave/local providers) may have requirements.
- **Complexity:** High (local provider integration, compliance).
- **Required keys:** provider API keys.
- **Risks:** Integration complexity, KYC/business registration, reliability.
- **MVP necessity:** ❌ (no revenue in Phase 1).

## 12. Sentry (error monitoring) — ⏳ Optional/Later
- **Purpose:** Track runtime errors in production.
- **Cost:** Free tier available.
- **Complexity:** Low.
- **Risks:** minor bundle/perf overhead.
- **MVP necessity:** ⏳ Nice-to-have; can add lightweight logging first. Pairs with `docs/10-journal-erreurs.md`.

---

## Summary table

| Integration | Purpose | Cost (MVP) | Complexity | MVP? |
|-------------|---------|-----------|-----------|------|
| Supabase | DB/Auth/Storage | Free | Med | ✅ |
| Vercel | Hosting/CI | Free | Low | ✅ |
| Resend | Email | Free | Low | ✅ |
| WhatsApp share links | Distribution | Free | V.Low | ✅ |
| Web Analytics (Vercel/Cloudflare/Plausible) | Usage | Free | Low | ✅ |
| Google Search Console | SEO | Free | Low | ✅ |
| Cloudinary | Images | Free | Low | ❌ later |
| OpenAI/Anthropic | AI search | Pay/use | High | ❌ later |
| ORCID | Researcher ID | Free | Med | ❌ later |
| Crossref/DataCite | DOI | Paid | High | ❌ later |
| Mobile money | Payments | Fees | High | ❌ later |
| Sentry | Error monitoring | Free | Low | ⏳ optional |
