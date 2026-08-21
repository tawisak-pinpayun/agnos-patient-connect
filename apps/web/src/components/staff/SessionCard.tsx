'use client';

import clsx from 'clsx';
import { Check, ChevronRight, Copy, Trash2 } from 'lucide-react';
import { useState } from 'react';
import type { SessionSummary } from '@apc/shared';
import { StatusBadge } from './StatusBadge';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useSessionStatus } from '@/hooks/useSessionStatus';
import { useTranslation } from '@/hooks/useTranslation';
import { formatRelativeTime } from '@/lib/format';

interface SessionCardProps {
  summary: SessionSummary;
  active?: boolean;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
}

export function SessionCard({ summary, active = false, onSelect, onDelete }: SessionCardProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const status = useSessionStatus({
    status: summary.status,
    lastActivityAt: summary.lastActivityAt,
    connected: summary.connected,
  });

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onSelect(summary.sessionId)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onSelect(summary.sessionId);
        }
      }}
      aria-current={active}
      className={clsx(
        'w-full rounded-xl border p-3 text-left transition',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        active
          ? 'border-brand-400 bg-brand-50/60 shadow-sm dark:border-brand-600 dark:bg-brand-900/20'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600 dark:hover:bg-slate-800',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900 dark:text-slate-100">
            {summary.displayName || t('staff.unnamed')}
          </p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400 dark:text-slate-500">
            {summary.sessionId}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              const url = `${window.location.origin}/patient/${summary.sessionId}`;
              navigator.clipboard
                .writeText(url)
                .then(() => {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                })
                .catch(() => window.alert(t('staff.copyFailed')));
            }}
            aria-label={t('staff.copyLink')}
            className="rounded p-1 text-slate-400 transition hover:bg-brand-50 hover:text-brand-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            {copied ? (
              <Check className="h-4 w-4 text-emerald-600" aria-hidden />
            ) : (
              <Copy className="h-4 w-4" aria-hidden />
            )}
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onDelete(summary.sessionId);
            }}
            aria-label={t('staff.delete')}
            className="rounded p-1 text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            <Trash2 className="h-4 w-4" aria-hidden />
          </button>
          <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" aria-hidden />
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StatusBadge status={status} size="sm" />
        <span className="text-[11px] text-slate-400 dark:text-slate-400">
          {t('staff.lastActivity')}: {formatRelativeTime(summary.lastActivityAt, t)}
        </span>
      </div>

      <ProgressBar
        className="mt-3"
        value={summary.filledCount}
        total={summary.totalCount}
        label={t('staff.progress')}
      />
    </div>
  );
}
