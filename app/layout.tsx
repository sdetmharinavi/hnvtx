// app/layout.tsx
import type { Metadata, Viewport } from 'next';
import localFont from 'next/font/local';
import './globals.css';
import 'react-datepicker/dist/react-datepicker.css';
import PolyfillLoader from '@/components/polyfills/PolyfillLoader';
import { ToastProvider } from '@/providers/ToastProvider';
import ThemeProvider from '@/providers/ThemeProvider';
import PwaRegistry from '@/components/pwa/PwaRegistry';
import { QueryProvider } from '@/providers/QueryProvider';
import { AppearanceProvider } from '@/providers/AppearanceProvider';
import { NextFontWithVariable } from 'next/dist/compiled/@next/font';

const defaultUrl: string = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : 'http://localhost:3000';

const fontSans: NextFontWithVariable = localFont({
  src: '../public/fonts/Inter.woff2',
  display: 'swap',
  variable: '--font-sans',
  preload: false,
  fallback: ['system-ui', 'arial'],
});

const fontHeading: NextFontWithVariable = localFont({
  src: '../public/fonts/Montserrat.woff2',
  display: 'swap',
  variable: '--font-heading',
  preload: false,
  fallback: ['system-ui', 'times new roman'],
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#020617' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(defaultUrl),
  applicationName: 'hnvtm',
  title: {
    default: 'Harinavi Transmission Maintenance',
    template: '%s - PWA App',
  },
  description: 'We provide reliable telecom transmission maintenance services.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Harinavi Transmission Maintenance',
    startupImage: [
      {
        url: '/icon-512x512.png',
      },
    ],
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    shortcut: '/favicon.ico',
    apple: [{ url: '/icon-192x192.png', sizes: '192x192' }],
    icon: '/favicon.ico',
  },
  verification: {
    google: 'blxSMw8diU6aIu2LCV7jb7x3wJQOT-Mm54-HzvSAQQE',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' suppressHydrationWarning>
      <head>
        <link rel='apple-touch-startup-image' href='/splash.png' />
      </head>
      <body className={`${fontSans.variable} ${fontHeading.variable} antialiased`}>
        {/* THE FIX: Mount point for react-datepicker portals inside modals */}
        <div id='root-portal'></div>

        <PolyfillLoader />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  let theme = 'system';
                  const storedValue = localStorage.getItem('theme-storage');

                  if (storedValue) {
                    try {
                      const parsed = JSON.parse(storedValue);
                      if (parsed && parsed.state && typeof parsed.state.theme === 'string') {
                        theme = parsed.state.theme;
                      }
                    } catch (e) {
                      if (typeof storedValue === 'string' &&['light', 'dark', 'system'].includes(storedValue)) {
                        theme = storedValue;
                      }
                    }
                  }

                  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  console.error('Failed to apply initial theme', e);
                }
              })();
            `,
          }}
        />
        <ThemeProvider>
          <AppearanceProvider>
            <QueryProvider>
              <ToastProvider>
                <PwaRegistry />
                {children}
              </ToastProvider>
            </QueryProvider>
          </AppearanceProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
