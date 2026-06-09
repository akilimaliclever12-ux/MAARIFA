# 05 — Feature Backlog

Priority: **P0** (must-have), **P1** (should), **P2** (nice).
Complexity: **S / M / L** (relative effort for a solo founder with Claude Code).

---

## MVP — Must-have for launch

### F1. Email authentication
- **Description:** Sign up / log in with email + password (Supabase Auth).
- **User story:** *As a student, I want to create an account so I can publish and save work.*
- **Priority:** P0 · **Complexity:** S · **Dependencies:** Supabase Auth, `profiles` trigger.

### F2. Author profile
- **Description:** View/edit profile (name, bio, university, faculty, department, optional avatar). Public profile page lists the author's published work.
- **User story:** *As an author, I want a profile so my work is credited to me.*
- **Priority:** P0 · **Complexity:** M · **Dependencies:** F1, `profiles`, `universities/faculties/departments`.

### F3. Upload publication (draft → submit)
- **Description:** Form: PDF upload + title, abstract, type, university/faculty/department, year, language, category, keywords, co-authors. Save draft; submit for moderation. Author attestation checkbox.
- **User story:** *As a student, I want to upload my mémoire with its details in a few minutes.*
- **Priority:** P0 · **Complexity:** L · **Dependencies:** F1, Storage, `publications`, `publication_files`, `keywords`, `publication_authors`.

### F4. Moderation queue
- **Description:** Staff view of `pending` submissions; approve (→ published, set `published_at`) or reject (with reason). Writes to `audit_logs`.
- **User story:** *As a moderator, I want to review submissions to keep quality and prevent abuse.*
- **Priority:** P0 · **Complexity:** M · **Dependencies:** F3, roles/RLS, `audit_logs`.

### F5. Browse publications
- **Description:** Home + listing pages: recent, popular (by views/downloads). Pagination. Publication cards (title, author, university, type, year).
- **User story:** *As a reader, I want to browse recent and popular work.*
- **Priority:** P0 · **Complexity:** M · **Dependencies:** F3 content.

### F6. Search + filters
- **Description:** Full-text search (title/abstract, French + unaccent). Filters: type, university, faculty, category, year, language.
- **User story:** *As a reader, I want to find a specific work quickly.*
- **Priority:** P0 · **Complexity:** M · **Dependencies:** `search_vector`, indexes.

### F7. Publication detail page
- **Description:** Metadata, abstract, author(s), keywords, view count; Download button; Share (WhatsApp) button. SEO + Open Graph tags. Increments view count.
- **User story:** *As a reader, I want to see what a work is about before downloading.*
- **Priority:** P0 · **Complexity:** M · **Dependencies:** F3, `increment_view`.

### F8. Download (signed URL + counter)
- **Description:** Generate signed URL for the private PDF; call `increment_download`. Enforce only `published` files.
- **User story:** *As a reader, I want to download the PDF.*
- **Priority:** P0 · **Complexity:** S · **Dependencies:** Storage, `increment_download`.

### F9. WhatsApp share
- **Description:** Share button → `https://wa.me/?text=<title + clean URL>`. Open Graph preview (title, abstract, image).
- **User story:** *As a reader, I want to share a work on WhatsApp in one tap.*
- **Priority:** P0 · **Complexity:** S · **Dependencies:** F7, OG metadata.

### F10. Save / favorites
- **Description:** Logged-in users save publications; "Saved" list.
- **User story:** *As a reader, I want to bookmark works to read later.*
- **Priority:** P1 · **Complexity:** S · **Dependencies:** F1, `saved_publications`.

### F11. Report a publication
- **Description:** Report button (plagiarism, copyright, inappropriate, spam). Goes to staff queue.
- **User story:** *As a user, I want to flag problematic content.*
- **Priority:** P1 · **Complexity:** S · **Dependencies:** `reports`.

### F12. Minimal admin dashboard
- **Description:** Counts (publications, users, downloads), latest submissions, open reports.
- **User story:** *As the founder, I want a quick health view.*
- **Priority:** P1 · **Complexity:** S · **Dependencies:** F4, F11.

### F13. Transactional emails
- **Description:** Account confirmation; submission received; approved/rejected notice (Resend).
- **User story:** *As an author, I want to know when my work is published.*
- **Priority:** P1 · **Complexity:** S · **Dependencies:** Resend, F4.

### F14. French UI + i18n scaffold
- **Description:** All copy in French; structure (`messages/fr.json`, `en.json`) ready for English.
- **User story:** *As a local user, I want the platform in French.*
- **Priority:** P0 · **Complexity:** S · **Dependencies:** none.

### F15. SEO + sitemap
- **Description:** SSR/SSG pages, meta tags, sitemap.xml, robots.txt, clean slugs.
- **User story:** *As a reader, I want to find Maarifa works via Google.*
- **Priority:** P1 · **Complexity:** S · **Dependencies:** F7.

---

## Version 1.1 — After validation

### F16. English UI toggle
- **Description:** Activate English translations + language switcher.
- **Story:** *As an English speaker, I want the platform in English.* · P1 · M · Dep: F14.

### F17. In-app notifications
- **Description:** Notification center (approved, new report on your work). `notifications` table.
- **Story:** *As a user, I want to see updates without email.* · P2 · M · Dep: F13.

### F18. Comments
- **Description:** Threaded/flat comments on publications, with moderation. `comments` table.
- **Story:** *As a reader, I want to discuss a work.* · P2 · M · Dep: F7.

### F19. Author analytics
- **Description:** Per-author dashboard: views/downloads over time, top works.
- **Story:** *As an author, I want to see my impact.* · P1 · M · Dep: `downloads`/`views`.

### F20. Advanced search & sorting
- **Description:** Sort by relevance/date/popularity; keyword pages; "related works".
- **Story:** *As a researcher, I want better discovery.* · P1 · M · Dep: F6.

### F21. Trusted-uploader fast-track
- **Description:** Verified authors/institutions auto-publish (skip queue) with spot checks.
- **Story:** *As a trusted author, I want to publish without waiting.* · P1 · S · Dep: F4, roles.

### F22. Bulk / institutional upload
- **Description:** Librarian uploads many works (CSV + files) on behalf of authors.
- **Story:** *As a librarian, I want to archive my institution's backlog.* · P1 · L · Dep: F3.

### F23. Organizations
- **Description:** NGOs/companies as publishers. `organizations` table.
- **Story:** *As an NGO, I want to publish our reports.* · P2 · M.

### F24. PWA / offline reading
- **Description:** Installable PWA; cache saved works for offline.
- **Story:** *As a low-data user, I want to read offline.* · P1 · M.

### F25. Citation export
- **Description:** Copy citation (APA) + BibTeX.
- **Story:** *As a researcher, I want to cite a work easily.* · P2 · S.

---

## Version 2.0 — Monetization & advanced

### F26. Institutional accounts (paid)
- **Description:** Branded institution portals, member management, private/internal repositories, analytics. **Revenue.**
- **Story:** *As a university, we want a managed portal for our research.* · P0(rev) · L · Dep: F22, F19, F23.

### F27. Premium author/visibility features (paid)
- **Description:** Featured placement, verified badge, extended analytics, larger storage.
- **Story:** *As a researcher, I want more visibility for my work.* · P1(rev) · M.

### F28. Peer review / editorial workflow
- **Description:** `reviews` table; reviewer roles; review status on publications; mini-journals.
- **Story:** *As an editor, I want a review pipeline.* · P1 · L.

### F29. DOI + ORCID integration
- **Description:** Mint DOIs (e.g. via DataCite/Crossref); link ORCID for authors.
- **Story:** *As a researcher, I want citable, credible IDs.* · P1 · L · Dep: external, cost.

### F30. AI semantic search & summaries
- **Description:** Embeddings-based search; auto-abstracts/keywords; recommendations.
- **Story:** *As a reader, I want smarter discovery.* · P1 · L · Dep: data volume, AI cost.

### F31. Public API
- **Description:** Read API for partners/integrations.
- **Story:** *As a partner, I want programmatic access.* · P2 · M.

### F32. Plagiarism detection
- **Description:** Similarity checks against the corpus on upload.
- **Story:** *As a moderator, I want automated plagiarism signals.* · P2 · L.

### F33. Payments (DRC-friendly)
- **Description:** Mobile money (M-Pesa/Airtel/Orange) + card; subscriptions/one-off.
- **Story:** *As a customer, I want to pay locally.* · P0(rev) · L · Dep: F26/F27.
