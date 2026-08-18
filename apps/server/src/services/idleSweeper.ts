import { IDLE_SWEEP_INTERVAL_MS, ROOMS, SOCKET_EVENTS } from '@apc/shared';
import type { AppServer } from '../socket/handlers';
import { collectIdleSessions } from './sessionService';

/**
 * กวาดหา session ที่หยุดกรอกเกิน threshold แล้ว broadcast สถานะ idle
 * ทำให้หน้าเจ้าหน้าที่เห็นสถานะเปลี่ยนเองแม้ไม่มี event จากผู้ป่วย
 */
export function startIdleSweeper(io: AppServer): () => void {
  const timer = setInterval(async () => {
    try {
      const idleSummaries = await collectIdleSessions();

      for (const summary of idleSummaries) {
        io.to(ROOMS.staffLobby).emit(SOCKET_EVENTS.sessionSummary, summary);
        io.to(ROOMS.session(summary.sessionId)).emit(SOCKET_EVENTS.sessionStatus, {
          sessionId: summary.sessionId,
          status: summary.status,
          lastActivityAt: summary.lastActivityAt,
          connected: summary.connected,
        });
      }
    } catch (error) {
      console.error('[idleSweeper] sweep failed', error);
    }
  }, IDLE_SWEEP_INTERVAL_MS);

  return () => clearInterval(timer);
}
