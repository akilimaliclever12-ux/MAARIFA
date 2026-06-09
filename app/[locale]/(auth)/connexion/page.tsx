import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';
import { getDictionary } from '@/i18n/dictionaries';
import { LoginForm } from '@/components/auth/login-form';

export const metadata: Metadata = { title: 'Connexion' };

export default async function LoginPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = await getDictionary(locale);

  return (
    <div className="mx-auto max-w-sm py-6">
      <h1 className="mb-6 text-2xl font-bold text-ink">{dict.auth.loginTitle}</h1>
      <LoginForm locale={locale} dict={dict} />
    </div>
  );
}
