'use client';

import clsx from 'clsx';
import { ChevronRight } from 'lucide-react';
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
}

export function SessionCard({ summary, active = false, onSelect }: SessionCardProps) {
  const { t } = useTranslation();
  const status = useSessionStatus({
    status: summary.status,
    lastActivityAt: summary.lastActivityAt,
    connected: summary.connected,
  });

  return (
    <button
      type="button"
      onClick={() => onSelect(summary.sessionId)}
      aria-current={active}
      className={clsx(
        'w-full rounded-xl border p-3 text-left transition',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500',
        active
          ? 'border-brand-400 bg-brand-50/60 shadow-sm'
          : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate font-medium text-slate-900">
            {summary.displayName || t('staff.unnamed')}
          </p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-slate-400">
            {summary.sessionId}
          </p>
        </div>
        <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-slate-300" aria-hidden />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <StatusBadge status={status} size="sm" />
        <span className="text-[11px] text-slate-400">
          {t('staff.lastActivity')}: {formatRelativeTime(summary.lastActivityAt, t)}
        </span>
      </div>

      <ProgressBar
        className="mt-3"
        value={summary.filledCount}
        total={summary.totalCount}
        label={t('staff.progress')}
      />
    </button>
  );
}
