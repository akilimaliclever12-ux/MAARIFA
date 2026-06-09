import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

export function SiteFooter({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const year = 2026; // bump as needed; avoids per-request Date in RSC cache
  return (
    <footer className="border-t border-stone/15 bg-white">
      <div className="mx-auto max-w-5xl px-4 py-6 text-sm text-stone">
        <p className="font-medium text-lake">{dict.app.name}</p>
        <p className="mt-1">{dict.footer.mission}</p>
        <p className="mt-2">
          © {year} {dict.app.name}. {dict.footer.rights}
        </p>
      </div>
    </footer>
  );
}
