'use client';

import { Users } from 'lucide-react';
import type { SessionSummary } from '@apc/shared';
import { SessionCard } from './SessionCard';
import { useTranslation } from '@/hooks/useTranslation';

interface SessionListProps {
  sessions: SessionSummary[];
  activeSessionId?: string | null;
  onSelect: (sessionId: string) => void;
  onDelete: (sessionId: string) => void;
  emptyKey?: string;
  emptyHintKey?: string;
}

export function SessionList({
  sessions,
  activeSessionId,
  onSelect,
  onDelete,
  emptyKey = 'staff.empty',
  emptyHintKey = 'staff.emptyHint',
}: SessionListProps) {
  const { t } = useTranslation();

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center dark:border-slate-700 dark:bg-slate-900/50">
        <Users className="h-6 w-6 text-slate-300" aria-hidden />
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">{t(emptyKey)}</p>
        <p className="text-xs text-slate-400 dark:text-slate-500">{t(emptyHintKey)}</p>
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
            onDelete={onDelete}
          />
        </li>
      ))}
    </ul>
  );
}
