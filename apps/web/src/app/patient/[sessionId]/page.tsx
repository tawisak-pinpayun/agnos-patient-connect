import { PatientFormPageClient } from './PatientFormPageClient';

interface PageProps {
  params: Promise<{ sessionId: string }>;
}

export default async function PatientSessionPage({ params }: PageProps) {
  const { sessionId } = await params;
  return <PatientFormPageClient sessionId={sessionId} />;
}
