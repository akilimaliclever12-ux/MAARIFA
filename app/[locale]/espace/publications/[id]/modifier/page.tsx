import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { createClient } from '@/lib/supabase/server';
import { getCurrentUser } from '@/lib/auth/session';
import { EditPublicationForm, type EditInitial } from '@/components/publish/edit-publication-form';
import { PUBLICATION_TYPES, LANGUAGES, type Alignment } from '@/lib/validation/publication';

export const metadata: Metadata = { title: 'Modifier' };

interface EditRow {
  id: string;
  owner_id: string;
  status: string;
  title: string;
  abstract: string | null;
  abstract_align: Alignment;
  type: (typeof PUBLICATION_TYPES)[number];
  university_id: string | null;
  category_id: string | null;
  year: number | null;
  language: (typeof LANGUAGES)[number];
  publication_files: { file_name: string; is_primary: boolean }[] | null;
  publication_keywords: { keywords: { name: string } | null }[] | null;
  publication_authors: { author_name: string; position: number }[] | null;
}

export default async function EditPublicationPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const user = await getCurrentUser();
  if (!user) redirect(`/${locale}/connexion`);

  const supabase = await createClient();
  const { data } = await supabase
    .from('publications')
    .select(
      'id, owner_id, status, title, abstract, abstract_align, type, university_id, category_id, year, language, ' +
        'publication_files ( file_name, is_primary ), ' +
        'publication_keywords ( keywords ( name ) ), ' +
        'publication_authors ( author_name, position )',
    )
    .eq('id', id)
    .maybeSingle();

  const pub = data as unknown as EditRow | null;

  // Only the owner may edit, and only drafts / rejected publications.
  if (!pub || pub.owner_id !== user.id || !['draft', 'rejected'].includes(pub.status)) {
    redirect(`/${locale}/espace`);
  }

  const [{ data: unis }, { data: cats }] = await Promise.all([
    supabase.from('universities').select('id, name, acronym').order('name'),
    supabase.from('categories').select('id, name').order('name'),
  ]);
  const universities = (unis ?? []).map((u) => ({
    id: u.id,
    label: u.acronym ? `${u.name} (${u.acronym})` : u.name,
  }));
  const categories = (cats ?? []).map((c) => ({ id: c.id, label: c.name }));

  const keywords = (pub.publication_keywords ?? [])
    .map((pk) => pk.keywords?.name)
    .filter(Boolean)
    .join(', ');
  const coAuthors = (pub.publication_authors ?? [])
    .filter((a) => a.position > 1)
    .sort((a, b) => a.position - b.position)
    .map((a) => a.author_name)
    .join('\n');
  const primaryFile =
    pub.publication_files?.find((f) => f.is_primary) ?? pub.publication_files?.[0];

  const initial: EditInitial = {
    id: pub.id,
    title: pub.title,
    abstract: pub.abstract ?? '',
    abstractAlign: pub.abstract_align ?? 'left',
    type: pub.type,
    universityId: pub.university_id ?? '',
    categoryId: pub.category_id ?? '',
    year: pub.year ? String(pub.year) : '',
    language: pub.language ?? 'fr',
    keywords,
    coAuthors,
    currentFileName: primaryFile?.file_name ?? '—',
  };

  return (
    <div className="mx-auto max-w-2xl py-4">
      <Link href={`/${locale}/espace`} className="text-sm text-lake hover:underline">
        ← {dict.common.back}
      </Link>
      <h1 className="mb-6 mt-2 text-2xl font-bold text-ink">{dict.publish.editTitle}</h1>
      <EditPublicationForm
        locale={locale}
        dict={dict}
        userId={user.id}
        universities={universities}
        categories={categories}
        initial={initial}
      />
    </div>
  );
}
