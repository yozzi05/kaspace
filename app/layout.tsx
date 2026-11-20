import type { Metadata, Viewport } from 'next';
import { Familjen_Grotesk, Inter, Inter_Tight, JetBrains_Mono } from 'next/font/google';
import 'lenis/dist/lenis.css';
import './globals.css';
import { CustomCursor } from '@/components/CustomCursor';
import { DotGrid } from '@/components/DotGrid';
import { SmoothScroll } from '@/components/SmoothScroll';
import { THEME_GUARD } from '@/lib/themeGuard';

const familjen = Familjen_Grotesk({
  subsets: ['latin'],
  weight: '700',
  variable: '--font-familjen',
  display: 'swap',
});

const interTight = Inter_Tight({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '600', '700', '800'],
  variable: '--font-inter-tight',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500'],
  variable: '--font-inter',
  display: 'swap',
});

const jetbrains = JetBrains_Mono({
  subsets: ['latin', 'cyrillic'],
  weight: ['500', '700'],
  variable: '--font-jetbrains',
  display: 'swap',
});

/* Адрес сайта без basePath, например https://example.github.io. Нужен для абсолютных ссылок в соцсетях. */
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? '';
const OG_TITLE = 'kaspace — сайты, приложения и ИИ-автоматизация для бизнеса';
const OG_TEXT =
  'Веб-агентство kaspace: кастомные сайты, приложения, боты и ИИ-автоматизация. Бесплатное демо первого экрана до оплаты.';

export const metadata: Metadata = {
  metadataBase: SITE_URL ? new URL(SITE_URL) : undefined,
  alternates: SITE_URL ? { canonical: `${BASE_PATH}/` } : undefined,
  openGraph: {
    type: 'website',
    locale: 'ru_RU',
    siteName: 'kaspace',
    title: OG_TITLE,
    description: OG_TEXT,
    url: `${BASE_PATH}/`,
    images: [{ url: `${BASE_PATH}/og.png`, width: 1200, height: 630, alt: 'kaspace: сайты, приложения, ИИ-автоматизация' }],
  },
  twitter: { card: 'summary_large_image', title: OG_TITLE, description: OG_TEXT, images: [`${BASE_PATH}/og.png`] },
  title: 'kaspace — сайты, приложения и ИИ-автоматизация для бизнеса',
  description:
    'Веб-агентство kaspace: кастомные сайты, приложения, боты и ИИ-автоматизация. Бесплатное демо первого экрана до оплаты.',
};

export const viewport: Viewport = {
  themeColor: '#F0EEE8', // светлая тема по умолчанию; при смене темы значение обновляет lib/theme.ts
  colorScheme: 'dark light', // сама тема приходит из data-mode на <html>, см. lib/theme.ts
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ru"
      suppressHydrationWarning /* data-intro ставится скриптом до гидрации */
      className={`${familjen.variable} ${interTight.variable} ${inter.variable} ${jetbrains.variable}`}
    >
      <body>
        <script dangerouslySetInnerHTML={{ __html: THEME_GUARD }} />
        <DotGrid />
        {children}
        <SmoothScroll />
        <CustomCursor />
      </body>
    </html>
  );
}
