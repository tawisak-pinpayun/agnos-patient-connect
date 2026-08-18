import {
  ROOMS,
  SOCKET_EVENTS,
  type ClientToServerEvents,
  type ServerToClientEvents,
} from '@apc/shared';
import type { Server, Socket } from 'socket.io';
import * as service from '../services/sessionService';
import {
  addPatientSocket,
  isPatientConnected,
  removeSocketEverywhere,
} from '../services/presence';

export type AppServer = Server<ClientToServerEvents, ServerToClientEvents>;
export type AppSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

export function registerSocketHandlers(io: AppServer): void {
  io.on('connection', (socket: AppSocket) => {
    socket.on(SOCKET_EVENTS.sessionJoin, async (payload, ack) => {
      const sessionId = payload?.sessionId;
      if (!service.isValidSessionId(sessionId)) {
        ack?.({ ok: false, message: 'INVALID_SESSION_ID' });
        return;
      }

      try {
        await socket.join(ROOMS.session(sessionId));

        if (payload.role === 'patient') {
          addPatientSocket(sessionId, socket.id);
        }

        const snapshot = await service.joinSession(sessionId);
        socket.emit(SOCKET_EVENTS.sessionSnapshot, snapshot);
        ack?.({ ok: true, data: snapshot });

        if (payload.role === 'patient') {
          io.to(ROOMS.staffLobby).emit(SOCKET_EVENTS.sessionSummary, snapshot);
          io.to(ROOMS.session(sessionId)).emit(SOCKET_EVENTS.sessionStatus, {
            sessionId,
            status: snapshot.status,
            lastActivityAt: snapshot.lastActivityAt,
            connected: true,
          });
        }
      } catch (error) {
        console.error('[socket] session:join failed', error);
        ack?.({ ok: false, message: 'JOIN_FAILED' });
      }
    });

    socket.on(SOCKET_EVENTS.draftUpdate, async (payload, ack) => {
      const sessionId = payload?.sessionId;
      if (!service.isValidSessionId(sessionId)) {
        ack?.({ ok: false, message: 'INVALID_SESSION_ID' });
        return;
      }

      try {
        const result = await service.updateDraft(sessionId, payload.patch);

        socket.to(ROOMS.session(sessionId)).emit(SOCKET_EVENTS.draftUpdated, {
          sessionId,
          patch: result.patch,
          lastActivityAt: result.lastActivityAt,
        });
        io.to(ROOMS.staffLobby).emit(SOCKET_EVENTS.sessionSummary, result.summary);
        ack?.({ ok: true });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'DRAFT_UPDATE_FAILED';
        if (message !== 'INVALID_PATCH' && message !== 'EMPTY_PATCH') {
          console.error('[socket] draft:update failed', error);
        }
        ack?.({ ok: false, message });
      }
    });

    socket.on(SOCKET_EVENTS.draftSubmit, async (payload, ack) => {
      const sessionId = payload?.sessionId;
      if (!service.isValidSessionId(sessionId)) {
        ack?.({ ok: false, message: 'INVALID_SESSION_ID' });
        return;
      }

      const validation = service.validatePatientData(payload.data);
      if (!validation.ok) {
        ack?.({ ok: false, message: 'VALIDATION_FAILED', errors: validation.errors });
        return;
      }

      try {
        const result = await service.submitDraft(sessionId, validation.data);

        io.to(ROOMS.session(sessionId)).emit(SOCKET_EVENTS.draftSubmitted, {
          sessionId,
          data: result.data,
          submittedAt: result.submittedAt,
        });
        io.to(ROOMS.staffLobby).emit(SOCKET_EVENTS.sessionSummary, result.summary);
        ack?.({ ok: true, data: { submittedAt: result.submittedAt } });
      } catch (error) {
        console.error('[socket] draft:submit failed', error);
        ack?.({ ok: false, message: 'SUBMIT_FAILED' });
      }
    });

    socket.on(SOCKET_EVENTS.staffJoin, async (ack) => {
      try {
        await socket.join(ROOMS.staffLobby);
        const summaries = await service.listSummaries();
        socket.emit(SOCKET_EVENTS.staffSnapshot, summaries);
        ack?.({ ok: true, data: summaries });
      } catch (error) {
        console.error('[socket] staff:join failed', error);
        ack?.({ ok: false, message: 'STAFF_JOIN_FAILED' });
      }
    });

    socket.on(SOCKET_EVENTS.sessionWatch, async (sessionId, ack) => {
      if (!service.isValidSessionId(sessionId)) {
        ack?.({ ok: false, message: 'INVALID_SESSION_ID' });
        return;
      }

      try {
        await socket.join(ROOMS.session(sessionId));
        const snapshot = await service.getSnapshot(sessionId);
        if (!snapshot) {
          ack?.({ ok: false, message: 'SESSION_NOT_FOUND' });
          return;
        }
        socket.emit(SOCKET_EVENTS.sessionSnapshot, snapshot);
        ack?.({ ok: true, data: snapshot });
      } catch (error) {
        console.error('[socket] session:watch failed', error);
        ack?.({ ok: false, message: 'WATCH_FAILED' });
      }
    });

    socket.on(SOCKET_EVENTS.sessionUnwatch, (sessionId) => {
      if (!service.isValidSessionId(sessionId)) return;
      void socket.leave(ROOMS.session(sessionId));
    });

    socket.on('disconnect', async () => {
      const affected = removeSocketEverywhere(socket.id);

      for (const sessionId of affected) {
        if (isPatientConnected(sessionId)) continue;

        const summary = await service.refreshSummary(sessionId);
        if (!summary) continue;

        io.to(ROOMS.staffLobby).emit(SOCKET_EVENTS.sessionSummary, summary);
        io.to(ROOMS.session(sessionId)).emit(SOCKET_EVENTS.sessionStatus, {
          sessionId,
          status: summary.status,
          lastActivityAt: summary.lastActivityAt,
          connected: false,
        });
      }
    });
  });
}
