import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { PublicationCard } from '@/components/publication-card';
import { FollowButton } from '@/components/social/follow-button';
import type { PublicationWithRelations } from '@/types/db';

interface AuthorProfile {
  id: string;
  full_name: string;
  slug: string;
  bio: string | null;
  avatar_url: string | null;
  universities: { name: string; acronym: string | null } | null;
}

async function getAuthor(slug: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, full_name, slug, bio, avatar_url, universities ( name, acronym )')
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
      'id, title, slug, abstract, thumbnail_url, type, year, view_count, download_count, status, ' +
        'universities ( name, acronym ), profiles!publications_owner_id_fkey ( full_name, slug )',
    )
    .eq('owner_id', author.id)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  const publications = (data ?? []) as unknown as PublicationWithRelations[];
  const uni = author.universities?.name;

  // Follow state + follower count.
  const user = await getCurrentUser();
  const { count: followerCount } = await supabase
    .from('follows')
    .select('follower_id', { count: 'exact', head: true })
    .eq('following_id', author.id);

  let isFollowing = false;
  if (user && user.id !== author.id) {
    const { data: f } = await supabase
      .from('follows')
      .select('follower_id')
      .eq('follower_id', user.id)
      .eq('following_id', author.id)
      .maybeSingle();
    isFollowing = !!f;
  }
  const isOwnProfile = user?.id === author.id;

  return (
    <div className="space-y-6 py-4">
      <header className="flex flex-wrap items-start gap-4">
        <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-full border border-stone/20 bg-mist">
          {author.avatar_url ? (
            <Image src={author.avatar_url} alt={author.full_name} fill className="object-cover" sizes="80px" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-2xl font-bold text-stone">
              {author.full_name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold text-ink">{author.full_name}</h1>
          {uni && <p className="text-stone">{uni}</p>}
          {author.bio && <p className="mt-2 max-w-2xl text-ink">{author.bio}</p>}
          <div className="mt-3">
            {isOwnProfile ? (
              <span className="text-sm text-stone">
                {followerCount ?? 0} {dict.social.followers}
              </span>
            ) : (
              <FollowButton
                targetProfileId={author.id}
                initialFollowing={isFollowing}
                initialCount={followerCount ?? 0}
                isAuthed={!!user}
                locale={locale}
                dict={dict}
              />
            )}
          </div>
        </div>
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
