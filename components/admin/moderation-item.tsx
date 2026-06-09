'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  approvePublication,
  rejectPublication,
  getReviewUrl,
} from '@/app/actions/publications';
import type { Dictionary } from '@/i18n/dictionaries';

export interface ModerationEntry {
  id: string;
  title: string;
  type: string;
  abstract: string | null;
  author: string | null;
  university: string | null;
  storagePath: string | null;
}

export function ModerationItem({ entry, dict }: { entry: ModerationEntry; dict: Dictionary }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  function approve() {
    setError(null);
    startTransition(async () => {
      const res = await approvePublication(entry.id);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  function confirmReject() {
    setError(null);
    startTransition(async () => {
      const res = await rejectPublication(entry.id, reason);
      if (!res.ok) setError(res.error);
      else router.refresh();
    });
  }

  async function openPdf() {
    if (!entry.storagePath) return;
    const res = await getReviewUrl(entry.storagePath);
    if (res.ok && res.url) window.open(res.url, '_blank', 'noopener');
    else setError(res.ok ? 'Lien indisponible.' : res.error);
  }

  return (
    <div className="rounded-lg border border-stone/15 bg-white p-4">
      <div className="flex items-center gap-2 text-xs text-stone">
        <span className="rounded bg-mist px-2 py-0.5 capitalize">{entry.type.replace('_', ' ')}</span>
        {entry.university && <span>· {entry.university}</span>}
      </div>
      <h3 className="mt-2 font-semibold text-ink">{entry.title}</h3>
      {entry.author && <p className="text-sm text-stone">{entry.author}</p>}
      {entry.abstract && <p className="mt-2 line-clamp-3 text-sm text-stone">{entry.abstract}</p>}

      {error && <p className="mt-2 text-sm text-clay">{error}</p>}

      {!rejecting ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {entry.storagePath && (
            <button
              type="button"
              onClick={openPdf}
              className="rounded-md border border-stone/30 px-3 py-1.5 text-sm hover:bg-mist"
            >
              {dict.moderation.viewPdf}
            </button>
          )}
          <button
            type="button"
            onClick={approve}
            disabled={pending}
            className="rounded-md bg-forest px-3 py-1.5 text-sm font-medium text-white hover:brightness-95 disabled:opacity-60"
          >
            {dict.moderation.approve}
          </button>
          <button
            type="button"
            onClick={() => setRejecting(true)}
            disabled={pending}
            className="rounded-md border border-clay px-3 py-1.5 text-sm font-medium text-clay hover:bg-clay/5 disabled:opacity-60"
          >
            {dict.moderation.reject}
          </button>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={dict.moderation.reasonPlaceholder}
            rows={2}
            className="w-full rounded-md border border-stone/30 px-3 py-2 text-sm outline-none focus:border-lake"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={confirmReject}
              disabled={pending}
              className="rounded-md bg-clay px-3 py-1.5 text-sm font-medium text-white hover:brightness-95 disabled:opacity-60"
            >
              {dict.moderation.confirmReject}
            </button>
            <button
              type="button"
              onClick={() => {
                setRejecting(false);
                setReason('');
              }}
              className="rounded-md border border-stone/30 px-3 py-1.5 text-sm hover:bg-mist"
            >
              {dict.moderation.cancel}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
