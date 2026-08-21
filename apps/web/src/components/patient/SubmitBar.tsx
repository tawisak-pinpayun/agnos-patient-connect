'use client';

import { Check, CloudUpload, Loader2, TriangleAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useTranslation } from '@/hooks/useTranslation';
import type { SyncState } from '@/hooks/usePatientDraftSync';

interface SubmitBarProps {
  filledCount: number;
  totalCount: number;
  syncState: SyncState;
  isSubmitting: boolean;
  errorKey: string | null;
}

function SyncStatus({ state }: { state: SyncState }) {
  const { t } = useTranslation();

  if (state === 'saving') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
        <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
        {t('patient.saving')}
      </span>
    );
  }

  if (state === 'saved') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
        <Check className="h-3.5 w-3.5" aria-hidden />
        {t('patient.saved')}
      </span>
    );
  }

  if (state === 'error') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400">
        <TriangleAlert className="h-3.5 w-3.5" aria-hidden />
        {t('connection.disconnected')}
      </span>
    );
  }

  return null;
}

export function SubmitBar({
  filledCount,
  totalCount,
  syncState,
  isSubmitting,
  errorKey,
}: SubmitBarProps) {
  const { t } = useTranslation();

  return (
    <div className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white/95 px-4 py-3 backdrop-blur dark:border-slate-700 dark:bg-slate-900/95 lg:static lg:rounded-2xl lg:border lg:px-6 lg:py-4 lg:shadow-sm">
      <div className="mx-auto flex max-w-3xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <ProgressBar
            value={filledCount}
            total={totalCount}
            label={t('patient.progress')}
          />
          <div className="mt-1 min-h-4" aria-live="polite">
            {errorKey ? (
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400">{t(errorKey)}</span>
            ) : (
              <SyncStatus state={syncState} />
            )}
          </div>
        </div>

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full sm:w-auto">
          {isSubmitting ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <CloudUpload className="h-4 w-4" aria-hidden />
          )}
          {isSubmitting ? t('patient.submitting') : t('patient.submit')}
        </Button>
      </div>
    </div>
  );
}
