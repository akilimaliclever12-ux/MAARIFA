import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isLocale, type Locale } from '@/i18n/config';
import { getDictionary, type Dictionary } from '@/i18n/dictionaries';
import { createClient } from '@/lib/supabase/server';
import { unaccent } from '@/lib/utils/text';
import { PublicationCard } from '@/components/publication-card';
import { PUBLICATION_TYPES } from '@/lib/validation/publication';
import type { PublicationWithRelations } from '@/types/db';

export const metadata: Metadata = { title: 'Publications' };

const PAGE_SIZE = 24;
const SELECT =
  'id, title, slug, abstract, type, year, view_count, download_count, status, ' +
  'universities ( name, acronym ), profiles!publications_owner_id_fkey ( full_name, slug )';

type SearchParams = Record<string, string | string[] | undefined>;

function one(v: string | string[] | undefined): string {
  return (Array.isArray(v) ? v[0] : v ?? '').trim();
}

export default async function PublicationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  const sp = await searchParams;
  const q = one(sp.q);
  const type = one(sp.type);
  const universityId = one(sp.university);
  const categoryId = one(sp.category);
  const year = one(sp.year);
  const page = Math.max(1, Number(one(sp.page)) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const supabase = await createClient();

  // Reference data for the filter selects.
  const [{ data: unis }, { data: cats }] = await Promise.all([
    supabase.from('universities').select('id, name, acronym').order('name'),
    supabase.from('categories').select('id, name').order('name'),
  ]);

  // Build the filtered, paginated query.
  let query = supabase
    .from('publications')
    .select(SELECT, { count: 'exact' })
    .eq('status', 'published');

  if (q) query = query.textSearch('search_vector', unaccent(q), { type: 'plain', config: 'french' });
  if (type) query = query.eq('type', type);
  if (universityId) query = query.eq('university_id', universityId);
  if (categoryId) query = query.eq('category_id', categoryId);
  if (year && /^\d{4}$/.test(year)) query = query.eq('year', Number(year));

  const { data, count } = await query
    .order('published_at', { ascending: false })
    .range(from, to);

  const publications = (data ?? []) as unknown as PublicationWithRelations[];
  const total = count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const universities = (unis ?? []).map((u) => ({
    id: u.id,
    label: u.acronym ? `${u.name} (${u.acronym})` : u.name,
  }));
  const categories = (cats ?? []).map((c) => ({ id: c.id, label: c.name }));

  const resultsLabel =
    total === 1 ? dict.browse.resultsOne : dict.browse.resultsMany.replace('{count}', String(total));

  return (
    <div className="space-y-6 py-4">
      <h1 className="text-2xl font-bold text-ink">{dict.nav.browse}</h1>

      {/* Native GET form — works without JS (low-bandwidth friendly). */}
      <form method="get" className="grid gap-3 rounded-lg border border-stone/15 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder={dict.browse.searchPlaceholder}
          className={`${inputClass} sm:col-span-2 lg:col-span-3`}
        />
        <select name="type" defaultValue={type} className={inputClass}>
          <option value="">{dict.browse.allTypes}</option>
          {PUBLICATION_TYPES.map((t) => (
            <option key={t} value={t}>
              {t.replace('_', ' ')}
            </option>
          ))}
        </select>
        <select name="university" defaultValue={universityId} className={inputClass}>
          <option value="">{dict.browse.allUniversities}</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </select>
        <select name="category" defaultValue={categoryId} className={inputClass}>
          <option value="">{dict.browse.allCategories}</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="number"
          name="year"
          defaultValue={year}
          placeholder={dict.browse.yearPlaceholder}
          min={1950}
          max={2100}
          className={inputClass}
        />
        <div className="flex gap-2 sm:col-span-2 lg:col-span-1">
          <button
            type="submit"
            className="rounded-md bg-lake px-4 py-2 font-medium text-white hover:bg-lake-dark"
          >
            {dict.browse.apply}
          </button>
          <Link
            href={`/${locale}/publications`}
            className="rounded-md border border-stone/30 px-4 py-2 text-ink hover:bg-mist"
          >
            {dict.browse.reset}
          </Link>
        </div>
      </form>

      <p className="text-sm text-stone">{resultsLabel}</p>

      {publications.length === 0 ? (
        <p className="rounded-lg border border-dashed border-stone/30 bg-white p-8 text-center text-stone">
          {dict.browse.noResults}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {publications.map((p) => (
            <PublicationCard key={p.id} publication={p} locale={locale} dict={dict} />
          ))}
        </div>
      )}

      {totalPages > 1 && (
        <Pagination
          locale={locale}
          dict={dict}
          page={page}
          totalPages={totalPages}
          params={{ q, type, university: universityId, category: categoryId, year }}
        />
      )}
    </div>
  );
}

const inputClass =
  'w-full rounded-md border border-stone/30 px-3 py-2 outline-none focus:border-lake focus:ring-1 focus:ring-lake';

function buildQuery(params: Record<string, string>, page: number): string {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v) usp.set(k, v);
  if (page > 1) usp.set('page', String(page));
  const s = usp.toString();
  return s ? `?${s}` : '';
}

function Pagination({
  locale,
  dict,
  page,
  totalPages,
  params,
}: {
  locale: Locale;
  dict: Dictionary;
  page: number;
  totalPages: number;
  params: Record<string, string>;
}) {
  const base = `/${locale}/publications`;
  return (
    <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Pagination">
      {page > 1 ? (
        <Link href={`${base}${buildQuery(params, page - 1)}`} className="rounded-md border border-stone/30 px-3 py-2 hover:bg-mist">
          ← {dict.browse.previous}
        </Link>
      ) : (
        <span />
      )}
      <span className="text-stone">
        {page} / {totalPages}
      </span>
      {page < totalPages ? (
        <Link href={`${base}${buildQuery(params, page + 1)}`} className="rounded-md border border-stone/30 px-3 py-2 hover:bg-mist">
          {dict.browse.next} →
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}
