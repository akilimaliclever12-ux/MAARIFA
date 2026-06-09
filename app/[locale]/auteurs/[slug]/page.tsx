import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { createClient } from '@/lib/supabase/server';
import { PublicationCard } from '@/components/publication-card';
import type { PublicationWithRelations } from '@/types/db';

interface AuthorProfile {
  id: string;
  full_name: string;
  slug: string;
  bio: string | null;
  universities: { name: string; acronym: string | null } | null;
}

async function getAuthor(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, slug, bio, universities ( name, acronym )')
    .eq('slug', slug)
    .maybeSingle();
  return data as unknown as AuthorProfile | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = await getAuthor(slug);
  return { title: author ? author.full_name : 'Auteur' };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const author = await getAuthor(slug);
  if (!author) notFound();

  const supabase = await createClient();
  const { data } = await supabase
    .from('publications')
    .select(
      'id, title, slug, abstract, type, year, view_count, download_count, status, ' +
        'universities ( name, acronym ), profiles!publications_owner_id_fkey ( full_name, slug )',
    )
    .eq('owner_id', author.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const publications = (data ?? []) as unknown as PublicationWithRelations[];
  const uni = author.universities?.name;

  return (
    <div className="space-y-6 py-4">
      <header>
        <h1 className="text-2xl font-bold text-ink">{author.full_name}</h1>
        {uni && <p className="text-stone">{uni}</p>}
        {author.bio && <p className="mt-2 max-w-2xl text-ink">{author.bio}</p>}
      </header>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">{dict.home.recent}</h2>
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
