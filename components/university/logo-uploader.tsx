'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { updateUniversityLogo } from '@/app/actions/university';
import type { Dictionary } from '@/i18n/dictionaries';

export function LogoUploader({
  universityId,
  userId,
  currentLogoUrl,
  dict,
}: {
  universityId: string;
  userId: string;
  currentLogoUrl: string | null;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState(currentLogoUrl);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setError(dict.publish.errorFileType);

    setError(null);
    setBusy(true);
    setPreview(URL.createObjectURL(file));

    const supabase = createClient();
    const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
    const path = `${userId}/${universityId}-${crypto.randomUUID()}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('logos')
      .upload(path, file, { upsert: true, contentType: file.type });
    if (upErr) {
      setBusy(false);
      return setError(dict.auth.errorGeneric);
    }
    const url = supabase.storage.from('logos').getPublicUrl(path).data.publicUrl;
    const res = await updateUniversityLogo(universityId, url);
    setBusy(false);
    if (!res.ok) return setError(res.error);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      <div className="relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-stone/20 bg-mist">
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="h-full w-full object-contain" />
        ) : (
          <span className="text-xs text-stone">—</span>
        )}
      </div>
      <label className="cursor-pointer text-sm text-lake hover:underline">
        {busy ? dict.publish.uploading : dict.uniDash.changeLogo}
        <input type="file" accept="image/*" onChange={onPick} className="hidden" disabled={busy} />
      </label>
      {error && <p className="text-sm text-clay">{error}</p>}
    </div>
  );
}
