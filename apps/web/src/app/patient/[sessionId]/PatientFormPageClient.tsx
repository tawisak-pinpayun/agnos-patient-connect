'use client';

import { PatientForm } from '@/components/patient/PatientForm';
import { useTranslation } from '@/hooks/useTranslation';

export function PatientFormPageClient({ sessionId }: { sessionId: string }) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
          {t('patient.heading')}
        </h1>
        <p className="mt-2 text-xs text-slate-400 dark:text-slate-500">
          {t('patient.sessionId')}:{' '}
          <span className="font-mono text-slate-500 dark:text-slate-400">{sessionId}</span>
        </p>
      </header>

      <PatientForm sessionId={sessionId} />
    </div>
  );
}
