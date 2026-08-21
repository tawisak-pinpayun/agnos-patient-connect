'use client';

import { useEffect, useState } from 'react';
import { SOCKET_EVENTS, type SessionSummary } from '@apc/shared';
import { useSocket } from './useSocket';

function sortSummaries(list: SessionSummary[]): SessionSummary[] {
  return [...list].sort(
    (a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime(),
  );
}

/** เข้าห้อง staff lobby แล้วรับ list ผู้ป่วยทั้งหมดแบบเรียลไทม์ */
export function useStaffSessions(initial: SessionSummary[] = []) {
  const { socket, connectionState } = useSocket();
  const [sessions, setSessions] = useState<SessionSummary[]>(
    sortSummaries(initial.filter((s) => s.filledCount > 0)),
  );
  const [hydrated, setHydrated] = useState(initial.length > 0);

  useEffect(() => {
    const join = () => socket.emit(SOCKET_EVENTS.staffJoin);

    const onSnapshot = (list: SessionSummary[]) => {
      setSessions(sortSummaries(list.filter((s) => s.filledCount > 0)));
      setHydrated(true);
    };

    const onSummary = (summary: SessionSummary) => {
      if (summary.filledCount === 0) {
        setSessions((prev) => prev.filter((item) => item.sessionId !== summary.sessionId));
        return;
      }
      setSessions((prev) => {
        const next = prev.filter((item) => item.sessionId !== summary.sessionId);
        next.push(summary);
        return sortSummaries(next);
      });
    };

    const onDeleted = (sessionId: string) => {
      setSessions((prev) => prev.filter((item) => item.sessionId !== sessionId));
    };

    socket.on(SOCKET_EVENTS.staffSnapshot, onSnapshot);
    socket.on(SOCKET_EVENTS.sessionSummary, onSummary);
    socket.on(SOCKET_EVENTS.sessionDeleted, onDeleted);
    socket.on('connect', join);
    if (socket.connected) join();

    return () => {
      socket.off(SOCKET_EVENTS.staffSnapshot, onSnapshot);
      socket.off(SOCKET_EVENTS.sessionSummary, onSummary);
      socket.off(SOCKET_EVENTS.sessionDeleted, onDeleted);
      socket.off('connect', join);
    };
  }, [socket]);

  return { sessions, hydrated, connectionState };
}
