'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import { createPublication } from '@/app/actions/publications';
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

export function PublishForm({
  locale,
  dict,
  userId,
  universities,
  categories,
}: {
  locale: Locale;
  dict: Dictionary;
  userId: string;
  universities: Option[];
  categories: Option[];
}) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [abstractAlign, setAbstractAlign] = useState<Alignment>('left');
  const [type, setType] = useState<(typeof PUBLICATION_TYPES)[number]>('memoire');
  const [universityId, setUniversityId] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [year, setYear] = useState('');
  const [language, setLanguage] = useState<(typeof LANGUAGES)[number]>('fr');
  const [keywords, setKeywords] = useState('');
  const [coAuthors, setCoAuthors] = useState('');
  const [attestation, setAttestation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(status: 'draft' | 'pending') {
    setError(null);

    if (!file) return setError(dict.publish.errorFileRequired);
    if (file.type !== 'application/pdf') return setError(dict.publish.errorFileType);
    if (file.size > MAX_PDF_BYTES) return setError(dict.publish.errorFileSize);
    if (countWords(abstract) > MAX_ABSTRACT_WORDS) return setError(dict.publish.abstractTooLong);
    if (!attestation) return setError(dict.publish.attestation);

    setBusy(true);
    const supabase = createClient();
    const storagePath = `${userId}/${crypto.randomUUID()}.pdf`;

    // 1. Upload the PDF straight to Storage (avoids server action body limits).
    const { error: upErr } = await supabase.storage
      .from('publications')
      .upload(storagePath, file, { contentType: 'application/pdf', upsert: false });
    if (upErr) {
      setBusy(false);
      return setError(dict.auth.errorGeneric);
    }

    // 2. Persist metadata via the server action.
    const result = await createPublication({
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
      attestation: true,
      status,
      storagePath,
      fileName: file.name,
      fileSize: file.size,
    });

    if (!result.ok) {
      // Clean up the orphaned upload.
      await supabase.storage.from('publications').remove([storagePath]);
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
      <Field label={dict.publish.fileLabel} help={dict.publish.fileHelp}>
        <input
          type="file"
          accept="application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          required
          className="block w-full text-sm"
        />
      </Field>

      <Field label={dict.publish.titleLabel}>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          minLength={3}
          className={inputClass}
        />
      </Field>

      <Field label={dict.publish.abstractLabel} help={dict.publish.abstractLimit}>
        {/* Alignment toggle */}
        <div className="mb-2 flex flex-wrap gap-1" role="group" aria-label={dict.publish.alignment}>
          {ALIGNMENTS.map((a) => (
            <button
              key={a}
              type="button"
              onClick={() => setAbstractAlign(a)}
              aria-pressed={abstractAlign === a}
              className={`rounded-md border px-2.5 py-1 text-xs ${
                abstractAlign === a
                  ? 'border-lake bg-lake/10 font-medium text-lake'
                  : 'border-stone/30 text-stone hover:bg-mist'
              }`}
            >
              {alignLabel(a, dict)}
            </button>
          ))}
        </div>
        <textarea
          value={abstract}
          onChange={(e) => setAbstract(e.target.value)}
          rows={5}
          style={{ textAlign: abstractAlign }}
          className={inputClass}
        />
        <span
          className={`mt-1 block text-xs ${
            countWords(abstract) > MAX_ABSTRACT_WORDS ? 'text-clay' : 'text-stone'
          }`}
        >
          {countWords(abstract)} / {MAX_ABSTRACT_WORDS} {dict.publish.words}
        </span>
      </Field>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={dict.publish.typeLabel}>
          <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className={inputClass}>
            {PUBLICATION_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.replace('_', ' ')}
              </option>
            ))}
          </select>
        </Field>

        <Field label={dict.publish.languageLabel}>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as typeof language)}
            className={inputClass}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Field>

        <Field label={dict.publish.universityLabel}>
          <select value={universityId} onChange={(e) => setUniversityId(e.target.value)} className={inputClass}>
            <option value="">{dict.publish.none}</option>
            {universities.map((u) => (
              <option key={u.id} value={u.id}>
                {u.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label={dict.publish.categoryLabel}>
          <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} className={inputClass}>
            <option value="">{dict.publish.none}</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </Field>

        <Field label={dict.publish.yearLabel}>
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min={1950}
            max={2100}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label={dict.publish.keywordsLabel}>
        <input type="text" value={keywords} onChange={(e) => setKeywords(e.target.value)} className={inputClass} />
      </Field>

      <Field label={dict.publish.coAuthorsLabel}>
        <textarea value={coAuthors} onChange={(e) => setCoAuthors(e.target.value)} rows={2} className={inputClass} />
      </Field>

      <label className="flex items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={attestation}
          onChange={(e) => setAttestation(e.target.checked)}
          className="mt-1"
        />
        <span>{dict.publish.attestation}</span>
      </label>

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
          {dict.publish.saveDraft}
        </button>
      </div>
    </form>
  );
}

const inputClass =
  'w-full rounded-md border border-stone/30 px-3 py-2 outline-none focus:border-lake focus:ring-1 focus:ring-lake';

function Field({
  label,
  help,
  children,
}: {
  label: string;
  help?: string;
  children: React.ReactNode;
}) {
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
  return value
    .split(sep)
    .map((s) => s.trim())
    .filter(Boolean);
}
