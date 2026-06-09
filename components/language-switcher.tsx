'use client';

import { usePathname, useRouter } from 'next/navigation';
import { locales, localeNames, type Locale } from '@/i18n/config';

export function LanguageSwitcher({ currentLocale }: { currentLocale: Locale }) {
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: Locale) {
    if (next === currentLocale) return;
    // Persist preference for future visits.
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=31536000; samesite=lax`;
    // Replace the locale segment in the current path.
    const segments = pathname.split('/');
    segments[1] = next; // segments[0] is '' before the leading slash
    router.push(segments.join('/') || `/${next}`);
  }

  return (
    <div className="flex items-center gap-1 text-xs" aria-label="Language">
      {locales.map((l, i) => (
        <span key={l} className="flex items-center gap-1">
          {i > 0 && <span className="text-stone/40">/</span>}
          <button
            type="button"
            onClick={() => switchTo(l)}
            aria-current={l === currentLocale}
            className={
              l === currentLocale
                ? 'font-semibold text-lake'
                : 'text-stone hover:text-lake'
            }
            title={localeNames[l]}
          >
            {l.toUpperCase()}
          </button>
        </span>
      ))}
    </div>
  );
}
