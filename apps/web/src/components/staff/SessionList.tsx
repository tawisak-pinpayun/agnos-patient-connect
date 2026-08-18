'use client';

import { Users } from 'lucide-react';
import type { SessionSummary } from '@apc/shared';
import { SessionCard } from './SessionCard';
import { useTranslation } from '@/hooks/useTranslation';

interface SessionListProps {
  sessions: SessionSummary[];
  activeSessionId?: string | null;
  onSelect: (sessionId: string) => void;
}

export function SessionList({
  sessions,
  activeSessionId,
  onSelect,
}: SessionListProps) {
  const { t } = useTranslation();

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center">
        <Users className="h-6 w-6 text-slate-300" aria-hidden />
        <p className="text-sm font-medium text-slate-600">{t('staff.empty')}</p>
        <p className="text-xs text-slate-400">{t('staff.emptyHint')}</p>
      </div>
    );
  }

  return (
    <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-1">
      {sessions.map((summary) => (
        <li key={summary.sessionId}>
          <SessionCard
            summary={summary}
            active={summary.sessionId === activeSessionId}
            onSelect={onSelect}
          />
        </li>
      ))}
    </ul>
  );
}
