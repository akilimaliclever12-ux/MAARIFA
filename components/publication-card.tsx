import Link from 'next/link';
import Image from 'next/image';
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
      className="group block overflow-hidden rounded-lg border border-stone/15 bg-white transition-colors hover:border-lake"
    >
      {/* First-page preview (real thumbnail) or a branded placeholder. */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-mist">
        {publication.thumbnail_url ? (
          <Image
            src={publication.thumbnail_url}
            alt={publication.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover object-top"
          />
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-2 p-4">
            <Image
              src="/maarifa_logo.png"
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 opacity-30"
            />
            <span className="rounded bg-white/70 px-2 py-0.5 text-xs capitalize text-stone">
              {publication.type.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
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

        <div className="mt-3 flex gap-4 text-xs text-stone">
          <span>
            {publication.view_count} {dict.publication.views}
          </span>
          <span>
            {publication.download_count} {dict.publication.downloads}
          </span>
        </div>
      </div>
    </Link>
  );
}
