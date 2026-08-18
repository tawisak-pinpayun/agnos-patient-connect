'use client';

import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';

function generateSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID().replace(/-/g, '').slice(0, 20);
  }
  return Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

/** สร้าง sessionId ใหม่แล้วพาไปหน้าฟอร์ม (session ถูกสร้างใน DB ตอน socket join) */
export default function NewPatientSessionPage() {
  const router = useRouter();
  const { t } = useTranslation();

  useEffect(() => {
    router.replace(`/patient/${generateSessionId()}`);
  }, [router]);

  return (
    <div className="flex flex-col items-center gap-3 py-24 text-center">
      <Loader2 className="h-6 w-6 animate-spin text-brand-500" aria-hidden />
      <p className="text-sm text-slate-500">{t('patient.creatingSession')}</p>
    </div>
  );
}
