import Link from 'next/link';
import Image from 'next/image';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import { getCurrentUser, isStaffRole } from '@/lib/auth/session';
import { signOut } from '@/app/actions/auth';
import { LanguageSwitcher } from '@/components/language-switcher';

export async function SiteHeader({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const user = await getCurrentUser();
  const signOutWithLocale = signOut.bind(null, locale);

  return (
    <header className="border-b border-stone/15 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href={`/${locale}`} className="flex items-center gap-2">
          <Image
            src="/maarifa_logo.png"
            alt={dict.app.name}
            width={258}
            height={248}
            priority
            className="h-9 w-9 object-contain"
          />
          <span className="text-xl font-semibold text-lake">{dict.app.name}</span>
        </Link>

        <nav className="flex items-center gap-3 text-sm">
          <Link href={`/${locale}/publications`} className="hidden text-ink hover:text-lake sm:inline">
            {dict.nav.browse}
          </Link>

          {user ? (
            <>
              {isStaffRole(user.role) && (
                <Link
                  href={`/${locale}/admin`}
                  className="hidden text-[#8a5a00] hover:underline sm:inline"
                >
                  {dict.admin.title}
                </Link>
              )}
              <Link
                href={`/${locale}/espace`}
                className="rounded-md bg-lake px-3 py-1.5 font-medium text-white hover:bg-lake-dark"
              >
                {dict.nav.dashboard}
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
