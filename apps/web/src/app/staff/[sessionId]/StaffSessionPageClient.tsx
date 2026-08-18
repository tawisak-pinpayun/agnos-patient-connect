'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { SessionDetail } from '@/components/staff/SessionDetail';
import { useSessionSubscription } from '@/hooks/useSessionSubscription';
import { useTranslation } from '@/hooks/useTranslation';

export function StaffSessionPageClient({ sessionId }: { sessionId: string }) {
  const { t } = useTranslation();
  const { snapshot, notFound } = useSessionSubscription(sessionId);

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/staff"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          {t('staff.backToList')}
        </Link>
        <h1 className="text-lg font-bold text-slate-900">{t('staff.detailHeading')}</h1>
      </div>

      <SessionDetail snapshot={snapshot} notFound={notFound} />
    </div>
  );
}
