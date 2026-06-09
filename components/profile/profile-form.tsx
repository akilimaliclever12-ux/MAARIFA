'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateProfile } from '@/app/actions/profile';
import type { Dictionary } from '@/i18n/dictionaries';

type Option = { id: string; label: string };

export function ProfileForm({
  dict,
  initial,
  universities,
}: {
  dict: Dictionary;
  initial: { fullName: string; bio: string; universityId: string };
  universities: Option[];
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial.fullName);
  const [bio, setBio] = useState(initial.bio);
  const [universityId, setUniversityId] = useState(initial.universityId);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setBusy(true);

    const res = await updateProfile({
      fullName,
      bio,
      universityId: universityId || undefined,
    });

    setBusy(false);
    if (!res.ok) setError(res.error);
    else {
      setOk(true);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">{dict.auth.fullName}</span>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          required
          minLength={2}
          className={inputClass}
        />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">Bio</span>
        <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} className={inputClass} />
      </label>

      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">{dict.publish.universityLabel}</span>
        <select value={universityId} onChange={(e) => setUniversityId(e.target.value)} className={inputClass}>
          <option value="">{dict.publish.none}</option>
          {universities.map((u) => (
            <option key={u.id} value={u.id}>
              {u.label}
            </option>
          ))}
        </select>
      </label>

      {error && <p className="text-sm text-clay">{error}</p>}
      {ok && <p className="text-sm text-forest">{dict.profileEdit.success}</p>}

      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-lake px-4 py-2.5 font-medium text-white hover:bg-lake-dark disabled:opacity-60"
      >
        {busy ? dict.common.loading : dict.profileEdit.save}
      </button>
    </form>
  );
}

const inputClass =
  'w-full rounded-md border border-stone/30 px-3 py-2 outline-none focus:border-lake focus:ring-1 focus:ring-lake';
