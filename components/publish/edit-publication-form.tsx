'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { updatePublication } from '@/app/actions/publications';
import { generatePdfThumbnail } from '@/lib/pdf/thumbnail';
import {
  PUBLICATION_TYPES,
  LANGUAGES,
  MAX_PDF_BYTES,
  ALIGNMENTS,
  MAX_ABSTRACT_WORDS,
  countWords,
  type Alignment,
} from '@/lib/validation/publication';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

type Option = { id: string; label: string };

export interface EditInitial {
  id: string;
  title: string;
  abstract: string;
  abstractAlign: Alignment;
  type: (typeof PUBLICATION_TYPES)[number];
  universityId: string;
  categoryId: string;
  year: string;
  language: (typeof LANGUAGES)[number];
  keywords: string;
  coAuthors: string;
  currentFileName: string;
}

export function EditPublicationForm({
  locale,
  dict,
  userId,
  universities,
  categories,
  initial,
}: {
  locale: Locale;
  dict: Dictionary;
  userId: string;
  universities: Option[];
  categories: Option[];
  initial: EditInitial;
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(initial.title);
  const [abstract, setAbstract] = useState(initial.abstract);
  const [abstractAlign, setAbstractAlign] = useState<Alignment>(initial.abstractAlign);
  const [type, setType] = useState(initial.type);
  const [universityId, setUniversityId] = useState(initial.universityId);
  const [categoryId, setCategoryId] = useState(initial.categoryId);
  const [year, setYear] = useState(initial.year);
  const [language, setLanguage] = useState(initial.language);
  const [keywords, setKeywords] = useState(initial.keywords);
  const [coAuthors, setCoAuthors] = useState(initial.coAuthors);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(status: 'draft' | 'pending') {
    setError(null);
    if (countWords(abstract) > MAX_ABSTRACT_WORDS) return setError(dict.publish.abstractTooLong);

    setBusy(true);
    const supabase = createClient();

    // Optional: replace the PDF + thumbnail.
    let storagePath: string | undefined;
    let fileName: string | undefined;
    let fileSize: number | undefined;
    let thumbnailUrl: string | undefined;

    if (file) {
      if (file.type !== 'application/pdf') {
        setBusy(false);
        return setError(dict.publish.errorFileType);
      }
      if (file.size > MAX_PDF_BYTES) {
        setBusy(false);
        return setError(dict.publish.errorFileSize);
      }
      const path = `${userId}/${crypto.randomUUID()}.pdf`;
      const { error: upErr } = await supabase.storage
        .from('publications')
        .upload(path, file, { contentType: 'application/pdf', upsert: false });
      if (upErr) {
        setBusy(false);
        return setError(dict.auth.errorGeneric);
      }
      storagePath = path;
      fileName = file.name;
      fileSize = file.size;

      const thumb = await generatePdfThumbnail(file);
      if (thumb) {
        const thumbPath = `${userId}/${crypto.randomUUID()}.jpg`;
        const { error: tErr } = await supabase.storage
          .from('thumbnails')
          .upload(thumbPath, thumb, { contentType: 'image/jpeg', upsert: false });
        if (!tErr) {
          thumbnailUrl = supabase.storage.from('thumbnails').getPublicUrl(thumbPath).data.publicUrl;
        }
      }
    }

    const result = await updatePublication({
      id: initial.id,
      title,
      abstract,
      abstractAlign,
      type,
      universityId: universityId || undefined,
      categoryId: categoryId || undefined,
      year: year ? Number(year) : null,
      language,
      keywords: splitList(keywords, ','),
      coAuthors: splitList(coAuthors, '\n'),
      status,
      storagePath,
      fileName,
      fileSize,
      thumbnailUrl,
    });

    if (!result.ok) {
      if (storagePath) await supabase.storage.from('publications').remove([storagePath]);
      setBusy(false);
      return setError(result.error);
    }

    router.push(`/${locale}/espace`);
    router.refresh();
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit('pending');
      }}
      className="space-y-4"
    >
      <Field label={dict.publish.titleLabel}>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required minLength={3} className={inputClass} />
      </Field>

      <Field label={dict.publish.abstractLabel} help={dict.publish.abstractLimit}>
        <div className="mb-2 flex flex-wrap gap-1" role="group" aria-label={dict.publish.alignment}>
          {ALIGNMENTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAbstractAlign(a)}
              aria-pressed={abstractAlign === a}
              className={`rounded-md border px-2.5 py-1 text-xs ${
                abstractAlign === a ? 'border-lake bg-lake/10 font-medium text-lake' : 'border-stone/30 text-stone hover:bg-mist'
              }`}
            >
              {alignLabel(a, dict)}
            </button>
          ))}
        </div>
        <textarea value={abstract} onChange={(e) => setAbstract(e.target.value)} rows={5} style={{ textAlign: abstractAlign }} className={inputClass} />
        <span className={`mt-1 block text-xs ${countWords(abstract) > MAX_ABSTRACT_WORDS ? 'text-clay' : 'text-stone'}`}>
          {countWords(abstract)} / {MAX_ABSTRACT_WORDS} {dict.publish.words}
        </span>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={dict.publish.typeLabel}>
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className={inputClass}>
            {PUBLICATION_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
        </Field>
        <Field label={dict.publish.languageLabel}>
          <select value={language} onChange={(e) => setLanguage(e.target.value as typeof language)} className={inputClass}>
            {LANGUAGES.map((l) => (<option key={l} value={l}>{l}</option>))}
          </select>
        </Field>
        <Field label={dict.publish.universityLabel}>
          <select value={universityId} onChange={(e) => setUniversityId(e.target.value)} className={inputClass}>
            <option value="">{dict.publish.none}</option>
            {universities.map((u) => (<option key={u.id} value={u.id}>{u.label}</option>))}
          </select>
        </Field>
        <Field label={dict.publish.categoryLabel}>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            <option value="">{dict.publish.none}</option>
            {categories.map((c) => (<option key={c.id} value={c.id}>{c.label}</option>))}
          </select>
        </Field>
        <Field label={dict.publish.yearLabel}>
          <input type="number" value={year} onChange={(e) => setYear(e.target.value)} min={1950} max={2100} className={inputClass} />
        </Field>
      </div>

      <Field label={dict.publish.keywordsLabel}>
        <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} className={inputClass} />
      </Field>

      <Field label={dict.publish.coAuthorsLabel}>
        <textarea value={coAuthors} onChange={(e) => setCoAuthors(e.target.value)} rows={2} className={inputClass} />
      </Field>

      <Field label={dict.publish.replaceFile} help={`${dict.publish.currentFile}: ${initial.currentFileName}`}>
        <input type="file" accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="block w-full text-sm" />
      </Field>

      {error && <p className="text-sm text-clay">{error}</p>}

      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-lake px-4 py-2.5 font-medium text-white hover:bg-lake-dark disabled:opacity-60"
        >
          {busy ? dict.publish.uploading : dict.publish.submit}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => submit('draft')}
          className="rounded-md border border-stone/30 px-4 py-2.5 font-medium text-ink hover:bg-mist disabled:opacity-60"
        >
          {dict.publish.saveChanges}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  'w-full rounded-md border border-stone/30 px-3 py-2 outline-none focus:border-lake focus:ring-1 focus:ring-lake';

function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      {children}
      {help && <span className="mt-1 block text-xs text-stone">{help}</span>}
    </label>
  );
}

function alignLabel(a: Alignment, dict: Dictionary): string {
  const map: Record<Alignment, string> = {
    left: dict.publish.alignLeft,
    center: dict.publish.alignCenter,
    right: dict.publish.alignRight,
    justify: dict.publish.alignJustify,
  };
  return map[a];
}

function splitList(value: string, sep: string): string[] {
  return value.split(sep).map((s) => s.trim()).filter(Boolean);
}
