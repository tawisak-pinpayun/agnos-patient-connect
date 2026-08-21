import type {
  FieldError,
  PatientData,
  PatientDataPatch,
  SessionSnapshot,
  SessionStatus,
  SessionSummary,
} from './types';

export const SOCKET_EVENTS = {
  sessionJoin: 'session:join',
  sessionSnapshot: 'session:snapshot',
  sessionWatch: 'session:watch',
  sessionUnwatch: 'session:unwatch',
  sessionSummary: 'session:summary',
  sessionStatus: 'session:status',
  staffJoin: 'staff:join',
  staffSnapshot: 'staff:snapshot',
  draftUpdate: 'draft:update',
  draftUpdated: 'draft:updated',
  draftSubmit: 'draft:submit',
  draftSubmitted: 'draft:submitted',
  sessionDelete: 'session:delete',
  sessionDeleted: 'session:deleted',
} as const;

export type SocketRole = 'patient' | 'staff';

export interface AckOk<T = undefined> {
  ok: true;
  data?: T;
}

export interface AckError {
  ok: false;
  message: string;
  errors?: FieldError[];
}

export type Ack<T = undefined> = AckOk<T> | AckError;

/** event ที่ server ส่งไปหา client */
export interface ServerToClientEvents {
  [SOCKET_EVENTS.sessionSnapshot]: (snapshot: SessionSnapshot) => void;
  [SOCKET_EVENTS.draftUpdated]: (payload: {
    sessionId: string;
    patch: PatientDataPatch;
    lastActivityAt: string;
    source: 'patient' | 'staff';
  }) => void;
  [SOCKET_EVENTS.sessionSummary]: (summary: SessionSummary) => void;
  [SOCKET_EVENTS.staffSnapshot]: (summaries: SessionSummary[]) => void;
  [SOCKET_EVENTS.sessionStatus]: (payload: {
    sessionId: string;
    status: SessionStatus;
    lastActivityAt: string;
    connected: boolean;
  }) => void;
  [SOCKET_EVENTS.draftSubmitted]: (payload: {
    sessionId: string;
    data: PatientData;
    submittedAt: string;
    source: 'patient' | 'staff';
  }) => void;
  [SOCKET_EVENTS.sessionDeleted]: (sessionId: string) => void;
}

/** event ที่ client ส่งมาหา server */
export interface ClientToServerEvents {
  [SOCKET_EVENTS.sessionJoin]: (
    payload: { sessionId: string; role: SocketRole },
    ack?: (res: Ack<SessionSnapshot>) => void,
  ) => void;
  [SOCKET_EVENTS.draftUpdate]: (
    payload: { sessionId: string; patch: PatientDataPatch },
    ack?: (res: Ack) => void,
  ) => void;
  [SOCKET_EVENTS.draftSubmit]: (
    payload: { sessionId: string; data: PatientData },
    ack?: (res: Ack<{ submittedAt: string }>) => void,
  ) => void;
  [SOCKET_EVENTS.sessionDelete]: (
    sessionId: string,
    ack?: (res: Ack) => void,
  ) => void;
  [SOCKET_EVENTS.staffJoin]: (ack?: (res: Ack<SessionSummary[]>) => void) => void;
  [SOCKET_EVENTS.sessionWatch]: (
    sessionId: string,
    ack?: (res: Ack<SessionSnapshot>) => void,
  ) => void;
  [SOCKET_EVENTS.sessionUnwatch]: (sessionId: string) => void;
}

export const ROOMS = {
  staffLobby: 'staff:lobby',
  session: (sessionId: string) => `session:${sessionId}`,
};
