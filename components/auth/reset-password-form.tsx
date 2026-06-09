'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

export function ResetPasswordForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // The recovery link establishes a temporary session (detectSessionInUrl),
    // so updateUser can set the new password.
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    setLoading(false);
    if (error) {
      setError(dict.auth.errorGeneric);
      return;
    }
    setDone(true);
    router.refresh();
  }

  if (done) {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-forest/30 bg-forest/5 p-4 text-sm text-forest">
          {dict.auth.passwordUpdated}
        </p>
        <Link
          href={`/${locale}/connexion`}
          className="inline-block rounded-md bg-lake px-4 py-2 font-medium text-white hover:bg-lake-dark"
        >
          {dict.auth.loginButton}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">{dict.auth.newPassword}</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
          minLength={6}
          className="w-full rounded-md border border-stone/30 px-3 py-2 outline-none focus:border-lake focus:ring-1 focus:ring-lake"
        />
      </label>
      {error && <p className="text-sm text-clay">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-lake px-4 py-2.5 font-medium text-white hover:bg-lake-dark disabled:opacity-60"
      >
        {loading ? dict.common.loading : dict.auth.updatePassword}
      </button>
    </form>
  );
}
