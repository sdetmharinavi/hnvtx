// app/sw.ts
/// <reference lib="webworker" />

import { defaultCache } from '@serwist/next/worker';
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from 'serwist';
import { Serwist } from 'serwist';
import { CacheFirst, NetworkFirst, NetworkOnly, StaleWhileRevalidate } from '@serwist/strategies';
import { ExpirationPlugin } from '@serwist/expiration';

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const customCache: RuntimeCaching[] = [
  // 1. DATA & AUTH: Network Only (Strict)
  // Since we rely on internet, we never want to serve cached API responses or Auth states.
  // This prevents "stale data" flashes and authentication inconsistencies.
  {
    matcher: ({ url }) => {
      return (
        url.pathname.startsWith('/api/') ||      // Next.js API Routes
        url.pathname.startsWith('/auth/') ||     // Auth Routes
        url.hostname.includes('supabase.co')     // Supabase Requests
      );
    },
    handler: new NetworkOnly(),
  },

  // 2. STATIC ASSETS (Images, Fonts): Cache First (Aggressive)
  // These rarely change. Serve from cache instantly for "instant load" feel.
  {
    matcher: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico|woff2?|ttf|eot)$/i,
    handler: new CacheFirst({
      cacheName: 'static-assets-cache',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 365, // 1 Year
          purgeOnQuotaError: true,
        }),
      ],
    }),
  },

  // 3. APP SHELL (JS/CSS chunks): Stale While Revalidate
  // Serve cached code instantly, then check server for updates.
  // This makes the UI appear immediately on repeat visits.
  {
    matcher: /\/_next\/static\/.*/i,
    handler: new StaleWhileRevalidate({
      cacheName: 'next-static-js-assets',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 64,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
        }),
      ],
    }),
  },

  // 4. NAVIGATION (HTML Pages): Network First
  // We try to get the fresh page from the server to run Middleware (Auth checks).
  // If the network fails (and only then), we might show a cached version or offline page.
  {
    matcher: ({ request }) => request.mode === 'navigate',
    handler: new NetworkFirst({
      cacheName: 'pages-cache',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 32,
          maxAgeSeconds: 60 * 60 * 24, // 24 Hours
        }),
      ],
      networkTimeoutSeconds: 5, // Wait 5s for network, then fallback
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true, // Activate new SW immediately
  clientsClaim: true, // Take control of page immediately
  navigationPreload: true,
  runtimeCaching: [...customCache, ...defaultCache],
  disableDevLogs: true,
});

// Push Notification Listeners (Keep existing logic)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        url: data.url || '/',
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return self.clients.openWindow(event.notification.data.url);
    })
  );
});

serwist.addEventListeners();