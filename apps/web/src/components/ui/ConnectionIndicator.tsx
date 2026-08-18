'use client';

import clsx from 'clsx';
import { Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useTranslation } from '@/hooks/useTranslation';
import type { ConnectionState } from '@/providers/SocketProvider';

const styles: Record<ConnectionState, string> = {
  connected: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  connecting: 'bg-amber-50 text-amber-700 border-amber-200',
  disconnected: 'bg-rose-50 text-rose-700 border-rose-200',
};

const labelKeys: Record<ConnectionState, string> = {
  connected: 'connection.connected',
  connecting: 'connection.connecting',
  disconnected: 'connection.disconnected',
};

export function ConnectionIndicator({ state }: { state: ConnectionState }) {
  const { t } = useTranslation();

  const Icon =
    state === 'connected' ? Wifi : state === 'connecting' ? Loader2 : WifiOff;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        styles[state],
      )}
      role="status"
      aria-live="polite"
    >
      <Icon
        className={clsx('h-3.5 w-3.5', state === 'connecting' && 'animate-spin')}
        aria-hidden
      />
      {t(labelKeys[state])}
    </span>
  );
}
