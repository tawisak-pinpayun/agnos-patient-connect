'use client';

import { Download, Loader2, Pencil, Printer } from 'lucide-react';
import { useState } from 'react';
import type { PatientField, SessionSnapshot } from '@apc/shared';
import { StaffEditForm } from './StaffEditForm';
import { LiveField } from './LiveField';
import { StatusBadge } from './StatusBadge';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { PATIENT_FIELDS } from '@apc/shared';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { useSessionStatus } from '@/hooks/useSessionStatus';
import { useTranslation } from '@/hooks/useTranslation';
import { calculateAge, formatDate, formatRelativeTime } from '@/lib/format';
import { optionLabelKey } from '@/lib/options';

interface SessionDetailProps {
  snapshot: SessionSnapshot | null;
  notFound?: boolean;
}

const SECTIONS: { titleKey: string; fields: PatientField[] }[] = [
  {
    titleKey: 'patient.section.personal',
    fields: ['firstName', 'middleName', 'lastName', 'dateOfBirth', 'gender', 'genderOther', 'nationality', 'nationalityOther'],
  },
  {
    titleKey: 'patient.section.contact',
    fields: ['phone', 'email', 'address', 'preferredLanguage', 'preferredLanguageOther'],
  },
  {
    titleKey: 'patient.section.extra',
    fields: ['emergencyContactName', 'emergencyContactRelation'],
  },
];

export function SessionDetail({ snapshot, notFound = false }: SessionDetailProps) {
  const { t, locale } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);

  const status = useSessionStatus({
    status: snapshot?.status ?? 'idle',
    lastActivityAt: snapshot?.lastActivityAt ?? new Date().toISOString(),
    connected: snapshot?.connected ?? false,
  });

  const age = snapshot ? calculateAge(snapshot.data.dateOfBirth) : null;

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

  const handleExportCsv = () => {
    if (!snapshot) return;
    const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
    const sessionHeaders = ['Session ID', 'Display Name', 'Status', 'Submitted At', 'Last Activity At'];
    const fieldHeaders = PATIENT_FIELDS.map((field) => t(`field.${field}`));
    const headers = [...sessionHeaders, ...fieldHeaders];
    const values = [
      snapshot.sessionId,
      snapshot.displayName || t('staff.unnamed'),
      snapshot.status,
      snapshot.submittedAt ? formatDate(snapshot.submittedAt, locale) : '',
      formatDate(snapshot.lastActivityAt, locale),
      ...PATIENT_FIELDS.map((field) => displayValue(field)),
    ];
    const csv = [headers.map(escape).join(','), values.map(escape).join(',')].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patient-${snapshot.sessionId}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader
        title={snapshot.displayName || t('staff.unnamed')}
        description={
          <span className="font-mono text-xs text-slate-400">{snapshot.sessionId}</span>
        }
        action={
          <div className="flex items-center gap-2 print:hidden">
            <StatusBadge status={status} />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
            >
              <Printer className="h-4 w-4" aria-hidden />
              {t('staff.print')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleExportCsv}
            >
              <Download className="h-4 w-4" aria-hidden />
              {t('staff.exportCsv')}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing((prev) => !prev)}
            >
              <Pencil className="h-4 w-4" aria-hidden />
              {t(isEditing ? 'staff.cancel' : 'staff.edit')}
            </Button>
          </div>
        }
      />

      <CardBody className="space-y-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <ProgressBar
            className="flex-1"
            value={snapshot.filledCount}
            total={snapshot.totalCount}
            label={t('staff.progress')}
          />
          <p className="text-xs text-slate-400 dark:text-slate-500">
            {t('staff.lastActivity')}: {formatRelativeTime(snapshot.lastActivityAt, t)}
          </p>
        </div>

        {isEditing ? (
          <StaffEditForm
            sessionId={snapshot.sessionId}
            initialData={snapshot.data}
            onClose={() => setIsEditing(false)}
          />
        ) : (
          SECTIONS.map((section) => (
            <section key={section.titleKey}>
              <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
                {t(section.titleKey)}
              </h3>
              <dl className="grid grid-cols-1 gap-1 rounded-xl bg-slate-50/60 p-1 dark:bg-slate-800/60 sm:grid-cols-2 xl:grid-cols-3">
                {section.fields.map((field) => (
                  <LiveField
                    key={field}
                    labelKey={`field.${field}`}
                    value={displayValue(field)}
                    extra={field === 'dateOfBirth' && age !== null ? t('field.age', { value: age }) : undefined}
                    className={field === 'address' ? 'sm:col-span-2 xl:col-span-3' : undefined}
                  />
                ))}
              </dl>
            </section>
          ))
        )}

        {snapshot.audit.length > 0 && (
          <section>
            <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              {t('staff.auditLog')}
            </h3>
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white dark:divide-slate-700 dark:border-slate-700 dark:bg-slate-900">
              {snapshot.audit
                .slice()
                .reverse()
                .slice(0, 20)
                .map((entry, index) => (
                  <li
                    key={index}
                    className="flex items-center justify-between px-3 py-2 text-sm"
                  >
                    <span className="text-slate-600 dark:text-slate-300">
                      {t(`staff.auditSource_${entry.source}`)} · {t(`staff.auditAction_${entry.action}`)}
                    </span>
                    <span className="text-xs text-slate-400 dark:text-slate-500">
                      {formatRelativeTime(entry.at, t)}
                    </span>
                  </li>
                ))}
            </ul>
          </section>
        )}
      </CardBody>
    </Card>
  );
}
