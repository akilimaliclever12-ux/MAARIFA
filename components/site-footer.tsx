import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const year = 2026; // bump as needed; avoids per-request Date in RSC cache
  return (
    <footer className="border-t border-stone/15 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-stone">
        <p className="font-medium text-lake">{dict.app.name}</p>
        <p className="mt-1">{dict.footer.mission}</p>
        <nav className="mt-3 flex gap-4">
          <Link href={`/${locale}/publications`} className="hover:text-lake">
            {dict.nav.browse}
          </Link>
          <Link href={`/${locale}/a-propos`} className="hover:text-lake">
            {dict.about.title}
          </Link>
          <Link href={`/${locale}/conditions`} className="hover:text-lake">
            {dict.terms.link}
          </Link>
        </nav>
        <p className="mt-3">
          © {year} {dict.app.name}. {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
