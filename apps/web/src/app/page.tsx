'use client';

import { ClipboardList, MonitorSmartphone, Radio } from 'lucide-react';
import Link from 'next/link';
import { Card, CardBody } from '@/components/ui/Card';
import { useTranslation } from '@/hooks/useTranslation';

export default function HomePage() {
  const { t } = useTranslation();

  const cards = [
    {
      href: '/patient',
      icon: ClipboardList,
      titleKey: 'home.patient.title',
      descKey: 'home.patient.desc',
      ctaKey: 'home.patient.cta',
      accent: 'bg-brand-50 text-brand-600',
    },
    {
      href: '/staff',
      icon: MonitorSmartphone,
      titleKey: 'home.staff.title',
      descKey: 'home.staff.desc',
      ctaKey: 'home.staff.cta',
      accent: 'bg-emerald-50 text-emerald-600',
    },
  ];

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-slate-900 sm:text-3xl">
          {t('home.heading')}
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-sm text-slate-500">
          {t('home.subheading')}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {cards.map((card) => (
          <Link key={card.href} href={card.href} className="group block">
            <Card className="h-full transition group-hover:border-brand-300 group-hover:shadow-md">
              <CardBody className="flex h-full flex-col gap-3">
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.accent}`}
                >
                  <card.icon className="h-5 w-5" aria-hidden />
                </span>
                <h2 className="text-lg font-semibold text-slate-900">
                  {t(card.titleKey)}
                </h2>
                <p className="flex-1 text-sm text-slate-500">{t(card.descKey)}</p>
                <span className="text-sm font-medium text-brand-600 group-hover:underline">
                  {t(card.ctaKey)} →
                </span>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>

      <p className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <Radio className="h-3.5 w-3.5" aria-hidden />
        {t('home.howItWorks')}
      </p>
    </div>
  );
}
