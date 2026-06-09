import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { isLocale } from '@/i18n/config';

export const metadata: Metadata = { title: 'Conditions d’utilisation' };

const FR = {
  title: 'Conditions d’utilisation',
  updated: 'Dernière mise à jour : juin 2026',
  sections: [
    {
      h: '1. Acceptation',
      p: 'En créant un compte ou en utilisant Maarifa, vous acceptez les présentes conditions. Si vous ne les acceptez pas, n’utilisez pas la plateforme.',
    },
    {
      h: '2. Objet de la plateforme',
      p: 'Maarifa permet de publier, découvrir, préserver et partager des travaux académiques (mémoires, articles, rapports, etc.) produits au Sud-Kivu et en RDC.',
    },
    {
      h: '3. Compte',
      p: 'Vous êtes responsable de l’exactitude de vos informations et de la sécurité de votre mot de passe. Vous devez avoir l’âge légal ou l’autorisation requise pour utiliser le service.',
    },
    {
      h: '4. Droits sur les contenus',
      p: 'En publiant un travail, vous certifiez en être l’auteur ou disposer des droits nécessaires. Vous conservez vos droits d’auteur et accordez à Maarifa une licence non exclusive pour héberger, afficher et permettre le téléchargement de votre travail sur la plateforme.',
    },
    {
      h: '5. Contenus interdits',
      p: 'Sont interdits : le plagiat, la violation de droits d’auteur, les contenus illégaux, diffamatoires, haineux ou inappropriés. Tout contenu signalé peut être examiné et retiré.',
    },
    {
      h: '6. Modération',
      p: 'Les publications sont examinées avant mise en ligne. Maarifa peut approuver, rejeter ou retirer un contenu, et suspendre un compte en cas d’abus.',
    },
    {
      h: '7. Signalement et retrait',
      p: 'Vous pouvez signaler un contenu litigieux. Les titulaires de droits peuvent demander un retrait ; nous traitons ces demandes de bonne foi.',
    },
    {
      h: '8. Responsabilité',
      p: 'La plateforme est fournie « en l’état ». Maarifa ne garantit pas l’exactitude des travaux publiés et décline toute responsabilité quant à leur usage par des tiers.',
    },
    {
      h: '9. Données personnelles',
      p: 'Nous collectons le minimum de données nécessaires (nom, e-mail, affiliation). Voir nos pratiques de confidentialité. Nous ne vendons pas vos données.',
    },
    {
      h: '10. Modifications',
      p: 'Ces conditions peuvent évoluer. Les changements importants seront communiqués sur la plateforme.',
    },
  ],
};

const EN = {
  title: 'Terms and Conditions',
  updated: 'Last updated: June 2026',
  sections: [
    { h: '1. Acceptance', p: 'By creating an account or using Maarifa, you agree to these terms. If you do not agree, do not use the platform.' },
    { h: '2. Purpose', p: 'Maarifa lets you publish, discover, preserve, and share academic work (theses, papers, reports, etc.) produced in South Kivu and the DRC.' },
    { h: '3. Account', p: 'You are responsible for the accuracy of your information and the security of your password. You must meet the legal age or have the required authorization.' },
    { h: '4. Content rights', p: 'By publishing a work you certify that you are the author or hold the necessary rights. You keep your copyright and grant Maarifa a non-exclusive license to host, display, and allow downloads of your work on the platform.' },
    { h: '5. Prohibited content', p: 'Prohibited: plagiarism, copyright infringement, illegal, defamatory, hateful, or inappropriate content. Reported content may be reviewed and removed.' },
    { h: '6. Moderation', p: 'Submissions are reviewed before going live. Maarifa may approve, reject, or remove content and suspend accounts for abuse.' },
    { h: '7. Reporting and takedown', p: 'You can report problematic content. Rights holders may request removal; we handle such requests in good faith.' },
    { h: '8. Liability', p: 'The platform is provided “as is”. Maarifa does not guarantee the accuracy of published work and is not liable for third-party use.' },
    { h: '9. Personal data', p: 'We collect the minimum data needed (name, email, affiliation). We do not sell your data.' },
    { h: '10. Changes', p: 'These terms may change. Significant changes will be communicated on the platform.' },
  ],
};

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = locale === 'en' ? EN : FR;

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-6">
      <header>
        <h1 className="text-2xl font-bold text-ink">{t.title}</h1>
        <p className="mt-1 text-sm text-stone">{t.updated}</p>
      </header>
      <div className="space-y-5">
        {t.sections.map((s) => (
          <section key={s.h}>
            <h2 className="font-semibold text-ink">{s.h}</h2>
            <p className="mt-1 text-ink">{s.p}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
