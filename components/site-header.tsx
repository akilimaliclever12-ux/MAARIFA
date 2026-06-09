import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { createClient } from '@/lib/supabase/server';
import { signOut } from '@/app/actions/auth';
import { LanguageSwitcher } from '@/components/language-switcher';

export async function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const signOutWithLocale = signOut.bind(null, locale);

  return (
    <header className="border-b border-stone/15 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href={`/${locale}`} className="text-xl font-semibold text-lake">
          {dict.app.name}
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link href={`/${locale}/publications`} className="hidden text-ink hover:text-lake sm:inline">
            {dict.nav.browse}
          </Link>

          {user ? (
            <>
              <Link
                href={`/${locale}/espace`}
                className="rounded-md bg-lake px-3 py-1.5 font-medium text-white hover:bg-lake-dark"
              >
                {dict.nav.publish}
              </Link>
              <form action={signOutWithLocale}>
                <button type="submit" className="text-stone hover:text-clay">
                  {dict.nav.logout}
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href={`/${locale}/connexion`} className="text-ink hover:text-lake">
                {dict.nav.login}
              </Link>
              <Link
                href={`/${locale}/inscription`}
                className="rounded-md bg-lake px-3 py-1.5 font-medium text-white hover:bg-lake-dark"
              >
                {dict.nav.signup}
              </Link>
            </>
          )}

          <LanguageSwitcher currentLocale={locale} />
        </nav>
      </div>
    </header>
  );
}
