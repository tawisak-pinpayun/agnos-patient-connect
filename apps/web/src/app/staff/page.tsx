import { StaffDashboard } from '@/components/staff/StaffDashboard';
import { fetchSessions } from '@/lib/api';
import type { SessionSummary } from '@apc/shared';

export const dynamic = 'force-dynamic';

export default async function StaffPage() {
  let initialSessions: SessionSummary[] = [];

  // hydrate ครั้งแรกผ่าน REST เพื่อไม่ต้องรอ socket ต่อสำเร็จ (Render อาจ cold start)
  try {
    const data = await fetchSessions();
    initialSessions = data.sessions;
  } catch {
    initialSessions = [];
  }

  return <StaffDashboard initialSessions={initialSessions} />;
}
