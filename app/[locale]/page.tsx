import Link from 'next/link';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { createClient } from '@/lib/supabase/server';
import { PublicationCard } from '@/components/publication-card';
import type { PublicationWithRelations } from '@/types/db';
import { notFound } from 'next/navigation';

export default async function HomePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const { data } = await supabase
    .from('publications')
    .select(
      'id, title, slug, abstract, thumbnail_url, type, year, view_count, download_count, status, ' +
        'universities ( name, acronym ), profiles!publications_owner_id_fkey ( full_name, slug )',
    )
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(12);

  const publications = (data ?? []) as unknown as PublicationWithRelations[];

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="rounded-xl bg-lake px-6 py-10 text-white">
        <h1 className="text-2xl font-bold sm:text-3xl">{dict.home.heroTitle}</h1>
        <p className="mt-3 max-w-2xl text-white/90">{dict.home.heroSubtitle}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={`/${locale}/espace`}
            className="rounded-md bg-gold px-4 py-2 font-medium text-ink hover:brightness-95"
          >
            {dict.home.ctaPublish}
          </Link>
          <Link
            href={`/${locale}/publications`}
            className="rounded-md border border-white/40 px-4 py-2 font-medium text-white hover:bg-white/10"
          >
            {dict.home.ctaBrowse}
          </Link>
        </div>
      </section>

      {/* Recent */}
      <section>
        <h2 className="mb-4 text-xl font-semibold text-ink">{dict.home.recent}</h2>
        {publications.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone/30 bg-white p-8 text-center text-stone">
            {dict.home.empty}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publications.map((p) => (
              <PublicationCard key={p.id} publication={p} locale={locale} dict={dict} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
