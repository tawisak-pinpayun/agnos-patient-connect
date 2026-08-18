'use client';

import { useEffect, useState } from 'react';
import {
  IDLE_THRESHOLD_MS,
  STATUS_RECHECK_INTERVAL_MS,
  type SessionStatus,
} from '@apc/shared';

interface Options {
  status: SessionStatus;
  lastActivityAt: string;
  connected: boolean;
}

/**
 * คำนวณสถานะฝั่ง client ด้วย timer เพื่อให้ badge เปลี่ยนเป็น idle
 * ได้ทันทีโดยไม่ต้องรอ event จาก server
 */
export function useSessionStatus({
  status,
  lastActivityAt,
  connected,
}: Options): SessionStatus {
  const [derived, setDerived] = useState<SessionStatus>(status);

  useEffect(() => {
    const compute = (): SessionStatus => {
      if (status === 'submitted') return 'submitted';
      const age = Date.now() - new Date(lastActivityAt).getTime();
      if (connected && age < IDLE_THRESHOLD_MS) return 'filling';
      return 'idle';
    };

    setDerived(compute());

    if (status === 'submitted') return;

    const timer = setInterval(() => setDerived(compute()), STATUS_RECHECK_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [status, lastActivityAt, connected]);

  return derived;
}
