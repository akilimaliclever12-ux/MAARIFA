'use client';

import { useState } from 'react';
import { createReport } from '@/app/actions/reports';
import type { Dictionary } from '@/i18n/dictionaries';

const REASONS = ['plagiat', 'contenu_inapproprie', 'droit_auteur', 'spam', 'autre'] as const;

export function ReportDialog({
  publicationId,
  dict,
}: {
  publicationId: string;
  dict: Dictionary;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState<(typeof REASONS)[number]>('plagiat');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const res = await createReport({ publicationId, reason, details });
    setBusy(false);
    if (res.ok) setDone(true);
    else setError(dict.report.error);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm text-stone underline hover:text-clay"
      >
        {dict.report.button}
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-stone/20 bg-white p-4">
      {done ? (
        <p className="text-sm text-forest">{dict.report.success}</p>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          <p className="font-medium text-ink">{dict.report.title}</p>
          <label className="block">
            <span className="mb-1 block text-sm text-stone">{dict.report.reasonLabel}</span>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value as typeof reason)}
              className="w-full rounded-md border border-stone/30 px-3 py-2 text-sm outline-none focus:border-lake"
            >
              {REASONS.map((r) => (
                <option key={r} value={r}>
                  {dict.report[r]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-sm text-stone">{dict.report.detailsLabel}</span>
            <textarea
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              rows={2}
              className="w-full rounded-md border border-stone/30 px-3 py-2 text-sm outline-none focus:border-lake"
            />
          </label>
          {error && <p className="text-sm text-clay">{error}</p>}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={busy}
              className="rounded-md bg-clay px-3 py-1.5 text-sm font-medium text-white hover:brightness-95 disabled:opacity-60"
            >
              {dict.report.submit}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md border border-stone/30 px-3 py-1.5 text-sm hover:bg-mist"
            >
              {dict.report.cancel}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
