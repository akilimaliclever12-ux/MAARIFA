// Shared database row types (hand-maintained for the MVP).
// When the schema stabilizes, you can generate these with the Supabase CLI:
//   npx supabase gen types typescript --project-id <ref> > types/supabase.ts

export type Role = 'reader' | 'author' | 'moderator' | 'admin';

export type PublicationType =
  | 'memoire'
  | 'these'
  | 'article'
  | 'rapport'
  | 'etude_cas'
  | 'projet_innovation'
  | 'publication'
  | 'autre';

export type PublicationStatus = 'draft' | 'pending' | 'published' | 'rejected';

export type LanguageCode = 'fr' | 'en' | 'sw' | 'other';

export type Alignment = 'left' | 'center' | 'right' | 'justify';

export interface ProfileRow {
  id: string;
  full_name: string;
  slug: string;
  email: string | null;
  role: Role;
  bio: string | null;
  avatar_url: string | null;
  university_id: string | null;
  faculty_id: string | null;
  department_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface UniversityRow {
  id: string;
  name: string;
  acronym: string | null;
  city: string;
  created_at: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface PublicationRow {
  id: string;
  owner_id: string;
  title: string;
  slug: string;
  abstract: string | null;
  abstract_align: Alignment;
  type: PublicationType;
  university_id: string | null;
  faculty_id: string | null;
  department_id: string | null;
  category_id: string | null;
  year: number | null;
  language: LanguageCode;
  status: PublicationStatus;
  rejection_reason: string | null;
  view_count: number;
  download_count: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// A publication joined with its display-friendly relations (used in lists/cards).
export interface PublicationWithRelations extends PublicationRow {
  universities: Pick<UniversityRow, 'name' | 'acronym'> | null;
  profiles: Pick<ProfileRow, 'full_name' | 'slug'> | null;
}
