// Accent-insensitive normalization, matching the DB's unaccent() used in the
// publications.search_vector trigger. Pure (no Node deps) — safe anywhere.
export function unaccent(input: string): string {
  return input.normalize('NFD').replace(/\p{Diacritic}/gu, '');
}
