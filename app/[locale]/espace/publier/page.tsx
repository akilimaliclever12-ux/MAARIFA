import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { PublishForm } from '@/components/publish/publish-form';

export const metadata: Metadata = { title: 'Publier' };

export default async function PublishPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/connexion`);

  const supabase = await createClient();
  const [{ data: unis }, { data: cats }] = await Promise.all([
    supabase.from('universities').select('id, name, acronym').order('name'),
    supabase.from('categories').select('id, name').order('name'),
  ]);

  const universities = (unis ?? []).map((u) => ({
    id: u.id,
    label: u.acronym ? `${u.name} (${u.acronym})` : u.name,
  }));
  const categories = (cats ?? []).map((c) => ({ id: c.id, label: c.name }));

  return (
    <div className="mx-auto max-w-2xl py-4">
      <Link href={`/${locale}/espace`} className="text-sm text-lake hover:underline">
        ← {dict.common.back}
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-ink">{dict.publish.title}</h1>
      <PublishForm
        locale={locale}
        dict={dict}
        userId={user.id}
        universities={universities}
        categories={categories}
      />
    </div>
  );
}
