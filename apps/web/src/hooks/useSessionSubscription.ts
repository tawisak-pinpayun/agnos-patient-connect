'use client';

import { useEffect, useState } from 'react';
import {
  SOCKET_EVENTS,
  type PatientDataPatch,
  type SessionSnapshot,
  type SessionStatus,
} from '@apc/shared';
import { useSocket } from './useSocket';

/**
 * ฝั่งเจ้าหน้าที่: เฝ้าดู session หนึ่งราย แล้ว merge patch ที่ได้รับ
 * เข้ากับ snapshot ที่มีอยู่ (server ส่งเฉพาะ field ที่เปลี่ยน)
 */
export function useSessionSubscription(sessionId: string | null) {
  const { socket, connectionState } = useSocket();
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [changedFields, setChangedFields] = useState<string[]>([]);

  useEffect(() => {
    if (!sessionId) return;

    setSnapshot(null);
    setNotFound(false);

    const watch = () => {
      socket.emit(SOCKET_EVENTS.sessionWatch, sessionId, (res) => {
        if (!res.ok) setNotFound(true);
      });
    };

    const onSnapshot = (next: SessionSnapshot) => {
      if (next.sessionId !== sessionId) return;
      setSnapshot(next);
      setNotFound(false);
    };

    const onDraftUpdated = (payload: {
      sessionId: string;
      patch: PatientDataPatch;
      lastActivityAt: string;
      source: 'patient' | 'staff';
    }) => {
      if (payload.sessionId !== sessionId) return;

      setChangedFields(Object.keys(payload.patch));
      setSnapshot((prev) =>
        prev
          ? {
              ...prev,
              data: { ...prev.data, ...payload.patch },
              lastActivityAt: payload.lastActivityAt,
              status: prev.status === 'submitted' ? 'submitted' : 'filling',
              connected: true,
              audit: [
                ...prev.audit,
                { at: payload.lastActivityAt, source: payload.source, action: 'draft' },
              ],
            }
          : prev,
      );
    };

    const onStatus = (payload: {
      sessionId: string;
      status: SessionStatus;
      lastActivityAt: string;
      connected: boolean;
    }) => {
      if (payload.sessionId !== sessionId) return;
      setSnapshot((prev) =>
        prev
          ? {
              ...prev,
              status: payload.status,
              lastActivityAt: payload.lastActivityAt,
              connected: payload.connected,
            }
          : prev,
      );
    };

    const onSubmitted = (payload: {
      sessionId: string;
      data: SessionSnapshot['data'];
      submittedAt: string;
      source: 'patient' | 'staff';
    }) => {
      if (payload.sessionId !== sessionId) return;
      setSnapshot((prev) =>
        prev
          ? {
              ...prev,
              data: payload.data,
              status: 'submitted',
              submittedAt: payload.submittedAt,
              lastActivityAt: payload.submittedAt,
              audit: [
                ...prev.audit,
                { at: payload.submittedAt, source: payload.source, action: 'submit' },
              ],
            }
          : prev,
      );
    };

    socket.on(SOCKET_EVENTS.sessionSnapshot, onSnapshot);
    socket.on(SOCKET_EVENTS.draftUpdated, onDraftUpdated);
    socket.on(SOCKET_EVENTS.sessionStatus, onStatus);
    socket.on(SOCKET_EVENTS.draftSubmitted, onSubmitted);
    socket.on('connect', watch);
    if (socket.connected) watch();

    return () => {
      socket.emit(SOCKET_EVENTS.sessionUnwatch, sessionId);
      socket.off(SOCKET_EVENTS.sessionSnapshot, onSnapshot);
      socket.off(SOCKET_EVENTS.draftUpdated, onDraftUpdated);
      socket.off(SOCKET_EVENTS.sessionStatus, onStatus);
      socket.off(SOCKET_EVENTS.draftSubmitted, onSubmitted);
      socket.off('connect', watch);
    };
  }, [sessionId, socket]);

  return { snapshot, notFound, changedFields, connectionState };
}
