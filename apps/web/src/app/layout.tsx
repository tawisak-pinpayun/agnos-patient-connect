import type { Metadata, Viewport } from 'next';
import { Noto_Sans_Thai } from 'next/font/google';
import type { ReactNode } from 'react';
import './globals.css';
import { AppHeader } from '@/components/layout/AppHeader';
import { LanguageProvider } from '@/providers/LanguageProvider';
import { SocketProvider } from '@/providers/SocketProvider';
import { ThemeProvider } from '@/providers/ThemeProvider';

const notoSansThai = Noto_Sans_Thai({
  subsets: ['thai', 'latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
  variable: '--font-noto-thai',
});

export const metadata: Metadata = {
  title: 'Agnos Patient Connect',
  description: 'ระบบกรอกข้อมูลผู้ป่วยแบบเรียลไทม์ด้วย Next.js และ Socket.IO',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#1b70f0',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="th" className={notoSansThai.variable} suppressHydrationWarning>
      <body className="min-h-dvh font-sans">
        <ThemeProvider>
          <LanguageProvider>
            <SocketProvider>
              <AppHeader />
              <main className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                {children}
              </main>
            </SocketProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
