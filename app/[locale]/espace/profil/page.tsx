import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { ProfileForm } from '@/components/profile/profile-form';

export const metadata: Metadata = { title: 'Profil' };

export default async function ProfileEditPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/connexion`);

  const supabase = await createClient();
  const [{ data: profile }, { data: unis }] = await Promise.all([
    supabase.from('profiles').select('full_name, bio, university_id, avatar_url').eq('id', user.id).single(),
    supabase.from('universities').select('id, name, acronym').order('name'),
  ]);

  const universities = (unis ?? []).map((u) => ({
    id: u.id,
    label: u.acronym ? `${u.name} (${u.acronym})` : u.name,
  }));

  return (
    <div className="mx-auto max-w-xl py-4">
      <Link href={`/${locale}/espace`} className="text-sm text-lake hover:underline">
        ← {dict.common.back}
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-ink">{dict.profileEdit.title}</h1>
      <ProfileForm
        dict={dict}
        userId={user.id}
        initial={{
          fullName: profile?.full_name ?? user.fullName,
          bio: profile?.bio ?? '',
          universityId: profile?.university_id ?? '',
          avatarUrl: profile?.avatar_url ?? '',
        }}
        universities={universities}
      />
    </div>
  );
}
