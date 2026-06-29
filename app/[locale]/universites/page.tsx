import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = { title: 'Universités' };

interface UniRow {
  id: string;
  name: string;
  acronym: string | null;
  slug: string;
  logo_url: string | null;
}

export default async function UniversitiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const supabase = await createClient();
  const [{ data: unis }, { data: pubs }] = await Promise.all([
    supabase.from('universities').select('id, name, acronym, slug, logo_url').order('name'),
    supabase.from('publications').select('university_id').eq('status', 'published'),
  ]);

  const universities = (unis ?? []) as UniRow[];
  // Count published works per university.
  const counts = new Map<string, number>();
  for (const p of (pubs ?? []) as { university_id: string | null }[]) {
    if (p.university_id) counts.set(p.university_id, (counts.get(p.university_id) ?? 0) + 1);
  }

  return (
    <div className="space-y-6 py-4">
      <header>
        <h1 className="text-2xl font-bold text-ink">{dict.universities.title}</h1>
        <p className="mt-1 text-stone">{dict.universities.subtitle}</p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {universities.map((u) => {
          const n = counts.get(u.id) ?? 0;
          const worksLabel =
            n === 1 ? dict.universities.oneWork : dict.universities.manyWorks.replace('{count}', String(n));
          return (
            <Link
              key={u.id}
              href={`/${locale}/universites/${u.slug}`}
              className="flex items-center gap-3 rounded-lg border border-stone/15 bg-white p-4 transition-colors hover:border-lake"
            >
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone/20 bg-mist">
                {u.logo_url ? (
                  <Image src={u.logo_url} alt={u.acronym ?? u.name} fill className="object-contain" sizes="48px" />
                ) : (
                  <span className="text-sm font-bold text-lake">
                    {(u.acronym ?? u.name).slice(0, 3).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{u.acronym ?? u.name}</p>
                <p className="truncate text-xs text-stone">{u.name}</p>
                <p className="mt-0.5 text-xs text-lake">{worksLabel}</p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
