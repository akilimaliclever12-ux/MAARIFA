import type { Metadata, Viewport } from 'next';
import { notFound } from 'next/navigation';
import '../globals.css';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { SiteHeader } from '@/components/site-header';
import { SiteFooter } from '@/components/site-footer';
import { PWARegister } from '@/components/pwa-register';

// The shared header reflects per-user auth state, so render localized routes
// per request rather than caching them statically. Revisit with finer-grained
// caching once public/auth content is split.
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: {
    default: 'Maarifa — Archives Académiques du Sud-Kivu',
    template: '%s · Maarifa',
  },
  description:
    'Publiez, découvrez et partagez les mémoires, articles et travaux académiques de Bukavu et du Sud-Kivu.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  icons: {
    icon: '/maarifa_logo.png',
    apple: '/maarifa_logo.png',
    shortcut: '/maarifa_logo.png',
  },
  appleWebApp: { capable: true, title: 'Maarifa', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#0F4C81',
};

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();

  const dict = await getDictionary(locale);

  return (
    <html lang={locale}>
      <body className="flex min-h-screen flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-50 focus:rounded focus:bg-lake focus:px-3 focus:py-2 focus:text-white"
        >
          {locale === 'en' ? 'Skip to content' : 'Aller au contenu'}
        </a>
        <SiteHeader locale={locale} dict={dict} />
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">
          {children}
        </main>
        <SiteFooter locale={locale} dict={dict} />
        <PWARegister />
      </body>
    </html>
  );
}
