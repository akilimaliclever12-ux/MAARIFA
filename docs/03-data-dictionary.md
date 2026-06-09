# 03 — Data Dictionary

**Database:** PostgreSQL (Supabase)
**Convention:** `snake_case`, plural table names, UUID primary keys (`id`), `timestamptz` for time, `created_at`/`updated_at` on mutable tables.

## Lean-schema decisions (read this first)

To keep the MVP lean (per founder constraint), some tables from the original list are **merged** or **deferred**:

| Original table | MVP decision |
|----------------|-------------|
| **Users** + **Authors** | **Merged into `profiles`** (one row per person; an author *is* a user). |
| **Admin Users** | **Merged into `profiles.role`** (`reader` / `author` / `moderator` / `admin`). No separate table. |
| **Organizations** | **Deferred to v1.1.** Universities cover institutions for now. |
| **Comments** | **Deferred to v1.1** (out of MVP scope). |
| **Reviews** | **Deferred to v1.1/v2.0** (peer review is a later feature). |
| **Notifications** (in-app) | **Deferred to v1.1.** MVP uses transactional email (Resend) only. |

Tables marked **(MVP)** are created in [04-database-schema.sql](./04-database-schema.sql). Tables marked **(v1.1)** are documented here and provided in a clearly separated *deferred* section of the SQL file — do not create them at launch.

---

## profiles  *(MVP)* — replaces Users + Authors + Admin Users

Every person on the platform. `id` equals the Supabase Auth user id.

| Field | Type | Constraints | Description | Example |
|-------|------|-------------|-------------|---------|
| id | uuid | PK, FK → auth.users(id) ON DELETE CASCADE | Auth user id | `a1b2...` |
| full_name | text | NOT NULL | Display name | `Esther Mwamini` |
| slug | text | UNIQUE, NOT NULL | URL handle for public profile | `esther-mwamini` |
| email | text | | Cached email (source of truth in auth.users) | `esther@ex.cd` |
| role | text | NOT NULL, CHECK in (reader,author,moderator,admin), default `reader` | Authorization role | `author` |
| bio | text | | Short biography | `Master santé publique, UCB` |
| avatar_url | text | | Profile photo URL (Storage) | `https://.../a.jpg` |
| university_id | uuid | FK → universities(id) ON DELETE SET NULL | Affiliation | `u-uuid` |
| faculty_id | uuid | FK → faculties(id) ON DELETE SET NULL | Affiliation | `f-uuid` |
| department_id | uuid | FK → departments(id) ON DELETE SET NULL | Affiliation | `d-uuid` |
| created_at | timestamptz | NOT NULL, default now() | | |
| updated_at | timestamptz | NOT NULL, default now() | | |

**Relationships:** 1 profile → many publications (owner); → many saved_publications; → many publication_authors.

---

## universities  *(MVP)*

| Field | Type | Constraints | Description | Example |
|-------|------|-------------|-------------|---------|
| id | uuid | PK, default gen_random_uuid() | | |
| name | text | NOT NULL, UNIQUE | Full name | `Université Catholique de Bukavu` |
| acronym | text | | Short name | `UCB` |
| city | text | default `Bukavu` | City | `Bukavu` |
| created_at | timestamptz | NOT NULL, default now() | | |

**Relationships:** 1 → many faculties; 1 → many publications; 1 → many profiles.

---

## faculties  *(MVP)*

| Field | Type | Constraints | Description | Example |
|-------|------|-------------|-------------|---------|
| id | uuid | PK | | |
| university_id | uuid | FK → universities(id) ON DELETE CASCADE, NOT NULL | Parent | |
| name | text | NOT NULL | Faculty name | `Médecine` |
| created_at | timestamptz | NOT NULL, default now() | | |

Constraint: UNIQUE (university_id, name).
**Relationships:** 1 → many departments; 1 → many publications.

---

## departments  *(MVP)*

| Field | Type | Constraints | Description | Example |
|-------|------|-------------|-------------|---------|
| id | uuid | PK | | |
| faculty_id | uuid | FK → faculties(id) ON DELETE CASCADE, NOT NULL | Parent | |
| name | text | NOT NULL | Department name | `Santé publique` |
| created_at | timestamptz | NOT NULL, default now() | | |

Constraint: UNIQUE (faculty_id, name).
**Relationships:** 1 → many publications.

---

## categories  *(MVP)*

Editorial classification (distinct from `publications.type`, which is the document form).

| Field | Type | Constraints | Description | Example |
|-------|------|-------------|-------------|---------|
| id | uuid | PK | | |
| name | text | NOT NULL, UNIQUE | Display name | `Santé` |
| slug | text | NOT NULL, UNIQUE | URL slug | `sante` |
| description | text | | | `Travaux liés à la santé` |
| created_at | timestamptz | NOT NULL, default now() | | |

**Relationships:** 1 → many publications.

---

## publications  *(MVP)* — core table

| Field | Type | Constraints | Description | Example |
|-------|------|-------------|-------------|---------|
| id | uuid | PK | | |
| owner_id | uuid | FK → profiles(id) ON DELETE CASCADE, NOT NULL | Uploader / responsible author | |
| title | text | NOT NULL | | `Accès aux soins à Bukavu` |
| slug | text | UNIQUE, NOT NULL | URL slug (title + short id) | `acces-aux-soins-a1b2` |
| abstract | text | | Summary / résumé | `Cette étude...` |
| type | text | NOT NULL, CHECK in (memoire, these, article, rapport, etude_cas, projet_innovation, publication, autre) | Document form | `memoire` |
| university_id | uuid | FK → universities(id) ON DELETE SET NULL | | |
| faculty_id | uuid | FK → faculties(id) ON DELETE SET NULL | | |
| department_id | uuid | FK → departments(id) ON DELETE SET NULL | | |
| category_id | uuid | FK → categories(id) ON DELETE SET NULL | | |
| year | int | CHECK (year between 1950 and 2100) | Year of work | `2025` |
| language | text | NOT NULL, default `fr`, CHECK in (fr,en,sw,other) | Document language | `fr` |
| status | text | NOT NULL, default `draft`, CHECK in (draft, pending, published, rejected) | Lifecycle | `published` |
| rejection_reason | text | | Filled if rejected | `Doublon` |
| view_count | int | NOT NULL, default 0 | Denormalized counter | `134` |
| download_count | int | NOT NULL, default 0 | Denormalized counter | `52` |
| search_vector | tsvector | (generated) | Full-text index source | |
| published_at | timestamptz | | Set when status→published | |
| created_at | timestamptz | NOT NULL, default now() | | |
| updated_at | timestamptz | NOT NULL, default now() | | |

**Relationships:** → many publication_files; → many publication_keywords; → many publication_authors; → many downloads/views/saved_publications/reports.

---

## publication_files  *(MVP)*

A publication may have ≥1 file (main PDF; future: annexes).

| Field | Type | Constraints | Description | Example |
|-------|------|-------------|-------------|---------|
| id | uuid | PK | | |
| publication_id | uuid | FK → publications(id) ON DELETE CASCADE, NOT NULL | | |
| storage_path | text | NOT NULL | Path in Storage bucket `publications` | `pub/uuid/memoire.pdf` |
| file_name | text | NOT NULL | Original name | `memoire-esther.pdf` |
| file_size | bigint | NOT NULL | Bytes | `2480123` |
| mime_type | text | NOT NULL, default `application/pdf` | | `application/pdf` |
| is_primary | boolean | NOT NULL, default true | Main downloadable file | `true` |
| created_at | timestamptz | NOT NULL, default now() | | |

---

## keywords  *(MVP)*

| Field | Type | Constraints | Description | Example |
|-------|------|-------------|-------------|---------|
| id | uuid | PK | | |
| name | text | NOT NULL, UNIQUE | Keyword | `paludisme` |
| slug | text | NOT NULL, UNIQUE | | `paludisme` |
| created_at | timestamptz | NOT NULL, default now() | | |

---

## publication_keywords  *(MVP)* — join

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| publication_id | uuid | FK → publications(id) ON DELETE CASCADE, NOT NULL | |
| keyword_id | uuid | FK → keywords(id) ON DELETE CASCADE, NOT NULL | |

PK = (publication_id, keyword_id).

---

## publication_authors  *(MVP)* — credit co-authors

Supports co-authors who may or may not have a profile.

| Field | Type | Constraints | Description | Example |
|-------|------|-------------|-------------|---------|
| id | uuid | PK | | |
| publication_id | uuid | FK → publications(id) ON DELETE CASCADE, NOT NULL | | |
| profile_id | uuid | FK → profiles(id) ON DELETE SET NULL | Linked account if exists | |
| author_name | text | NOT NULL | Displayed name (works even without account) | `J. Bisimwa` |
| position | int | NOT NULL, default 1 | Author order | `1` |
| created_at | timestamptz | NOT NULL, default now() | | |

---

## downloads  *(MVP)* — lightweight event log

Counter on `publications.download_count` is the source of truth for display; this table enables basic analytics and abuse detection.

| Field | Type | Constraints | Description | Example |
|-------|------|-------------|-------------|---------|
| id | uuid | PK | | |
| publication_id | uuid | FK → publications(id) ON DELETE CASCADE, NOT NULL | | |
| user_id | uuid | FK → profiles(id) ON DELETE SET NULL | Null if anonymous | |
| ip_hash | text | | Hashed IP (privacy) for dedup | `9f2c...` |
| created_at | timestamptz | NOT NULL, default now() | | |

---

## views  *(MVP)* — lightweight event log

Same pattern as downloads, for page views.

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| id | uuid | PK | |
| publication_id | uuid | FK → publications(id) ON DELETE CASCADE, NOT NULL | |
| user_id | uuid | FK → profiles(id) ON DELETE SET NULL | |
| ip_hash | text | | |
| created_at | timestamptz | NOT NULL, default now() | |

> **Cost note:** if these tables grow too fast on free tier, keep only the denormalized counters and drop the event rows (or aggregate daily). Acceptable for MVP.

---

## saved_publications  *(MVP)* — favorites

| Field | Type | Constraints | Description |
|-------|------|-------------|-------------|
| user_id | uuid | FK → profiles(id) ON DELETE CASCADE, NOT NULL | |
| publication_id | uuid | FK → publications(id) ON DELETE CASCADE, NOT NULL | |
| created_at | timestamptz | NOT NULL, default now() | |

PK = (user_id, publication_id).

---

## reports  *(MVP)* — flag/report (plagiarism, abuse)

| Field | Type | Constraints | Description | Example |
|-------|------|-------------|-------------|---------|
| id | uuid | PK | | |
| publication_id | uuid | FK → publications(id) ON DELETE CASCADE, NOT NULL | | |
| reporter_id | uuid | FK → profiles(id) ON DELETE SET NULL | Null if anonymous | |
| reason | text | NOT NULL, CHECK in (plagiat, contenu_inapproprie, droit_auteur, spam, autre) | | `plagiat` |
| details | text | | Free text | `Copie de...` |
| status | text | NOT NULL, default `open`, CHECK in (open, reviewed, dismissed, actioned) | | `open` |
| created_at | timestamptz | NOT NULL, default now() | | |

---

## audit_logs  *(MVP)* — admin/moderator action trail

| Field | Type | Constraints | Description | Example |
|-------|------|-------------|-------------|---------|
| id | uuid | PK | | |
| actor_id | uuid | FK → profiles(id) ON DELETE SET NULL | Who acted | |
| action | text | NOT NULL | Verb | `publication.approve` |
| entity_type | text | NOT NULL | Target type | `publication` |
| entity_id | uuid | | Target id | |
| metadata | jsonb | default '{}' | Extra context | `{"reason":"ok"}` |
| created_at | timestamptz | NOT NULL, default now() | | |

---

# Deferred tables (v1.1+) — documented, NOT created at MVP

## organizations  *(v1.1)*
NGOs/companies/institutions beyond universities.
`id, name, type, city, website, verified, created_at`.

## comments  *(v1.1)*
`id, publication_id (FK), author_id (FK profiles), body, status (visible/hidden), created_at`.

## reviews  *(v1.1 / v2.0)*
Peer or editorial reviews.
`id, publication_id (FK), reviewer_id (FK profiles), rating (1-5), body, status, created_at`.

## notifications  *(v1.1)* — in-app
`id, user_id (FK profiles), type, title, body, link, read_at, created_at`.
> MVP uses transactional email only; no in-app notification table needed yet.
