import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { SignupForm } from '@/components/auth/signup-form';

export const metadata: Metadata = { title: 'Inscription' };

export default async function SignupPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <div className="mx-auto max-w-sm py-6">
      <h1 className="mb-6 text-2xl font-bold text-ink">{dict.auth.signupTitle}</h1>
      <SignupForm locale={locale} dict={dict} />
    </div>
  );
}
