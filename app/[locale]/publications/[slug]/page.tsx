import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, isStaffRole } from '@/lib/auth/session';
import { ReportDialog } from '@/components/report-dialog';
import { LikeButton } from '@/components/social/like-button';
import { Comments, type CommentItem } from '@/components/social/comments';
import { ViewCounter } from '@/components/view-counter';
import { RegenerateThumbnail } from '@/components/regenerate-thumbnail';
import { getSiteUrl } from '@/lib/site-url';
import type { PublicationWithRelations } from '@/types/db';

interface CommentRow {
  id: string;
  body: string;
  created_at: string;
  author_id: string;
  profiles: { full_name: string; slug: string } | null;
}

const SELECT =
  'id, owner_id, title, slug, abstract, abstract_align, thumbnail_url, type, year, language, view_count, download_count, status, ' +
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

  // Social data: current user, like state/count, comments.
  const supabase = await createClient();
  const user = await getCurrentUser();
  const isStaff = !!user && isStaffRole(user.role);

  const { count: likeCount } = await supabase
    .from('likes')
    .select('user_id', { count: 'exact', head: true })
    .eq('publication_id', pub.id);

  let liked = false;
  if (user) {
    const { data } = await supabase
      .from('likes')
      .select('user_id')
      .eq('publication_id', pub.id)
      .eq('user_id', user.id)
      .maybeSingle();
    liked = !!data;
  }

  const { data: rawComments } = await supabase
    .from('comments')
    .select('id, body, created_at, author_id, profiles!comments_author_id_fkey ( full_name, slug )')
    .eq('publication_id', pub.id)
    .order('created_at', { ascending: true });

  const comments: CommentItem[] = ((rawComments ?? []) as unknown as CommentRow[]).map((c) => ({
    id: c.id,
    body: c.body,
    created_at: c.created_at,
    authorName: c.profiles?.full_name ?? '—',
    authorSlug: c.profiles?.slug ?? '',
    canDelete: !!user && (user.id === c.author_id || isStaff),
  }));

  return (
    <article className="mx-auto max-w-3xl space-y-6 py-4">
      <ViewCounter publicationId={pub.id} />
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
          <p className="whitespace-pre-line text-ink" style={{ textAlign: pub.abstract_align }}>
            {pub.abstract}
          </p>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        {/* Plain anchors → no JS needed (low-bandwidth friendly). Download is
            restricted to logged-in users; logged-out visitors go to login. */}
        {user ? (
          <>
            <a
              href={`/api/telecharger/${pub.id}?view=1`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-lake px-4 py-2 font-medium text-white hover:bg-lake-dark"
            >
              {dict.publication.read}
            </a>
            <a
              href={`/api/telecharger/${pub.id}`}
              className="rounded-md border border-lake px-4 py-2 font-medium text-lake hover:bg-lake/5"
            >
              {dict.publication.download}
            </a>
          </>
        ) : (
          <a
            href={`/${locale}/connexion`}
            className="rounded-md bg-lake px-4 py-2 font-medium text-white hover:bg-lake-dark"
          >
            {dict.publication.loginToDownload}
          </a>
        )}
        <a
          href={waHref}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-forest px-4 py-2 font-medium text-white hover:brightness-95"
        >
          {dict.publication.share}
        </a>
        <LikeButton
          publicationId={pub.id}
          initialCount={likeCount ?? 0}
          initialLiked={liked}
          isAuthed={!!user}
          locale={locale}
          dict={dict}
        />
      </div>

      <p className="text-xs text-stone">
        {pub.view_count} {dict.publication.views} · {pub.download_count}{' '}
        {dict.publication.downloads}
      </p>

      {user && (user.id === pub.owner_id || isStaff) && !pub.thumbnail_url && (
        <RegenerateThumbnail publicationId={pub.id} userId={user.id} dict={dict} />
      )}

      <div className="border-t border-stone/10 pt-6">
        <Comments publicationId={pub.id} comments={comments} isAuthed={!!user} locale={locale} dict={dict} />
      </div>

      <div className="border-t border-stone/10 pt-4">
        <ReportDialog publicationId={pub.id} dict={dict} />
      </div>
    </article>
  );
}
