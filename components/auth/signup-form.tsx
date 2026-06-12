'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

// (terms acceptance is required client-side before signup)

export function SignupForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [accepted, setAccepted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!accepted) {
      setError(dict.terms.accept);
      return;
    }
    setLoading(true);

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${siteUrl}/${locale}/espace`,
      },
    });

    if (error) {
      setError(dict.auth.errorGeneric);
      setLoading(false);
      return;
    }

    // With email confirmation disabled, signUp returns a session immediately —
    // send them straight into the app. (Falls back to the "check email" notice
    // if confirmation is ever re-enabled, since session is then null.)
    if (data.session) {
      router.push(`/${locale}/espace`);
      router.refresh();
      return;
    }

    setDone(true);
    setLoading(false);
  }

  if (done) {
    return (
      <p className="rounded-md border border-forest/30 bg-forest/5 p-4 text-sm text-forest">
        {dict.auth.checkEmail}
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field label={dict.auth.fullName} type="text" value={fullName} onChange={setFullName} autoComplete="name" required />
      <Field label={dict.auth.email} type="email" value={email} onChange={setEmail} autoComplete="email" required />
      <Field
        label={dict.auth.password}
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        required
        minLength={6}
      />

      <label className="flex items-start gap-2 text-sm text-ink">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-1"
        />
        <span>
          {dict.terms.accept}{' '}
          <Link
            href={`/${locale}/conditions`}
            target="_blank"
            className="text-lake hover:underline"
          >
            ({dict.terms.link})
          </Link>
        </span>
      </label>

      {error && <p className="text-sm text-clay">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-lake px-4 py-2.5 font-medium text-white hover:bg-lake-dark disabled:opacity-60"
      >
        {loading ? dict.common.loading : dict.auth.signupButton}
      </button>

      <p className="text-center text-sm text-stone">
        {dict.auth.haveAccount}{' '}
        <Link href={`/${locale}/connexion`} className="font-medium text-lake hover:underline">
          {dict.nav.login}
        </Link>
      </p>
    </form>
  );
}

function Field({
  label,
  type,
  value,
  onChange,
  autoComplete,
  required,
  minLength,
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
  minLength?: number;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-ink">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required={required}
        minLength={minLength}
        className="w-full rounded-md border border-stone/30 px-3 py-2 outline-none focus:border-lake focus:ring-1 focus:ring-lake"
      />
    </label>
  );
}
