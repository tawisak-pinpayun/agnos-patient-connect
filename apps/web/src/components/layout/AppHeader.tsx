'use client';

import clsx from 'clsx';
import { Activity, Moon, Sun } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectionIndicator } from '@/components/ui/ConnectionIndicator';
import { LanguageToggle } from '@/components/ui/LanguageToggle';
import { useSocket } from '@/hooks/useSocket';
import { useTheme } from '@/providers/ThemeProvider';
import { useTranslation } from '@/hooks/useTranslation';

const NAV_ITEMS = [
  { href: '/patient', labelKey: 'nav.patient' },
  { href: '/staff', labelKey: 'nav.staff' },
];

export function AppHeader() {
  const { t } = useTranslation();
  const { connectionState } = useSocket();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/90 backdrop-blur print:hidden dark:border-slate-700 dark:bg-slate-900/90">
      <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600">
            <Activity className="h-4 w-4 text-white" aria-hidden />
          </span>
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base">
            {t('app.title')}
          </span>
        </Link>

        <nav className="order-3 flex w-full gap-1 sm:order-none sm:w-auto">
          {NAV_ITEMS.map((item) => {
            const active = pathname?.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={clsx(
                  'flex-1 rounded-lg px-3 py-1.5 text-center text-sm font-medium transition sm:flex-none',
                  active
                    ? 'bg-brand-50 text-brand-700 dark:bg-slate-800 dark:text-brand-300'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800',
                )}
              >
                {t(item.labelKey)}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            className="rounded-full p-1.5 text-slate-500 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? (
              <Sun className="h-4 w-4" aria-hidden />
            ) : (
              <Moon className="h-4 w-4" aria-hidden />
            )}
          </button>
          <ConnectionIndicator state={connectionState} />
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
