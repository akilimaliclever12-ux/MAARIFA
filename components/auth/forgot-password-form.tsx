'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/browser';
import type { Locale } from '@/i18n/config';
import type { Dictionary } from '@/i18n/dictionaries';

export function ForgotPasswordForm({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const supabase = createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${siteUrl}/${locale}/reinitialiser-mot-de-passe`,
    });

    // Always show the same message (don't reveal whether the email exists).
    setSent(true);
    setLoading(false);
  }

  if (sent) {
    return (
      <div className="space-y-4">
        <p className="rounded-md border border-forest/30 bg-forest/5 p-4 text-sm text-forest">
          {dict.auth.resetSent}
        </p>
        <Link href={`/${locale}/connexion`} className="text-sm text-lake hover:underline">
          ← {dict.auth.backToLogin}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <p className="text-sm text-stone">{dict.auth.forgotInstruction}</p>
      <label className="block">
        <span className="mb-1 block text-sm font-medium text-ink">{dict.auth.email}</span>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
          className="w-full rounded-md border border-stone/30 px-3 py-2 outline-none focus:border-lake focus:ring-1 focus:ring-lake"
        />
      </label>
      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-lake px-4 py-2.5 font-medium text-white hover:bg-lake-dark disabled:opacity-60"
      >
        {loading ? dict.common.loading : dict.auth.sendResetLink}
      </button>
      <Link href={`/${locale}/connexion`} className="block text-center text-sm text-lake hover:underline">
        {dict.auth.backToLogin}
      </Link>
    </form>
  );
}
