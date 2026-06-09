import { NextResponse, type NextRequest } from 'next/server';
import { locales, defaultLocale, isLocale } from '@/i18n/config';
import { updateSession } from '@/lib/supabase/middleware';

function detectLocale(request: NextRequest): string {
  // French is the default. We only honor an explicit choice the user made via
  // the language switcher (stored in the NEXT_LOCALE cookie). We intentionally
  // do NOT auto-switch on Accept-Language, so first-time visitors always start
  // in French.
  const cookieLocale = request.cookies.get('NEXT_LOCALE')?.value;
  if (isLocale(cookieLocale)) return cookieLocale;
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
