'use client';

import { MousePointerClick } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import type { SessionSummary } from '@apc/shared';
import { SessionDetail } from './SessionDetail';
import { SessionList } from './SessionList';
import { Card, CardBody } from '@/components/ui/Card';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSessionSubscription } from '@/hooks/useSessionSubscription';
import { useStaffSessions } from '@/hooks/useStaffSessions';
import { useTranslation } from '@/hooks/useTranslation';

interface StaffDashboardProps {
  initialSessions: SessionSummary[];
}

export function StaffDashboard({ initialSessions }: StaffDashboardProps) {
  const { t } = useTranslation();
  const router = useRouter();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const { sessions } = useStaffSessions(initialSessions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { snapshot, notFound } = useSessionSubscription(isDesktop ? selectedId : null);

  const handleSelect = useCallback(
    (sessionId: string) => {
      // มือถือ/แท็บเล็ต: ไปหน้าแยกเพื่อให้พื้นที่แสดงข้อมูลเต็มจอ
      if (!isDesktop) {
        router.push(`/staff/${sessionId}`);
        return;
      }
      setSelectedId(sessionId);
    },
    [isDesktop, router],
  );

  return (
    <div className="space-y-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">
            {t('staff.heading')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t('staff.subheading')}</p>
        </div>
        <p className="text-sm text-slate-400">
          {t('staff.sessionCount', { count: sessions.length })}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <h2 className="mb-2 text-sm font-semibold text-slate-600">
            {t('staff.sessions')}
          </h2>
          <div className="lg:max-h-[calc(100dvh-14rem)] lg:overflow-y-auto lg:pr-1">
            <SessionList
              sessions={sessions}
              activeSessionId={selectedId}
              onSelect={handleSelect}
            />
          </div>
        </div>

        <div className="hidden lg:col-span-2 lg:block">
          {selectedId ? (
            <SessionDetail snapshot={snapshot} notFound={notFound} />
          ) : (
            <Card>
              <CardBody className="flex flex-col items-center gap-2 py-24 text-center">
                <MousePointerClick className="h-6 w-6 text-slate-300" aria-hidden />
                <p className="text-sm text-slate-500">{t('staff.selectPrompt')}</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
