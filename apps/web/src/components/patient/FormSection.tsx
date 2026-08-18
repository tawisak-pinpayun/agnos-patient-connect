'use client';

import type { ReactNode } from 'react';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { useTranslation } from '@/hooks/useTranslation';

interface FormSectionProps {
  titleKey: string;
  children: ReactNode;
}

export function FormSection({ titleKey, children }: FormSectionProps) {
  const { t } = useTranslation();

  return (
    <Card>
      <CardHeader title={t(titleKey)} />
      <CardBody>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
      </CardBody>
    </Card>
  );
}
