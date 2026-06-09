import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { getDictionary, type Dictionary } from '@/i18n/dictionaries';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, isStaffRole } from '@/lib/auth/session';
import { StatusBadge } from '@/components/status-badge';
import { ReportActions } from '@/components/admin/report-actions';
import type { PublicationStatus, PublicationType } from '@/types/db';

export const metadata: Metadata = { title: 'Admin' };
export const dynamic = 'force-dynamic';

interface LatestRow {
  id: string;
  title: string;
  slug: string;
  type: PublicationType;
  status: PublicationStatus;
  profiles: { full_name: string } | null;
}

interface ReportRow {
  id: string;
  reason: string;
  details: string | null;
  created_at: string;
  publications: { title: string; slug: string } | null;
}

export default async function AdminPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/connexion`);
  if (!isStaffRole(user.role)) redirect(`/${locale}/espace`);

  const supabase = await createClient();
  const countOpts = { count: 'exact' as const, head: true };

  const [published, pending, users, downloads, openReports, latest, reports] = await Promise.all([
    supabase.from('publications').select('id', countOpts).eq('status', 'published'),
    supabase.from('publications').select('id', countOpts).eq('status', 'pending'),
    supabase.from('profiles').select('id', countOpts),
    supabase.from('downloads').select('id', countOpts),
    supabase.from('reports').select('id', countOpts).eq('status', 'open'),
    supabase
      .from('publications')
      .select('id, title, slug, type, status, profiles!publications_owner_id_fkey ( full_name )')
      .order('created_at', { ascending: false })
      .limit(8),
    supabase
      .from('reports')
      .select('id, reason, details, created_at, publications ( title, slug )')
      .eq('status', 'open')
      .order('created_at', { ascending: true })
      .limit(20),
  ]);

  const latestRows = (latest.data ?? []) as unknown as LatestRow[];
  const reportRows = (reports.data ?? []) as unknown as ReportRow[];

  return (
    <div className="space-y-8 py-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-ink">{dict.admin.title}</h1>
        <Link
          href={`/${locale}/admin/moderation`}
          className="rounded-md border border-gold bg-gold/10 px-3 py-2 text-sm font-medium text-[#8a5a00] hover:bg-gold/20"
        >
          {dict.admin.openModeration}
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <Stat label={dict.admin.published} value={published.count ?? 0} />
        <Stat label={dict.admin.pending} value={pending.count ?? 0} highlight={!!pending.count} />
        <Stat label={dict.admin.users} value={users.count ?? 0} />
        <Stat label={dict.admin.downloads} value={downloads.count ?? 0} />
        <Stat label={dict.admin.openReports} value={openReports.count ?? 0} highlight={!!openReports.count} />
      </div>

      {/* Latest submissions */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">{dict.admin.latest}</h2>
        <ul className="divide-y divide-stone/10 rounded-lg border border-stone/15 bg-white">
          {latestRows.length === 0 ? (
            <li className="p-4 text-center text-stone">—</li>
          ) : (
            latestRows.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-3 p-3">
                <div className="min-w-0">
                  <p className="truncate font-medium text-ink">{p.title}</p>
                  <p className="text-xs text-stone">
                    {p.profiles?.full_name ?? '—'} · <span className="capitalize">{p.type.replace('_', ' ')}</span>
                  </p>
                </div>
                <StatusBadge status={p.status} dict={dict} />
              </li>
            ))
          )}
        </ul>
      </section>

      {/* Open reports */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-ink">{dict.admin.reports}</h2>
        {reportRows.length === 0 ? (
          <p className="rounded-lg border border-dashed border-stone/30 bg-white p-6 text-center text-stone">
            {dict.admin.noReports}
          </p>
        ) : (
          <ul className="space-y-3">
            {reportRows.map((r) => (
              <li key={r.id} className="rounded-lg border border-stone/15 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className="inline-block rounded bg-clay/15 px-2 py-0.5 text-xs font-medium text-clay">
                      {reasonLabel(r.reason, dict)}
                    </span>
                    {r.publications ? (
                      <Link
                        href={`/${locale}/publications/${r.publications.slug}`}
                        className="ml-2 font-medium text-lake hover:underline"
                      >
                        {r.publications.title}
                      </Link>
                    ) : (
                      <span className="ml-2 text-stone">{dict.admin.viewedPublication}</span>
                    )}
                    {r.details && <p className="mt-1 text-sm text-stone">{r.details}</p>}
                  </div>
                  <ReportActions reportId={r.id} dict={dict} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`rounded-lg border bg-white p-4 ${highlight ? 'border-gold' : 'border-stone/15'}`}>
      <p className="text-2xl font-bold text-ink">{value}</p>
      <p className="text-xs text-stone">{label}</p>
    </div>
  );
}

function reasonLabel(reason: string, dict: Dictionary): string {
  const map = dict.report as Record<string, string>;
  return map[reason] ?? reason;
}
