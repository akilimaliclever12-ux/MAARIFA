import { randomBytes } from 'node:crypto';

// Turn arbitrary text into a URL-safe slug (accent-insensitive).
export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // strip diacritics (combining marks)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

// A publication slug = slugified title + short random suffix (collision-safe).
export function publicationSlug(title: string): string {
  const base = slugify(title) || 'publication';
  const suffix = randomBytes(3).toString('hex'); // 6 hex chars
  return `${base}-${suffix}`;
}
