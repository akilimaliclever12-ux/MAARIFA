import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { createClient } from '@/lib/supabase/server';
import { ReportDialog } from '@/components/report-dialog';
import { getSiteUrl } from '@/lib/site-url';
import type { PublicationWithRelations } from '@/types/db';

const SELECT =
  'id, title, slug, abstract, type, year, language, view_count, download_count, status, ' +
  'universities ( name, acronym ), profiles!publications_owner_id_fkey ( full_name, slug )';

async function getPublication(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('publications')
    .select(SELECT)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();
  return data as unknown as PublicationWithRelations | null;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}): Promise<Metadata> {
  const { locale, slug } = await params;
  const pub = await getPublication(slug);
  if (!pub) return { title: 'Introuvable' };
  const siteUrl = getSiteUrl();
  return {
    title: pub.title,
    description: pub.abstract ?? undefined,
    openGraph: {
      title: pub.title,
      description: pub.abstract ?? undefined,
      type: 'article',
      url: `${siteUrl}/${locale}/publications/${pub.slug}`,
      siteName: 'Maarifa',
    },
  };
}

export default async function PublicationDetailPage({
  params,
}: {
  params: Promise<{ locale: string; slug: string }>;
}) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const pub = await getPublication(slug);
  if (!pub) notFound();

  const uni = pub.universities?.name;
  const author = pub.profiles?.full_name;

  const siteUrl = getSiteUrl();
  const shareUrl = `${siteUrl}/${locale}/publications/${pub.slug}`;
  const waHref = `https://wa.me/?text=${encodeURIComponent(`${pub.title} — ${shareUrl}`)}`;

  return (
    <article className="mx-auto max-w-3xl space-y-6 py-4">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs text-stone">
          <span className="rounded bg-mist px-2 py-0.5 capitalize">
            {pub.type.replace('_', ' ')}
          </span>
          {pub.year && <span>{pub.year}</span>}
          {uni && <span>· {uni}</span>}
        </div>
        <h1 className="text-2xl font-bold text-ink">{pub.title}</h1>
        {author && (
          <p className="text-stone">
            {dict.publication.by} {author}
          </p>
        )}
      </header>

      {pub.abstract && (
        <section>
          <h2 className="mb-1 text-sm font-semibold uppercase tracking-wide text-stone">
            {dict.publication.abstract}
          </h2>
          <p className="whitespace-pre-line text-ink">{pub.abstract}</p>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        {/* Plain anchors → no JS needed (low-bandwidth friendly). */}
        <a
          href={`/api/telecharger/${pub.id}`}
          className="rounded-md bg-lake px-4 py-2 font-medium text-white hover:bg-lake-dark"
        >
          {dict.publication.download}
        </a>
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-forest px-4 py-2 font-medium text-white hover:brightness-95"
        >
          {dict.publication.share}
        </a>
      </div>

      <p className="text-xs text-stone">
        {pub.view_count} {dict.publication.views} · {pub.download_count}{' '}
        {dict.publication.downloads}
      </p>

      <div className="border-t border-stone/10 pt-4">
        <ReportDialog publicationId={pub.id} dict={dict} />
      </div>
    </article>
  );
}
