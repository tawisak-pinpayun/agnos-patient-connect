import { en } from './en';
import { th, type TranslationKey } from './th';

export type Locale = 'th' | 'en';
export type { TranslationKey };

export const LOCALES: Locale[] = ['th', 'en'];

const dictionaries: Record<Locale, Record<TranslationKey, string>> = {
  th,
  en,
};

export type Translator = (
  key: TranslationKey | string,
  vars?: Record<string, string | number>,
) => string;

export function createTranslator(locale: Locale): Translator {
  const dict = dictionaries[locale];

  return (key, vars) => {
    const template = dict[key as TranslationKey] ?? key;
    if (!vars) return template;

    return Object.entries(vars).reduce(
      (acc, [name, value]) => acc.replaceAll(`{${name}}`, String(value)),
      template,
    );
  };
}

export const LOCALE_LABELS: Record<Locale, string> = {
  th: 'ไทย',
  en: 'EN',
};
