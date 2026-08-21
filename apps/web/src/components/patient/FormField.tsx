'use client';

import type { ReactNode } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface FormFieldProps {
  id: string;
  labelKey: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}

export function FormField({
  id,
  labelKey,
  required = false,
  error,
  hint,
  className,
  children,
}: FormFieldProps) {
  const { t } = useTranslation();
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-baseline gap-1 text-sm font-medium text-slate-700 dark:text-slate-300"
      >
        {t(labelKey)}
        {required ? (
          <span className="text-rose-500" aria-hidden>
            *
          </span>
        ) : (
          <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
            ({t('field.optional')})
          </span>
        )}
      </label>

      {children}

      {hint && !error ? (
        <p id={hintId} className="mt-1 text-xs text-slate-400 dark:text-slate-500">
          {hint}
        </p>
      ) : null}

      {error ? (
        <p id={errorId} className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">
          {t(error)}
        </p>
      ) : null}
    </div>
  );
}
