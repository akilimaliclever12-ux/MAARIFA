// Bilingual configuration. French is the default; English is the secondary locale.
export const locales = ['fr', 'en'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'fr';

export function isLocale(value: string | undefined): value is Locale {
  return !!value && (locales as readonly string[]).includes(value);
}

export const localeNames: Record<Locale, string> = {
  fr: 'Français',
  en: 'English',
};
