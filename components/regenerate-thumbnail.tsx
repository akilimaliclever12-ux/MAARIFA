'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { generatePdfThumbnail } from '@/lib/pdf/thumbnail';
import { getThumbnailSourceUrl, setPublicationThumbnail } from '@/app/actions/publications';
import type { Dictionary } from '@/i18n/dictionaries';

// Shown to the owner/staff when a publication has no thumbnail. Fetches the
// PDF, renders page 1 (pdf.js), uploads it, and saves the URL — no re-upload.
export function RegenerateThumbnail({
  publicationId,
  userId,
  dict,
}: {
  publicationId: string;
  userId: string;
  dict: Dictionary;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      const src = await getThumbnailSourceUrl(publicationId);
      if (!src.ok || !src.url) {
        setError(src.ok ? dict.auth.errorGeneric : src.error);
        setBusy(false);
        return;
      }

      const pdfBlob = await (await fetch(src.url)).blob();
      const thumb = await generatePdfThumbnail(pdfBlob);
      if (!thumb) {
        setError(dict.auth.errorGeneric);
        setBusy(false);
        return;
      }

      const supabase = createClient();
      const path = `${userId}/${crypto.randomUUID()}.jpg`;
      const { error: upErr } = await supabase.storage
        .from('thumbnails')
        .upload(path, thumb, { contentType: 'image/jpeg', upsert: false });
      if (upErr) {
        setError(dict.auth.errorGeneric);
        setBusy(false);
        return;
      }

      const url = supabase.storage.from('thumbnails').getPublicUrl(path).data.publicUrl;
      const saved = await setPublicationThumbnail(publicationId, url);
      if (!saved.ok) {
        setError(saved.error);
        setBusy(false);
        return;
      }

      router.refresh();
    } catch {
      setError(dict.auth.errorGeneric);
      setBusy(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={run}
        disabled={busy}
        className="text-sm text-lake underline hover:text-lake-dark disabled:opacity-60"
      >
        {busy ? dict.publish.uploading : dict.publication.regenerateThumbnail}
      </button>
      {error && <p className="mt-1 text-sm text-clay">{error}</p>}
    </div>
  );
}
