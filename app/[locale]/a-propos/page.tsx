import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';

export const metadata: Metadata = { title: 'À propos' };

export default async function AboutPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const steps = [
    { title: dict.about.step1Title, body: dict.about.step1 },
    { title: dict.about.step2Title, body: dict.about.step2 },
    { title: dict.about.step3Title, body: dict.about.step3 },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">{dict.about.title}</h1>
        <p className="mt-3 text-ink">{dict.about.intro}</p>
      </header>

      <section>
        <h2 className="mb-4 text-lg font-semibold text-ink">{dict.about.howTitle}</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((s) => (
            <div key={s.title} className="rounded-lg border border-stone/15 bg-white p-4">
              <p className="font-semibold text-lake">{s.title}</p>
              <p className="mt-1 text-sm text-stone">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Link
        href={`/${locale}/espace/publier`}
        className="inline-block rounded-md bg-lake px-4 py-2.5 font-medium text-white hover:bg-lake-dark"
      >
        {dict.about.cta}
      </Link>
    </div>
  );
}
