'use client';

import { Loader2 } from 'lucide-react';
import type { PatientField, SessionSnapshot } from '@apc/shared';
import { LiveField } from './LiveField';
import { StatusBadge } from './StatusBadge';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useSessionStatus } from '@/hooks/useSessionStatus';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDate, formatRelativeTime } from '@/lib/format';
import { optionLabelKey } from '@/lib/options';

interface SessionDetailProps {
  snapshot: SessionSnapshot | null;
  notFound?: boolean;
}

const SECTIONS: { titleKey: string; fields: PatientField[] }[] = [
  {
    titleKey: 'patient.section.personal',
    fields: ['firstName', 'middleName', 'lastName', 'dateOfBirth', 'gender', 'nationality'],
  },
  {
    titleKey: 'patient.section.contact',
    fields: ['phone', 'email', 'address', 'preferredLanguage'],
  },
  {
    titleKey: 'patient.section.extra',
    fields: ['emergencyContactName', 'emergencyContactRelation', 'religion'],
  },
];

export function SessionDetail({ snapshot, notFound = false }: SessionDetailProps) {
  const { t, locale } = useTranslation();

  const status = useSessionStatus({
    status: snapshot?.status ?? 'idle',
    lastActivityAt: snapshot?.lastActivityAt ?? new Date().toISOString(),
    connected: snapshot?.connected ?? false,
  });

  if (notFound) {
    return (
      <Card>
        <CardBody className="py-16 text-center text-sm text-slate-500">
          {t('staff.notFound')}
        </CardBody>
      </Card>
    );
  }

  if (!snapshot) {
    return (
      <Card>
        <CardBody className="flex flex-col items-center gap-2 py-16 text-center">
          <Loader2 className="h-5 w-5 animate-spin text-slate-300" aria-hidden />
          <p className="text-sm text-slate-500">{t('connection.connecting')}</p>
        </CardBody>
      </Card>
    );
  }

  const displayValue = (field: PatientField): string => {
    const raw = String(snapshot.data[field] ?? '');
    if (!raw) return '';
    if (field === 'dateOfBirth') return formatDate(raw, locale);
    const labelKey = optionLabelKey(field, raw);
    return labelKey ? t(labelKey) : raw;
  };

  return (
    <Card>
      <CardHeader
        title={snapshot.displayName || t('staff.unnamed')}
        description={
          <span className="font-mono text-xs text-slate-400">{snapshot.sessionId}</span>
        }
        action={<StatusBadge status={status} />}
      />

      <CardBody className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <ProgressBar
            className="flex-1"
            value={snapshot.filledCount}
            total={snapshot.totalCount}
            label={t('staff.progress')}
          />
          <p className="text-xs text-slate-400">
            {t('staff.lastActivity')}: {formatRelativeTime(snapshot.lastActivityAt, t)}
          </p>
        </div>

        {SECTIONS.map((section) => (
          <section key={section.titleKey}>
            <h3 className="mb-2 text-sm font-semibold text-slate-700">
              {t(section.titleKey)}
            </h3>
            <dl className="grid grid-cols-1 gap-1 rounded-xl bg-slate-50/60 p-1 sm:grid-cols-2 xl:grid-cols-3">
              {section.fields.map((field) => (
                <LiveField
                  key={field}
                  labelKey={`field.${field}`}
                  value={displayValue(field)}
                  className={field === 'address' ? 'sm:col-span-2 xl:col-span-3' : undefined}
                />
              ))}
            </dl>
          </section>
        ))}
      </CardBody>
    </Card>
  );
}
