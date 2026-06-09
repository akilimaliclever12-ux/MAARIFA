import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale, isLocale } from '@/i18n/config';
import { updateSession } from '@/lib/supabase/middleware';

function detectLocale(request: NextRequest): string {
  // 1. Explicit cookie preference.
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (isLocale(cookieLocale)) return cookieLocale;

  // 2. Accept-Language header (first matching locale).
  const header = request.headers.get('accept-language');
  if (header) {
    const preferred = header
      .split(',')
      .map((part) => part.split(';')[0].trim().slice(0, 2).toLowerCase());
    const match = preferred.find((lang) => (locales as readonly string[]).includes(lang));
    if (match) return match;
  }

  // 3. Default.
  return defaultLocale;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Redirect any path missing a locale prefix to a localized URL.
  const hasLocalePrefix = locales.some(
    (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`),
  );

  if (!hasLocalePrefix) {
    const locale = detectLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === '/' ? '' : pathname}`;
    return NextResponse.redirect(url);
  }

  // Refresh the Supabase session on localized requests.
  return updateSession(request);
}

export const config = {
  // Skip Next internals, API routes, and files with an extension.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
