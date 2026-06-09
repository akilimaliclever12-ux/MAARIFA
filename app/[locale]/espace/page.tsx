import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, isStaffRole } from '@/lib/auth/session';
import { StatusBadge } from '@/components/status-badge';
import type { PublicationStatus, PublicationType } from '@/types/db';

interface MyPub {
  id: string;
  title: string;
  slug: string;
  type: PublicationType;
  status: PublicationStatus;
  created_at: string;
}

export default async function DashboardPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/connexion`);

  const supabase = await createClient();
  const { data } = await supabase
    .from('publications')
    .select('id, title, slug, type, status, created_at')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  const pubs = (data ?? []) as MyPub[];

  return (
    <div className="space-y-6 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">{dict.nav.dashboard}</h1>
          <p className="mt-1 text-stone">
            {user.fullName} — <span className="capitalize">{user.role}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/${locale}/espace/publier`}
            className="rounded-md bg-lake px-3 py-2 text-sm font-medium text-white hover:bg-lake-dark"
          >
            {dict.dashboard.newPublication}
          </Link>
          <Link
            href={`/${locale}/espace/profil`}
            className="rounded-md border border-stone/30 px-3 py-2 text-sm hover:bg-mist"
          >
            {dict.dashboard.editProfile}
          </Link>
          {isStaffRole(user.role) && (
            <Link
              href={`/${locale}/admin/moderation`}
              className="rounded-md border border-gold bg-gold/10 px-3 py-2 text-sm font-medium text-[#8a5a00] hover:bg-gold/20"
            >
              {dict.dashboard.openModeration}
            </Link>
          )}
        </div>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">{dict.dashboard.myPublications}</h2>
        {pubs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone/30 bg-white p-8 text-center text-stone">
            {dict.dashboard.noPublications}
          </p>
        ) : (
          <ul className="divide-y divide-stone/10 rounded-lg border border-stone/15 bg-white">
            {pubs.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{p.title}</p>
                  <p className="text-xs capitalize text-stone">{p.type.replace('_', ' ')}</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <StatusBadge status={p.status} dict={dict} />
                  {p.status === 'published' && (
                    <Link
                      href={`/${locale}/publications/${p.slug}`}
                      className="text-sm text-lake hover:underline"
                    >
                      {dict.common.viewAll}
                    </Link>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
