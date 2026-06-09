import Link from 'next/link';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';
import type { PublicationWithRelations } from '@/types/db';

export function PublicationCard({
  publication,
  locale,
  dict,
}: {
  publication: PublicationWithRelations;
  locale: Locale;
  dict: Dictionary;
}) {
  const author = publication.profiles?.full_name;
  const uni = publication.universities?.acronym ?? publication.universities?.name;

  return (
    <Link
      href={`/${locale}/publications/${publication.slug}`}
      className="block rounded-lg border border-stone/15 bg-white p-4 transition-colors hover:border-lake"
    >
      <div className="flex items-center gap-2 text-xs text-stone">
        <span className="rounded bg-mist px-2 py-0.5 capitalize">
          {publication.type.replace('_', ' ')}
        </span>
        {publication.year && <span>{publication.year}</span>}
        {uni && <span>· {uni}</span>}
      </div>

      <h3 className="mt-2 line-clamp-2 font-semibold text-ink">{publication.title}</h3>

      {author && (
        <p className="mt-1 text-sm text-stone">
          {dict.publication.by} {author}
        </p>
      )}

      {publication.abstract && (
        <p className="mt-2 line-clamp-2 text-sm text-stone">{publication.abstract}</p>
      )}

      <div className="mt-3 flex gap-4 text-xs text-stone">
        <span>
          {publication.view_count} {dict.publication.views}
        </span>
        <span>
          {publication.download_count} {dict.publication.downloads}
        </span>
      </div>
    </Link>
  );
}
