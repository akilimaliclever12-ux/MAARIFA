import type { Dictionary } from '@/i18n/dictionaries';
import type { PublicationStatus } from '@/types/db';

const styles: Record<PublicationStatus, string> = {
  draft: 'bg-stone/15 text-stone',
  pending: 'bg-gold/20 text-[#8a5a00]',
  published: 'bg-forest/15 text-forest',
  rejected: 'bg-clay/15 text-clay',
};

export function StatusBadge({
  status,
  dict,
}: {
  status: PublicationStatus;
  dict: Dictionary;
}) {
  return (
    <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
      {dict.status[status]}
    </span>
  );
}
