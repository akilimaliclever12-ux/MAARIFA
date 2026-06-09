# 07 — Monetization Strategy

**Principle:** Validate demand and build the corpus *first*. Revenue comes only after Maarifa is the default place for South Kivu academic work. Do not let monetization slow the MVP.

**Local reality (Bukavu/DRC):**
- Most individual users have very low disposable income; charging students directly will kill adoption.
- **Institutions and NGOs** have budgets and a real need to preserve/showcase work.
- Payments must be **mobile-money-first** (M-Pesa, Airtel Money, Orange Money); cards are rare.
- Trust and visible value must precede any paywall.

---

## Phase 1 — Validation (0 revenue)

**Goal:** Prove people publish and download; build the corpus and reputation.

- 100% free for everyone.
- Seed 100–300 real publications; onboard 2–3 universities informally.
- Track the success metrics in the PRD (uploads, downloads, MAU, WhatsApp shares).
- Establish credibility: university endorsements, clear authorship/credit, reliable preservation.

**Revenue:** $0 (intentional). **Cost:** ~$0 (free tiers).
**Exit criteria:** steady weekly uploads + downloads, ≥1 university willing to formalize a partnership.

---

## Phase 2 — Early revenue (low-friction)

**Goal:** First small, low-effort income that doesn't harm growth. Keep the core repository free.

Ranked by recommended order of implementation:

### 2.1 Donations / grants & sponsorship *(start here)*
- "Soutenez la préservation du savoir" — donation link; approach NGOs, diaspora, foundations (knowledge preservation, education, open access).
- **Pricing:** voluntary; grant amounts vary.
- **Assumption:** 1–2 small grants/sponsorships ($500–$5,000) can fund a year of paid tier + small stipend.
- **Risk:** unpredictable, time-consuming. **Effort:** low-medium.

### 2.2 Institutional archiving service (light)
- Offer to digitize/upload a university's backlog and give them a branded collection page + basic stats.
- **Pricing:** one-off setup fee per institution (e.g. $100–$500) or annual fee (e.g. $200–$800/yr).
- **Assumption:** 2–4 institutions in year 1.
- **Risk:** manual effort; needs reliable upload tooling (F22). **Effort:** medium.

### 2.3 Featured placement / verified author (micro)
- Authors/institutions pay a small fee for featured listing or a verified badge.
- **Pricing:** $2–$10 one-off via mobile money.
- **Assumption:** low volume; mostly signal/credibility, not core revenue.
- **Risk:** must not look pay-to-rank in search; keep search merit-based. **Effort:** medium (needs payments).

### 2.4 Services (consulting/printing)
- Paid help: formatting, printing/binding of mémoires, research support — leveraging the audience.
- **Pricing:** per service. **Risk:** distraction from product. **Effort:** low (manual, off-platform).

**Phase 2 revenue assumption:** modest — a few hundred to a few thousand USD/year, mostly grants + institutional fees. Enough to cover paid Supabase/Vercel tiers and partial founder time.

---

## Phase 3 — Growth revenue (institutional & premium)

**Goal:** Recurring revenue from organizations that get clear value.

### 3.1 Institutional accounts / SaaS *(primary engine)*
- Branded portals, member management, private/internal repositories, analytics, bulk upload, support. (F26)
- **Pricing (tiered annual):** e.g. Basic $300–$600/yr, Pro $800–$1,500/yr, Custom for large unis.
- **Assumption:** 10–30 institutions at scale across DRC → $5k–$40k/yr.
- **Risk:** long sales cycles; budget constraints. **Effort:** high.

### 3.2 Premium author features
- Extended analytics, larger storage, featured visibility, DOI minting add-on. (F27, F29)
- **Pricing:** subscription $1–$5/month or annual; DOI as paid add-on (cost pass-through + margin).
- **Assumption:** small % of active authors convert. **Effort:** medium-high.

### 3.3 Peer-reviewed journals / proceedings hosting
- Host institution journals & conference proceedings with editorial workflow. (F28)
- **Pricing:** per-journal hosting fee. **Effort:** high.

### 3.4 Data & API partnerships
- Read API / dataset access for research partners (ethically, with consent). (F31)
- **Pricing:** partnership-based. **Effort:** medium. **Risk:** governance/consent.

### 3.5 Targeted, relevant sponsorship/ads (careful)
- Education/research-relevant sponsors only; never compromise UX or credibility.
- **Effort:** low-medium. **Risk:** brand dilution — use sparingly.

**Phase 3 revenue assumption:** institutional SaaS is the backbone; premium + journals supplement.

---

## Recommended order of implementation

1. **Phase 1:** free, seed corpus, partnerships (now).
2. **2.1 Donations/grants** → fund operations early (low effort).
3. **2.2 Institutional archiving service** (manual, builds relationships → future SaaS customers).
4. **Mobile-money payments** (F33) once there's something worth charging for.
5. **2.3 Featured/verified** micro-payments.
6. **3.1 Institutional SaaS** (the real business).
7. **3.2 Premium / 3.3 Journals / 3.4 API** as the platform matures.

## Cross-cutting risks

- **Charging too early** kills adoption — keep the core free.
- **Pay-to-rank** erodes trust — keep search merit-based.
- **Payment friction** in DRC — prioritize mobile money.
- **Copyright/consent** for institutional uploads — get clear permission; honor takedowns.
- **Founder bandwidth** — favor low-maintenance revenue (grants, annual institutional fees) over high-touch.
