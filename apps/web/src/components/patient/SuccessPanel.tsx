'use client';

import { CircleCheckBig } from 'lucide-react';
import Link from 'next/link';
import type { PatientData } from '@apc/shared';
import { Card, CardBody } from '@/components/ui/Card';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDate } from '@/lib/format';

interface SuccessPanelProps {
  data: PatientData;
  submittedAt: string;
}

export function SuccessPanel({ data, submittedAt }: SuccessPanelProps) {
  const { t, locale } = useTranslation();
  const name = [data.firstName, data.middleName, data.lastName]
    .filter(Boolean)
    .join(' ');

  return (
    <Card className="animate-slide-up">
      <CardBody className="flex flex-col items-center gap-4 py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-900/30">
          <CircleCheckBig className="h-7 w-7 text-emerald-600 dark:text-emerald-300" aria-hidden />
        </span>

        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            {t('patient.success.title')}
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{t('patient.success.desc')}</p>
        </div>

        <dl className="w-full max-w-sm rounded-xl bg-slate-50 p-4 text-left text-sm dark:bg-slate-800/60">
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-slate-500 dark:text-slate-400">{t('field.firstName')}</dt>
            <dd className="font-medium text-slate-800 dark:text-slate-100">{name || '-'}</dd>
          </div>
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-slate-500 dark:text-slate-400">{t('field.email')}</dt>
            <dd className="font-medium text-slate-800 dark:text-slate-100">{data.email || '-'}</dd>
          </div>
          <div className="flex justify-between gap-4 py-1">
            <dt className="text-slate-500 dark:text-slate-400">{t('staff.lastActivity')}</dt>
            <dd className="font-medium text-slate-800 dark:text-slate-100">
              {formatDate(submittedAt, locale)}
            </dd>
          </div>
        </dl>

        <Link
          href="/patient"
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
        >
          {t('patient.success.newSession')}
        </Link>
      </CardBody>
    </Card>
  );
}
