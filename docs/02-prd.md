# 02 — Product Requirements Document (PRD)

**Product:** Maarifa — Archives Académiques du Sud-Kivu
**Version:** 1.0 (MVP)
**Owner:** Solo founder
**Last updated:** 2026-06-08

---

## Executive Summary

Maarifa is a mobile-first, low-bandwidth digital repository for academic and intellectual work produced in Bukavu and South Kivu, DRC. Students and researchers upload mémoires, papers, reports, and projects; anyone can search, read, download, and share them — especially via WhatsApp. The MVP validates one core loop: **a student can publish a mémoire in under 5 minutes, and another person can find and download it in under 1 minute.** Built entirely on free-tier services (Supabase + Vercel), it is designed to launch fast, prove demand, and scale only after validation.

## Problem Statement

In South Kivu, thousands of mémoires and research works are produced yearly but:
- **Get lost** — stored on personal laptops, USB keys, or printed once.
- **Are undiscoverable** — no local index; Google Scholar/ResearchGate ignore them.
- **Are duplicated** — students re-research topics already covered because they can't find prior work.
- **Go uncredited** — authors gain no visibility or proof of authorship.
- **Are hard to share** — no easy link; sharing means emailing huge files or physical copies.

Existing tools (international repositories, university intranets) are absent, paywalled, desktop-heavy, or not adapted to low-bandwidth mobile usage.

## Solution Overview

A simple web platform where:
1. **Authors** create a profile and upload a publication (PDF) with metadata (title, abstract, university, year, category, keywords).
2. **Moderators** quickly approve submissions to keep quality and prevent abuse.
3. **Readers** browse and search by title, keyword, university, faculty, or category, then **download** or **share a WhatsApp link**.
4. Everything is **fast on cheap Android phones and weak connections**, and **free** to use at launch.

## Goals

- **G1.** Launch a usable MVP within 4 weeks on $0 infrastructure.
- **G2.** Make publishing a mémoire take **< 5 minutes**.
- **G3.** Make finding + downloading a relevant work take **< 1 minute**.
- **G4.** Seed the repository with the first 100–300 real publications from 2–3 universities.
- **G5.** Establish Maarifa as the default place to look for local academic work.

## Success Metrics

| Metric | MVP target (first 90 days) |
|--------|----------------------------|
| Publications uploaded | 100–300 |
| Approved publications live | ≥ 80% of submissions |
| Registered authors | 150+ |
| Monthly active readers | 500+ |
| Downloads | 1,000+ |
| WhatsApp shares (tracked links) | 300+ |
| Median time to publish | < 5 min |
| Median page load (3G) | < 3 s |
| Partner universities engaged | 2–3 |

## User Personas

### 1. Esther — Étudiante finaliste (Primary)
- 23, master en santé publique à l'UCB. Smartphone Android d'entrée de gamme, data limitée.
- **Goal:** Publier son mémoire pour preuve d'auteur + visibilité, et lire des mémoires similaires.
- **Frustration:** Pas de lieu pour publier; difficile de trouver les travaux des promotions précédentes.

### 2. Dr. Mukala — Chercheur / Enseignant (Primary)
- 41, enseignant et chercheur. Veut diffuser ses articles et que ses étudiants trouvent des références locales.
- **Goal:** Archiver sa production, suivre les téléchargements, encadrer ses étudiants.
- **Frustration:** Sa recherche reste invisible hors de l'université.

### 3. Patrick — Lecteur / Étudiant en recherche (Primary)
- 20, licence. Cherche rapidement un document précis, souvent via un lien WhatsApp d'un camarade.
- **Goal:** Trouver et télécharger un document utile vite, sur peu de data.
- **Frustration:** Liens cassés, fichiers lourds, sites lents.

### 4. Mme Furaha — Responsable bibliothèque universitaire (Secondary)
- 38, gère la documentation d'un institut supérieur.
- **Goal:** Valoriser et préserver la production de son établissement; obtenir des statistiques.
- **Frustration:** Pas d'outil numérique simple et abordable.

### 5. Admin / Modérateur (Internal)
- Le founder au départ. Approuve les publications, gère les signalements, maintient la qualité.

## User Pain Points

- Fichiers lourds + connexion faible = abandons.
- Aucun moyen simple de prouver « j'ai écrit ce travail ».
- Recherche locale inexistante → travail dupliqué.
- Partage difficile (pas de lien propre).
- Méfiance sur le plagiat et l'usage non crédité.

## Functional Requirements

**Authentication & profiles**
- FR1. S'inscrire / se connecter par email + mot de passe (Supabase Auth). OTP/magic link optionnel.
- FR2. Créer et éditer un profil auteur (nom, bio, université, faculté, département, photo optionnelle).

**Publishing**
- FR3. Uploader une publication : fichier PDF + métadonnées (titre, résumé, type, université, faculté, département, année, langue, mots-clés, catégorie).
- FR4. Sauvegarder un brouillon et le soumettre pour modération.
- FR5. Voir le statut (brouillon, en attente, publié, rejeté + motif).

**Discovery**
- FR6. Page d'accueil : publications récentes + populaires + recherche.
- FR7. Recherche plein texte sur titre, résumé, mots-clés, auteur.
- FR8. Filtres : type, université, faculté, catégorie, année, langue.
- FR9. Page de détail publication : métadonnées, résumé, auteur(s), bouton télécharger, bouton partager (WhatsApp).
- FR10. Page profil auteur publique : ses publications.

**Engagement**
- FR11. Télécharger le fichier (comptage des téléchargements).
- FR12. Compter les vues.
- FR13. Sauvegarder/favoris une publication (utilisateur connecté).
- FR14. Partage WhatsApp via lien propre + Open Graph (titre, résumé, image).

**Moderation & admin**
- FR15. File de modération : approuver / rejeter avec motif.
- FR16. Signaler une publication (plagiat/contenu inapproprié).
- FR17. Tableau de bord admin minimal : compteurs, dernières soumissions, signalements.
- FR18. Journal d'audit des actions admin sensibles.

**Notifications (light)**
- FR19. Email transactionnel : confirmation, publication approuvée/rejetée (Resend).

## Non-Functional Requirements

- **NFR1. Performance:** First load < 3 s sur 3G; pages listables < 200 KB hors PDF; images optimisées/lazy.
- **NFR2. Mobile-first:** Conçu d'abord pour écrans ~360 px, tactile, pouce.
- **NFR3. Low-bandwidth:** Pagination, lazy loading, pas de PDF auto-chargé, mise en cache.
- **NFR4. i18n:** Français par défaut, anglais en option (structure i18n prête).
- **NFR5. SEO:** SSR/SSG, métadonnées, sitemap, URLs lisibles, Open Graph pour WhatsApp.
- **NFR6. Accessibility:** Contraste AA+, navigation clavier, textes alternatifs, cibles tactiles ≥ 44 px.
- **NFR7. Security:** RLS Supabase sur toutes les tables; uploads validés; rôles séparés.
- **NFR8. Cost:** Reste dans les free tiers (Supabase, Vercel, Resend) au lancement.
- **NFR9. Maintainability:** Solo-founder friendly; peu de dépendances; code clair.
- **NFR10. Availability:** Best-effort (free tier). Sauvegardes Supabase activées.

## MVP Scope (in)

- Email auth + author profile.
- Upload PDF + metadata + draft/submit.
- Moderation queue (approve/reject).
- Browse, search (full-text), filters.
- Publication detail + download + view count + WhatsApp share.
- Save/favorites.
- Public author profile.
- Minimal admin dashboard + audit log.
- Transactional emails.
- French UI (English toggle if time permits).

## Out-of-Scope Features (MVP)

- Comments, ratings/reviews, discussion threads.
- Peer review workflow.
- ORCID / Crossref / DOI integration.
- AI-powered semantic search & recommendations.
- Citations export (BibTeX), plagiarism detection engine.
- Payments / subscriptions / paywalls.
- Native mobile apps.
- Multi-author collaborative editing.
- Institutional dashboards & analytics portals.
- Public API.

These move to v1.1 / v2.0 (see [Feature Backlog](./05-feature-backlog.md)).

## Assumptions

- Users have smartphones and WhatsApp; data is the main constraint.
- Most works are PDFs of a few MB.
- French is the dominant academic language; Swahili UI not required at MVP.
- A solo founder can moderate submissions manually at early volume.
- Universities will engage if the tool is free, simple, and credits them.
- Free tiers suffice until ~1–2 GB storage / modest traffic.

## Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|-----------|
| Low initial content (cold start) | High | High | Manually seed 100+ works; partner with 2–3 unis; upload on authors' behalf with consent |
| Copyright / plagiarism disputes | Medium | High | Author attestation on upload; takedown + report flow; audit log |
| Storage/egress exceeds free tier | Medium | Medium | Cap file size; compress PDFs; monitor; move cold files to cheap storage later |
| Weak connectivity hurts UX | High | Medium | Aggressive perf budget; lazy load; avoid heavy JS |
| Solo founder bandwidth (moderation) | Medium | Medium | Simple queue; trusted-uploader fast-track later |
| Trust/adoption | Medium | High | University endorsements; clear authorship/credit; local-language outreach |
| Data loss | Low | High | Enable Supabase backups; periodic export |

## Future Opportunities

- AI semantic search & summarization (FR-ready, build later).
- DOI/ORCID for citable, credible local research.
- Institutional accounts with branded portals & analytics (revenue).
- Mobile/PWA offline reading.
- Expansion to other DRC provinces and East Africa.
- Conference proceedings, journals, datasets.
- Grants/NGO funding for knowledge preservation.
