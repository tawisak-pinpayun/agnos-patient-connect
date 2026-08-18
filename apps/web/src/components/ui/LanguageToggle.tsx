'use client';

import clsx from 'clsx';
import { Languages } from 'lucide-react';
import { LOCALES, LOCALE_LABELS } from '@/lib/i18n';
import { useTranslation } from '@/hooks/useTranslation';

export function LanguageToggle() {
  const { locale, setLocale } = useTranslation();

  return (
    <div
      className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-white p-1"
      role="group"
      aria-label="Language"
    >
      <Languages className="ml-1.5 h-4 w-4 text-slate-400" aria-hidden />
      {LOCALES.map((value) => (
        <button
          key={value}
          type="button"
          onClick={() => setLocale(value)}
          aria-pressed={locale === value}
          className={clsx(
            'rounded-full px-2.5 py-1 text-xs font-medium transition',
            'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-500',
            locale === value
              ? 'bg-brand-600 text-white'
              : 'text-slate-600 hover:bg-slate-100',
          )}
        >
          {LOCALE_LABELS[value]}
        </button>
      ))}
    </div>
  );
}
