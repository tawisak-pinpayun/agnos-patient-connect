import { StaffSessionPageClient } from './StaffSessionPageClient';

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function StaffSessionPage({ params }: PageProps) {
  const { sessionId } = await params;
  return <StaffSessionPageClient sessionId={sessionId} />;
}
