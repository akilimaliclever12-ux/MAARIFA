import 'server-only';
import type { Locale } from './config';

// Lightweight, zero-dependency i18n: JSON message files loaded on the server.
// Keeps the client bundle small (low-bandwidth friendly).
const dictionaries = {
  fr: () => import('@/messages/fr.json').then((m) => m.default),
  en: () => import('@/messages/en.json').then((m) => m.default),
} as const;

export type Dictionary = Awaited<ReturnType<(typeof dictionaries)['fr']>>;

export async function getDictionary(locale: Locale): Promise<Dictionary> {
  return dictionaries[locale]();
}
