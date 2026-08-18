'use client';

import { PatientForm } from '@/components/patient/PatientForm';
import { useTranslation } from '@/hooks/useTranslation';

export function PatientFormPageClient({ sessionId }: { sessionId: string }) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-3xl">
      <header className="mb-4">
        <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
          {t('patient.heading')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t('patient.subheading')}</p>
        <p className="mt-2 text-xs text-slate-400">
          {t('patient.sessionId')}:{' '}
          <span className="font-mono text-slate-500">{sessionId}</span>
        </p>
      </header>

      <PatientForm sessionId={sessionId} />
    </div>
  );
}
