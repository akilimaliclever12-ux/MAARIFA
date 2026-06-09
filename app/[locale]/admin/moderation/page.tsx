import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser, isStaffRole } from '@/lib/auth/session';
import { ModerationItem, type ModerationEntry } from '@/components/admin/moderation-item';

export const metadata: Metadata = { title: 'Modération' };

export const dynamic = 'force-dynamic';

interface PendingRow {
  id: string;
  title: string;
  type: string;
  abstract: string | null;
  universities: { name: string; acronym: string | null } | null;
  profiles: { full_name: string } | null;
  publication_files: { storage_path: string; is_primary: boolean }[] | null;
}

export default async function ModerationPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/connexion`);
  if (!isStaffRole(user.role)) redirect(`/${locale}/espace`);

  const supabase = await createClient();
  const { data } = await supabase
    .from('publications')
    .select(
      'id, title, type, abstract, ' +
        'universities ( name, acronym ), ' +
        'profiles!publications_owner_id_fkey ( full_name ), ' +
        'publication_files ( storage_path, is_primary )',
    )
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  const rows = (data ?? []) as unknown as PendingRow[];

  const entries: ModerationEntry[] = rows.map((r) => {
    const primary = r.publication_files?.find((f) => f.is_primary) ?? r.publication_files?.[0];
    return {
      id: r.id,
      title: r.title,
      type: r.type,
      abstract: r.abstract,
      author: r.profiles?.full_name ?? null,
      university: r.universities?.acronym ?? r.universities?.name ?? null,
      storagePath: primary?.storage_path ?? null,
    };
  });

  return (
    <div className="space-y-6 py-4">
      <div>
        <Link href={`/${locale}/espace`} className="text-sm text-lake hover:underline">
          ← {dict.common.back}
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-ink">{dict.moderation.title}</h1>
      </div>

      {entries.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone/30 bg-white p-8 text-center text-stone">
          {dict.moderation.empty}
        </p>
      ) : (
        <div className="space-y-4">
          {entries.map((e) => (
            <ModerationItem key={e.id} entry={e} dict={dict} />
          ))}
        </div>
      )}
    </div>
  );
}
