/**
 * ติดตามว่า socket ของผู้ป่วยคนไหนยังต่ออยู่ (in-memory)
 * ใช้ประกอบการตัดสินสถานะ filling / idle
 */
const patientSockets = new Map<string, Set<string>>();

export function addPatientSocket(sessionId: string, socketId: string): void {
  const set = patientSockets.get(sessionId) ?? new Set<string>();
  set.add(socketId);
  patientSockets.set(sessionId, set);
}

export function removePatientSocket(sessionId: string, socketId: string): void {
  const set = patientSockets.get(sessionId);
  if (!set) return;
  set.delete(socketId);
  if (set.size === 0) patientSockets.delete(sessionId);
}

export function removeSocketEverywhere(socketId: string): string[] {
  const affected: string[] = [];
  for (const [sessionId, set] of patientSockets.entries()) {
    if (set.delete(socketId)) {
      affected.push(sessionId);
      if (set.size === 0) patientSockets.delete(sessionId);
    }
  }
  return affected;
}

export function isPatientConnected(sessionId: string): boolean {
  return (patientSockets.get(sessionId)?.size ?? 0) > 0;
}
