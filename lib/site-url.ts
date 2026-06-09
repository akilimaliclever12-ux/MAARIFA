// Resolve the canonical site URL (used for share links, Open Graph, emails).
// Priority:
//   1. NEXT_PUBLIC_SITE_URL — set this to your custom domain in production.
//   2. VERCEL_PROJECT_PRODUCTION_URL — Vercel's stable production domain
//      (auto-provided), so share/OG links work without manual config.
//   3. localhost — local dev fallback.
export function getSiteUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/+$/, '');

  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;

  return 'http://localhost:3000';
}
