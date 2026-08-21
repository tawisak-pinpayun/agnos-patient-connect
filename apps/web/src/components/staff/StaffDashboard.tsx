'use client';

import { Download, MousePointerClick, Search, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SOCKET_EVENTS, type SessionSummary } from '@apc/shared';
import { SessionDetail } from './SessionDetail';
import { SessionList } from './SessionList';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Toaster, type Toast } from '@/components/ui/Toaster';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { useSessionSubscription } from '@/hooks/useSessionSubscription';
import { useSocket } from '@/hooks/useSocket';
import { useStaffSessions } from '@/hooks/useStaffSessions';
import { formatDate } from '@/lib/format';
import { useTranslation } from '@/hooks/useTranslation';

interface StaffDashboardProps {
  initialSessions: SessionSummary[];
}

export function StaffDashboard({ initialSessions }: StaffDashboardProps) {
  const { t, locale } = useTranslation();
  const router = useRouter();
  const { socket } = useSocket();
  const isDesktop = useMediaQuery('(min-width: 1024px)');

  const { sessions } = useStaffSessions(initialSessions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'filling' | 'submitted' | 'idle'>('all');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    const from = fromDate ? new Date(fromDate) : null;
    const to = toDate ? new Date(`${toDate}T23:59:59.999`) : null;
    return sessions.filter((s) => {
      const matchesQuery =
        !q ||
        s.displayName.toLowerCase().includes(q) ||
        s.sessionId.toLowerCase().includes(q);
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      const created = new Date(s.createdAt).getTime();
      const matchesDate =
        (!from || created >= from.getTime()) && (!to || created <= to.getTime());
      return matchesQuery && matchesStatus && matchesDate;
    });
  }, [sessions, query, statusFilter, fromDate, toDate]);

  const isFiltered =
    query.trim() !== '' || statusFilter !== 'all' || fromDate !== '' || toDate !== '';

  const prevById = useRef<Map<string, string>>(new Map());
  const isInitial = useRef(true);

  useEffect(() => {
    if (isInitial.current) {
      isInitial.current = false;
      prevById.current = new Map(sessions.map((s) => [s.sessionId, s.status]));
      return;
    }
    const newToasts: Toast[] = [];
    sessions.forEach((s) => {
      const prevStatus = prevById.current.get(s.sessionId);
      if (prevStatus !== 'submitted' && s.status === 'submitted') {
        newToasts.push({
          id: `${s.sessionId}-submitted`,
          message: t('notification.submitted', { name: s.displayName || t('staff.unnamed') }),
        });
      }
    });
    if (newToasts.length > 0) {
      setToasts((prev) => [...prev, ...newToasts]);
    }
    prevById.current = new Map(sessions.map((s) => [s.sessionId, s.status]));
  }, [sessions, t]);

  const handleDismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const stats = useMemo(() => {
    return {
      total: sessions.length,
      filling: sessions.filter((s) => s.status === 'filling').length,
      submitted: sessions.filter((s) => s.status === 'submitted').length,
      idle: sessions.filter((s) => s.status === 'idle').length,
    };
  }, [sessions]);
  const { snapshot, notFound } = useSessionSubscription(isDesktop ? selectedId : null);

  const handleExportFilteredCsv = useCallback(() => {
    const escape = (value: string) => `"${String(value).replace(/"/g, '""')}"`;
    const headers = [t('staff.csvSessionId'), t('staff.csvName'), t('staff.csvStatus'), t('staff.csvCreatedAt'), t('staff.csvLastActivity'), t('staff.csvSubmittedAt')];
    const rows = filteredSessions.map((s) => [
      s.sessionId,
      s.displayName || t('staff.unnamed'),
      t(`status.${s.status}`),
      formatDate(s.createdAt, locale),
      formatDate(s.lastActivityAt, locale),
      s.submittedAt ? formatDate(s.submittedAt, locale) : '',
    ]);
    const csv = [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patients-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [filteredSessions, t, locale]);

  const handleNewPatient = useCallback(() => {
    const sessionId = Math.random().toString(36).slice(2, 14);
    window.open(`/patient/${sessionId}`, '_blank');
  }, []);

  const handleDelete = useCallback((sessionId: string) => {
    setDeleteTarget(sessionId);
  }, []);

  const handleCancelDelete = useCallback(() => {
    setDeleteTarget(null);
  }, []);

  const handleConfirmDelete = useCallback(() => {
    if (!deleteTarget) return;
    socket.emit(SOCKET_EVENTS.sessionDelete, deleteTarget);
    if (selectedId === deleteTarget) setSelectedId(null);
    setDeleteTarget(null);
  }, [deleteTarget, selectedId, socket]);

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
      <header className="flex flex-wrap items-end justify-between gap-2 print:hidden">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 sm:text-2xl">
            {t('staff.heading')}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" size="sm" onClick={handleNewPatient}>
            <UserPlus className="h-4 w-4" aria-hidden />
            {t('staff.newPatient')}
          </Button>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            {t('staff.sessionCount', { count: sessions.length })}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2 print:hidden sm:grid-cols-4">
        <Card>
          <CardBody className="p-3 text-center">
            <p className="text-2xl font-bold text-brand-600">{stats.total}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('staff.statsTotal')}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{stats.filling}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('staff.statsFilling')}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{stats.submitted}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('staff.statsSubmitted')}</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="p-3 text-center">
            <p className="text-2xl font-bold text-slate-500 dark:text-slate-400">{stats.idle}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{t('staff.statsIdle')}</p>
          </CardBody>
        </Card>
      </div>

      <Card className="print:hidden">
        <CardBody className="flex flex-col flex-wrap gap-2 p-3 sm:flex-row sm:items-end">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500"
              aria-hidden
            />
            <Input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('staff.searchPlaceholder')}
              className="pl-9"
            />
          </div>
          <div className="flex flex-col gap-1 sm:w-40">
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('staff.fromDate')}</span>
            <Input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1 sm:w-40">
            <span className="text-xs text-slate-500 dark:text-slate-400">{t('staff.toDate')}</span>
            <Input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as 'all' | 'filling' | 'submitted' | 'idle')
            }
            className="sm:w-44"
          >
            <option value="all">{t('staff.filterAll')}</option>
            <option value="filling">{t('status.filling')}</option>
            <option value="submitted">{t('status.submitted')}</option>
            <option value="idle">{t('status.idle')}</option>
          </Select>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={handleExportFilteredCsv}
            disabled={filteredSessions.length === 0}
          >
            <Download className="h-4 w-4" aria-hidden />
            {t('staff.exportCsv')}
          </Button>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 gap-4 print:grid-cols-3 lg:grid-cols-3">
        <div className="print:hidden lg:col-span-1">
          <h2 className="mb-2 text-sm font-semibold text-slate-600 dark:text-slate-400">
            {t('staff.sessions')}
          </h2>
          <div className="lg:max-h-[calc(100dvh-14rem)] lg:overflow-y-auto lg:pr-1">
            <SessionList
              sessions={filteredSessions}
              activeSessionId={selectedId}
              onSelect={handleSelect}
              onDelete={handleDelete}
              emptyKey={isFiltered ? 'staff.noSearchResults' : 'staff.empty'}
              emptyHintKey={isFiltered ? 'staff.noSearchHint' : 'staff.emptyHint'}
            />
          </div>
        </div>

        <div className="hidden print:col-span-3 print:block lg:col-span-2 lg:block">
          {selectedId ? (
            <SessionDetail snapshot={snapshot} notFound={notFound} />
          ) : (
            <Card>
              <CardBody className="flex flex-col items-center gap-2 py-24 text-center">
                <MousePointerClick className="h-6 w-6 text-slate-300 dark:text-slate-600" aria-hidden />
                <p className="text-sm text-slate-500 dark:text-slate-400">{t('staff.selectPrompt')}</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={!!deleteTarget}
        title={t('staff.deleteTitle')}
        message={t('staff.deleteConfirm')}
        confirmLabel={t('staff.delete')}
        cancelLabel={t('staff.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />

      <Toaster toasts={toasts} onDismiss={handleDismissToast} />
    </div>
  );
}
