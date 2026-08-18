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
  const [sessions, setSessions] = useState<SessionSummary[]>(sortSummaries(initial));
  const [hydrated, setHydrated] = useState(initial.length > 0);

  useEffect(() => {
    const join = () => socket.emit(SOCKET_EVENTS.staffJoin);

    const onSnapshot = (list: SessionSummary[]) => {
      setSessions(sortSummaries(list));
      setHydrated(true);
    };

    const onSummary = (summary: SessionSummary) => {
      setSessions((prev) => {
        const next = prev.filter((item) => item.sessionId !== summary.sessionId);
        next.push(summary);
        return sortSummaries(next);
      });
    };

    socket.on(SOCKET_EVENTS.staffSnapshot, onSnapshot);
    socket.on(SOCKET_EVENTS.sessionSummary, onSummary);
    socket.on('connect', join);
    if (socket.connected) join();

    return () => {
      socket.off(SOCKET_EVENTS.staffSnapshot, onSnapshot);
      socket.off(SOCKET_EVENTS.sessionSummary, onSummary);
      socket.off('connect', join);
    };
  }, [socket]);

  return { sessions, hydrated, connectionState };
}
