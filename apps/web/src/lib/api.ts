import type { SessionSnapshot, SessionSummary } from '@apc/shared';

const SERVER_API_URL =
  process.env.SERVER_API_URL ??
  process.env.NEXT_PUBLIC_SOCKET_URL ??
  'http://localhost:4000';

/** เรียก REST ของ socket server (ใช้จาก route handler ฝั่ง server เท่านั้น) */
async function serverFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${SERVER_API_URL}${path}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return (await res.json()) as T;
}

export function fetchSessions(): Promise<{ sessions: SessionSummary[] }> {
  return serverFetch('/api/sessions');
}

export function fetchSession(sessionId: string): Promise<{ session: SessionSnapshot }> {
  return serverFetch(`/api/sessions/${sessionId}`);
}

export async function createSession(): Promise<SessionSnapshot> {
  const res = await fetch(`${SERVER_API_URL}/api/sessions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`Failed to create session: ${res.status}`);
  const body = (await res.json()) as { session: SessionSnapshot };
  return body.session;
}
