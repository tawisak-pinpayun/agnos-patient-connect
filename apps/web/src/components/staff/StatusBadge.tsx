'use client';

import clsx from 'clsx';
import { CircleCheck, PencilLine, PauseCircle } from 'lucide-react';
import type { SessionStatus } from '@apc/shared';
import { useTranslation } from '@/hooks/useTranslation';

const styles: Record<SessionStatus, string> = {
  filling:
    'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-900/30 dark:text-brand-300 dark:border-brand-800',
  submitted:
    'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800',
  idle:
    'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
};

const icons: Record<SessionStatus, typeof PencilLine> = {
  filling: PencilLine,
  submitted: CircleCheck,
  idle: PauseCircle,
};

export function StatusBadge({
  status,
  size = 'md',
}: {
  status: SessionStatus;
  size?: 'sm' | 'md';
}) {
  const { t } = useTranslation();
  const Icon = icons[status];

  return (
    <span
      className={clsx(
        'inline-flex shrink-0 items-center gap-1.5 rounded-full border font-medium',
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
        styles[status],
      )}
    >
      <Icon
        className={clsx(
          size === 'sm' ? 'h-3 w-3' : 'h-3.5 w-3.5',
          status === 'filling' && 'motion-safe:animate-pulse',
        )}
        aria-hidden
      />
      {t(`status.${status}`)}
    </span>
  );
}
