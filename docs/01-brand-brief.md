# 01 — Brand Brief

## Brand Name Suggestions

The platform serves a French-first, Swahili-speaking region. Names rooted in local language carry meaning and memorability.

| Name | Meaning / rationale | Notes |
|------|--------------------|-------|
| **Maarifa** ✅ *(recommended)* | Swahili for *knowledge* | Local, short, meaningful, easy to say & type, available .com-style domains likely |
| Elimu | Swahili for *education* | Strong but generic in EdTech |
| Akili | Swahili for *intelligence / mind* | Memorable but less tied to "archive" |
| Hekima | Swahili for *wisdom* | Warm, but harder to spell for some |
| Savoir Kivu | French *savoir* (knowledge) + region | Descriptive, less brandable |
| KivuThèque | "Kivu" + *bibliothèque* | Clear meaning, region-anchored |
| Bandari ya Maarifa | "Harbor of knowledge" (Swahili) | Evocative but long |

**Chosen brand: Maarifa.** Tagline-ready, regionally authentic, and signals "knowledge" without limiting the platform to one document type.

> **Full name for SEO / formal use:** *Maarifa — Archives Académiques du Sud-Kivu*

---

## Mission

Rendre le savoir académique du Sud-Kivu accessible, durable et partageable — pour que la production intellectuelle locale ne se perde plus jamais.

> *To make South Kivu's academic knowledge accessible, durable, and shareable — so that local intellectual production is never lost again.*

## Vision

Devenir la plus grande bibliothèque numérique de la recherche et de la production intellectuelle de l'Est de la RDC, puis de toute la RDC.

> *To become the largest digital library of research and intellectual production in eastern DRC, then all of DRC.*

## Core Values

1. **Accessibilité** — Le savoir doit être atteignable depuis un téléphone bon marché, en faible connexion.
2. **Préservation** — Ce qui est publié est conservé durablement.
3. **Crédit & intégrité** — Chaque auteur est reconnu; le plagiat est combattu.
4. **Communauté** — Construit par et pour les étudiants, chercheurs et universités du Sud-Kivu.
5. **Simplicité** — Facile à utiliser, même pour un premier utilisateur d'Internet académique.
6. **Souveraineté du savoir local** — Les connaissances locales restent visibles et valorisées.

## Target Audience

**Primary**
- Étudiants finalistes (licence, master) cherchant à publier leur mémoire et à consulter des travaux antérieurs.
- Chercheurs et enseignants universitaires.

**Secondary**
- Universités et instituts supérieurs (UCB, ISP, ISDR, UEA, etc.) voulant archiver et valoriser leur production.
- Professionnels et ONG produisant rapports et études de cas.
- Étudiants des autres provinces et de la diaspora congolaise.

## Positioning Statement

> Pour les étudiants et chercheurs du Sud-Kivu qui peinent à publier et à retrouver les travaux académiques locaux, **Maarifa** est une bibliothèque numérique mobile-first qui rend la recherche locale facile à publier, à découvrir et à partager — contrairement aux disques durs personnels, aux clés USB et aux bibliothèques physiques où ce savoir disparaît.

## Brand Personality

- **Sérieux mais accessible** — crédible comme une bibliothèque universitaire, simple comme une app de messagerie.
- **Fier et local** — ancré dans le Sud-Kivu, pas une copie d'un produit étranger.
- **Encourageant** — célèbre chaque travail publié.
- **Fiable** — on peut compter sur lui pour préserver son travail.

## Tone of Voice

- **Clair et direct.** Phrases courtes. Pas de jargon technique inutile.
- **Respectueux et valorisant.** On parle aux auteurs comme à des contributeurs précieux.
- **Bilingue, français d'abord.** Interface en français; anglais en option.
- **Chaleureux, jamais condescendant.** On guide sans infantiliser.

Exemples :
- ✅ « Votre mémoire est en ligne. Partagez-le sur WhatsApp. »
- ❌ « Upload successful. Asset ID #4821 persisted. »

## Brand Promise

> *Publiez une fois. Restez trouvable pour toujours.*
> Votre travail académique sera préservé, crédité, et accessible à ceux qui en ont besoin.

## Unique Selling Proposition (USP)

**La seule plateforme pensée pour le Sud-Kivu** : mobile-first, optimisée pour la faible connexion, partageable par WhatsApp, et centrée sur la production académique locale — là où Google Scholar, ResearchGate et les dépôts universitaires étrangers ignorent ou enterrent le savoir congolais.

## Tagline Suggestions

1. **« Le savoir du Sud-Kivu, accessible à tous. »** ✅ *(primary)*
2. « Publiez. Préservez. Partagez. »
3. « La mémoire numérique de notre recherche. »
4. « Votre savoir ne se perdra plus. »
5. « Maarifa — là où la recherche locale vit. »

## Color Palette Recommendations

Inspired by Lake Kivu, Congolese earth, and academic trust. High contrast for low-end screens and sunlight readability.

| Role | Color | Hex | Use |
|------|-------|-----|-----|
| Primary | Lake Deep Blue | `#0F4C81` | Headers, primary buttons, links |
| Primary dark | Midnight Kivu | `#0A3258` | Hover states, dark text on light |
| Accent | Sunrise Gold | `#F2A516` | Highlights, calls-to-action, badges |
| Success | Forest Green | `#2E7D52` | Validated / published states |
| Danger | Clay Red | `#C0392B` | Errors, destructive actions |
| Neutral 900 | Ink | `#1A1A1A` | Body text |
| Neutral 500 | Stone | `#6B7280` | Secondary text |
| Neutral 100 | Mist | `#F4F6F8` | Backgrounds, cards |
| White | Paper | `#FFFFFF` | Surfaces |

**Accessibility:** Primary on white = 8.6:1 contrast (AAA). Accent gold used on dark blue, never as text on white without darkening.

## Typography Recommendations

Pick web-safe, fast-loading fonts. Avoid heavy font files (bandwidth matters).

| Use | Font | Why |
|-----|------|-----|
| Headings | **Inter** (or system `sans-serif`) | Clean, legible, free, variable font, tiny on subset |
| Body | **Inter** / system stack | One font family = fewer requests |
| Fallback stack | `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif` | Zero download on most Android phones |

**Performance rule:** Prefer the **system font stack** for the MVP (0 KB download). Introduce Inter (subsetted, `font-display: swap`, self-hosted) only if brand consistency demands it. Never load more than 2 weights (400, 600).

**Logo concept:** Wordmark "Maarifa" in Inter SemiBold, Lake Deep Blue, with the dot of an open book or a stylized "ripple" (Lake Kivu) under the word. Keep it monochrome-capable for low-color contexts and WhatsApp avatars.
