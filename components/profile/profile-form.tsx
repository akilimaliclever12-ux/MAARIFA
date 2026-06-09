'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { updateProfile } from '@/app/actions/profile';
import type { Dictionary } from '@/i18n/dictionaries';

type Option = { id: string; label: string };

export function ProfileForm({
  dict,
  userId,
  initial,
  universities,
}: {
  dict: Dictionary;
  userId: string;
  initial: { fullName: string; bio: string; universityId: string; avatarUrl: string };
  universities: Option[];
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState(initial.fullName);
  const [bio, setBio] = useState(initial.bio);
  const [universityId, setUniversityId] = useState(initial.universityId);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState(initial.avatarUrl);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);
  const [busy, setBusy] = useState(false);

  function onPickAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setAvatarFile(f);
    if (f) setAvatarPreview(URL.createObjectURL(f));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setOk(false);
    setBusy(true);

    let avatarUrl: string | undefined;
    if (avatarFile) {
      if (!avatarFile.type.startsWith('image/')) {
        setBusy(false);
        return setError(dict.publish.errorFileType);
      }
      const supabase = createClient();
      const ext = avatarFile.name.split('.').pop()?.toLowerCase() || 'jpg';
      const path = `${userId}/avatar-${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from('avatars')
        .upload(path, avatarFile, { upsert: true, contentType: avatarFile.type });
      if (upErr) {
        setBusy(false);
        return setError(dict.auth.errorGeneric);
      }
      avatarUrl = supabase.storage.from('avatars').getPublicUrl(path).data.publicUrl;
    }

    const res = await updateProfile({
      fullName,
      bio,
      universityId: universityId || undefined,
      avatarUrl,
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
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-full border border-stone/20 bg-mist">
          {avatarPreview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={avatarPreview} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-xl font-bold text-stone">
              {fullName.charAt(0).toUpperCase()}
            </span>
          )}
        </div>
        <label className="block">
          <span className="mb-1 block text-sm font-medium text-ink">{dict.profileEdit.avatar}</span>
          <input type="file" accept="image/*" onChange={onPickAvatar} className="block text-sm" />
        </label>
      </div>

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
