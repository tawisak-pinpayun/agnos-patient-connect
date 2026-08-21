'use client';

import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

interface LiveFieldProps {
  labelKey: string;
  value: string;
  extra?: string;
  mono?: boolean;
  className?: string;
}

/**
 * แสดงค่าหนึ่งช่องพร้อม flash animation สั้น ๆ เมื่อค่าเปลี่ยน
 * (respect prefers-reduced-motion ผ่าน motion-safe ของ Tailwind)
 */
export function LiveField({ labelKey, value, extra, mono, className }: LiveFieldProps) {
  const { t } = useTranslation();
  const [flash, setFlash] = useState(false);
  const previous = useRef(value);

  useEffect(() => {
    if (previous.current === value) return;
    previous.current = value;
    setFlash(true);
    const timer = setTimeout(() => setFlash(false), 1000);
    return () => clearTimeout(timer);
  }, [value]);

  const isEmpty = value.trim().length === 0;

  return (
    <div
      className={clsx(
        'rounded-lg px-3 py-2 transition-colors',
        flash && 'motion-safe:animate-flash',
        className,
      )}
    >
      <dt className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
        {t(labelKey)}
      </dt>
      <dd
        className={clsx(
          'mt-0.5 break-words text-sm',
          mono && 'font-mono text-xs',
          isEmpty ? 'italic text-slate-300 dark:text-slate-600' : 'text-slate-900 dark:text-slate-100',
        )}
        aria-live="polite"
      >
        {isEmpty ? t('staff.notFilled') : value}
        {extra && (
          <span className="mt-0.5 block text-xs text-slate-500 dark:text-slate-400">{extra}</span>
        )}
      </dd>
    </div>
  );
}
