'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { updateReportStatus } from '@/app/actions/reports';
import type { Dictionary } from '@/i18n/dictionaries';

export function ReportActions({ reportId, dict }: { reportId: string; dict: Dictionary }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function act(status: 'actioned' | 'dismissed') {
    startTransition(async () => {
      await updateReportStatus(reportId, status);
      router.refresh();
    });
  }

  return (
    <div className="flex gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => act('actioned')}
        className="rounded-md bg-forest px-3 py-1.5 text-sm font-medium text-white hover:brightness-95 disabled:opacity-60"
      >
        {dict.admin.resolve}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() => act('dismissed')}
        className="rounded-md border border-stone/30 px-3 py-1.5 text-sm hover:bg-mist disabled:opacity-60"
      >
        {dict.admin.dismiss}
      </button>
    </div>
  );
}
