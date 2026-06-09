'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

export function LoginForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(dict.auth.errorInvalid);
      setLoading(false);
      return;
    }

    router.push(`/${locale}/espace`);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Field
        label={dict.auth.email}
        type="email"
        value={email}
        onChange={setEmail}
        autoComplete="email"
        required
      />
      <Field
        label={dict.auth.password}
        type="password"
        value={password}
        onChange={setPassword}
        autoComplete="current-password"
        required
      />

      {error && <p className="text-sm text-clay">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-lake px-4 py-2.5 font-medium text-white hover:bg-lake-dark disabled:opacity-60"
      >
        {loading ? dict.common.loading : dict.auth.loginButton}
      </button>

      <p className="text-center text-sm text-stone">
        {dict.auth.noAccount}{' '}
        <Link href={`/${locale}/inscription`} className="font-medium text-lake hover:underline">
          {dict.nav.signup}
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
}: {
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  required?: boolean;
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
        className="w-full rounded-md border border-stone/30 px-3 py-2 outline-none focus:border-lake focus:ring-1 focus:ring-lake"
      />
    </label>
  );
}
