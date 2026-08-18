'use client';

import { useLanguage } from '@/providers/LanguageProvider';

export function useTranslation() {
  const { t, locale, setLocale, toggleLocale } = useLanguage();
  return { t, locale, setLocale, toggleLocale };
}
