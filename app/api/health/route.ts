import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Decode a JWT's `role` claim without verifying — used only to confirm the
// service-role key is the RIGHT key (role should be "service_role"), never
// exposing the secret itself.
function jwtRole(token?: string): string | null {
  if (!token) return null;
  try {
    const payload = JSON.parse(Buffer.from(token.split('.')[1] ?? '', 'base64').toString('utf8'));
    return payload.role ?? null;
  } catch {
    return null;
  }
}

// GET /api/health — safe environment diagnostic (no secrets returned).
export function GET() {
  const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return NextResponse.json({
    ok: true,
    env: {
      NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY_role: jwtRole(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
      SUPABASE_SERVICE_ROLE_KEY_present: !!svc,
      SUPABASE_SERVICE_ROLE_KEY_role: jwtRole(svc), // expect "service_role"
      NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL ?? null,
      VERCEL_PROJECT_PRODUCTION_URL: process.env.VERCEL_PROJECT_PRODUCTION_URL ?? null,
      RESEND_API_KEY_present: !!process.env.RESEND_API_KEY,
    },
  });
}
