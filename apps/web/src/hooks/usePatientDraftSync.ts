'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
  DRAFT_DEBOUNCE_MS,
  SOCKET_EVENTS,
  type Ack,
  type FieldError,
  type PatientData,
  type PatientDataPatch,
  type SessionSnapshot,
} from '@apc/shared';
import { useSocket } from './useSocket';

export type SyncState = 'idle' | 'saving' | 'saved' | 'error';

interface SubmitOutcome {
  ok: boolean;
  errors?: FieldError[];
}

/**
 * จัดการการซิงค์ draft ของผู้ป่วยกับ Socket.IO server
 * - join ห้องของ session (และ join ใหม่อัตโนมัติเมื่อ reconnect)
 * - debounce การส่ง patch
 * - รวม patch ที่ค้างระหว่างหลุดการเชื่อมต่อไว้ในคิวเดียว
 */
export function usePatientDraftSync(sessionId: string | null) {
  const { socket, connectionState } = useSocket();
  const [snapshot, setSnapshot] = useState<SessionSnapshot | null>(null);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [submittedAt, setSubmittedAt] = useState<string | null>(null);

  const pendingPatch = useRef<PatientDataPatch>({});
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flush = useCallback(() => {
    if (!sessionId) return;
    const patch = pendingPatch.current;
    if (Object.keys(patch).length === 0) return;

    pendingPatch.current = {};
    setSyncState('saving');

    socket.emit(SOCKET_EVENTS.draftUpdate, { sessionId, patch }, (res: Ack) => {
      if (res?.ok) {
        setSyncState('saved');
      } else {
        // คืน patch เข้าคิวเพื่อลองส่งอีกครั้ง (ค่าใหม่กว่ามีสิทธิ์ทับ)
        pendingPatch.current = { ...patch, ...pendingPatch.current };
        setSyncState('error');
      }
    });
  }, [sessionId, socket]);

  const pushPatch = useCallback(
    (patch: PatientDataPatch) => {
      if (!sessionId || Object.keys(patch).length === 0) return;

      pendingPatch.current = { ...pendingPatch.current, ...patch };
      setSyncState('saving');

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(flush, DRAFT_DEBOUNCE_MS);
    },
    [flush, sessionId],
  );

  const submit = useCallback(
    (data: PatientData): Promise<SubmitOutcome> => {
      if (!sessionId) return Promise.resolve({ ok: false });

      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      pendingPatch.current = {};

      return new Promise((resolve) => {
        socket.emit(
          SOCKET_EVENTS.draftSubmit,
          { sessionId, data },
          (res: Ack<{ submittedAt: string }>) => {
            if (res?.ok) {
              setSubmittedAt(res.data?.submittedAt ?? new Date().toISOString());
              setSyncState('saved');
              resolve({ ok: true });
            } else {
              resolve({ ok: false, errors: res?.errors });
            }
          },
        );
      });
    },
    [sessionId, socket],
  );

  // join ห้องทุกครั้งที่ต่อสำเร็จ เพื่อ resync หลัง reconnect
  useEffect(() => {
    if (!sessionId) return;

    const join = () => {
      socket.emit(SOCKET_EVENTS.sessionJoin, { sessionId, role: 'patient' });
      // ส่ง patch ที่ค้างระหว่างหลุดการเชื่อมต่อ
      if (Object.keys(pendingPatch.current).length > 0) flush();
    };

    if (socket.connected) join();
    socket.on('connect', join);

    return () => {
      socket.off('connect', join);
    };
  }, [flush, sessionId, socket]);

  useEffect(() => {
    if (!sessionId) return;

    const onSnapshot = (next: SessionSnapshot) => {
      if (next.sessionId !== sessionId) return;
      setSnapshot(next);
      if (next.submittedAt) setSubmittedAt(next.submittedAt);
    };

    const onSubmitted = (payload: { sessionId: string; submittedAt: string }) => {
      if (payload.sessionId !== sessionId) return;
      setSubmittedAt(payload.submittedAt);
    };

    socket.on(SOCKET_EVENTS.sessionSnapshot, onSnapshot);
    socket.on(SOCKET_EVENTS.draftSubmitted, onSubmitted);

    return () => {
      socket.off(SOCKET_EVENTS.sessionSnapshot, onSnapshot);
      socket.off(SOCKET_EVENTS.draftSubmitted, onSubmitted);
    };
  }, [sessionId, socket]);

  useEffect(
    () => () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    },
    [],
  );

  return {
    snapshot,
    syncState,
    submittedAt,
    connectionState,
    pushPatch,
    submit,
  };
}
