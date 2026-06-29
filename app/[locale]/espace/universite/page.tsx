import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { LogoUploader } from '@/components/university/logo-uploader';

export const metadata: Metadata = { title: 'Espace université' };
export const dynamic = 'force-dynamic';

interface ManagedUni {
  id: string;
  name: string;
  acronym: string | null;
  slug: string;
  logo_url: string | null;
  city: string | null;
}

interface WorkRow {
  id: string;
  title: string;
  slug: string;
  view_count: number;
  download_count: number;
}

export default async function UniversityDashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/connexion`);

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from('university_managers')
    .select('universities ( id, name, acronym, slug, logo_url, city )')
    .eq('user_id', user.id);

  const universities = ((rows ?? []) as unknown as { universities: ManagedUni | null }[])
    .map((r) => r.universities)
    .filter((u): u is ManagedUni => !!u);

  // Stats per managed university (published works only).
  const blocks = await Promise.all(
    universities.map(async (uni) => {
      const { data } = await supabase
        .from('publications')
        .select('id, title, slug, view_count, download_count')
        .eq('university_id', uni.id)
        .eq('status', 'published')
        .order('published_at', { ascending: false });
      const works = (data ?? []) as WorkRow[];
      const views = works.reduce((s, w) => s + (w.view_count ?? 0), 0);
      const downloads = works.reduce((s, w) => s + (w.download_count ?? 0), 0);
      return { uni, works, views, downloads };
    }),
  );

  return (
    <div className="space-y-8 py-4">
      <h1 className="text-2xl font-bold text-ink">{dict.uniDash.title}</h1>

      {blocks.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone/30 bg-white p-8 text-center text-stone">
          {dict.uniDash.none}
        </p>
      ) : (
        blocks.map(({ uni, works, views, downloads }) => (
          <section key={uni.id} className="space-y-4 rounded-xl border border-stone/15 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-ink">{uni.name}</h2>
                {uni.city && <p className="text-sm text-stone">{uni.city}</p>}
              </div>
              <Link
                href={`/${locale}/universites/${uni.slug}`}
                className="text-sm text-lake hover:underline"
              >
                {dict.uniDash.viewPublicSpace} →
              </Link>
            </div>

            <LogoUploader
              universityId={uni.id}
              userId={user.id}
              currentLogoUrl={uni.logo_url}
              dict={dict}
            />

            <div className="grid grid-cols-3 gap-3">
              <Stat label={dict.uniDash.works} value={works.length} />
              <Stat label={dict.uniDash.views} value={views} />
              <Stat label={dict.uniDash.downloads} value={downloads} />
            </div>

            <div>
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-stone">
                {dict.uniDash.recent}
              </h3>
              {works.length === 0 ? (
                <p className="text-sm text-stone">{dict.universities.noWorks}</p>
              ) : (
                <ul className="divide-y divide-stone/10 rounded-lg border border-stone/15">
                  {works.slice(0, 10).map((w) => (
                    <li key={w.id} className="flex items-center justify-between gap-3 p-3">
                      <Link
                        href={`/${locale}/publications/${w.slug}`}
                        className="min-w-0 truncate text-sm font-medium text-ink hover:text-lake"
                      >
                        {w.title}
                      </Link>
                      <span className="shrink-0 text-xs text-stone">
                        {w.view_count} {dict.publication.views} · {w.download_count}{' '}
                        {dict.publication.downloads}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        ))
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-stone/15 bg-mist/40 p-3 text-center">
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-stone">{label}</p>
    </div>
  );
}
