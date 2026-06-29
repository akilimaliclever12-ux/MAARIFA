import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { createClient } from '@/lib/supabase/server';
import { getSiteUrl } from '@/lib/site-url';
import { PublicationCard } from '@/components/publication-card';
import type { PublicationWithRelations } from '@/types/db';

interface UniRow {
  id: string;
  name: string;
  acronym: string | null;
  slug: string;
  logo_url: string | null;
  city: string | null;
}

async function getUniversity(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('universities')
    .select('id, name, acronym, slug, logo_url, city')
    .eq('slug', slug)
    .maybeSingle();
  return data as UniRow | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const uni = await getUniversity(slug);
  if (!uni) return { title: 'Université' };
  const siteUrl = getSiteUrl();
  return {
    title: `${uni.name} — Maarifa`,
    description: `Travaux académiques de ${uni.name} sur Maarifa.`,
    openGraph: {
      title: `${uni.name} sur Maarifa`,
      description: `Mémoires, articles et travaux de ${uni.name}.`,
      url: `${siteUrl}/${locale}/universites/${uni.slug}`,
      siteName: 'Maarifa',
    },
  };
}

export default async function UniversitySpacePage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const uni = await getUniversity(slug);
  if (!uni) notFound();

  const supabase = await createClient();
  const { data, count } = await supabase
    .from('publications')
    .select(
      'id, title, slug, abstract, thumbnail_url, type, year, view_count, download_count, status, ' +
        'universities ( name, acronym ), profiles!publications_owner_id_fkey ( full_name, slug )',
      { count: 'exact' },
    )
    .eq('university_id', uni.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const publications = (data ?? []) as unknown as PublicationWithRelations[];
  const n = count ?? publications.length;
  const worksLabel =
    n === 1 ? dict.universities.oneWork : dict.universities.manyWorks.replace('{count}', String(n));

  return (
    <div className="space-y-6 py-4">
      <Link href={`/${locale}/universites`} className="text-sm text-lake hover:underline">
        {dict.universities.backToAll}
      </Link>

      {/* Branded header */}
      <header className="flex flex-wrap items-center gap-4 rounded-xl border border-stone/15 bg-white p-5">
        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone/20 bg-mist">
          {uni.logo_url ? (
            <Image src={uni.logo_url} alt={uni.acronym ?? uni.name} fill className="object-contain" sizes="80px" />
          ) : (
            <span className="text-xl font-bold text-lake">
              {(uni.acronym ?? uni.name).slice(0, 3).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0">
          <p className="text-xs uppercase tracking-wide text-stone">{dict.universities.spaceOf}</p>
          <h1 className="text-2xl font-bold text-ink">{uni.name}</h1>
          <p className="mt-1 text-sm text-stone">
            {uni.city ? `${uni.city} · ` : ''}
            {worksLabel}
          </p>
        </div>
      </header>

      {publications.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone/30 bg-white p-8 text-center text-stone">
          {dict.universities.noWorks}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {publications.map((p) => (
            <PublicationCard key={p.id} publication={p} locale={locale} dict={dict} />
          ))}
        </div>
      )}
    </div>
  );
}
