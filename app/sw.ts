// path: app/sw.ts
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import { Serwist } from "serwist";
import { StaleWhileRevalidate, CacheFirst } from "@serwist/strategies"; // Removed NetworkFirst
import { ExpirationPlugin } from "@serwist/expiration";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// --- FIX: Use StaleWhileRevalidate for Navigation ---
// This serves the cached HTML immediately (instant nav) and updates in background.
const navigationCache: RuntimeCaching = {
  matcher: ({ request }) => request.mode === 'navigate',
  handler: new StaleWhileRevalidate({
    cacheName: 'pages-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 24 * 60 * 60, // 24 Hours
      }),
    ],
  }),
};

const customCache: RuntimeCaching[] = [
  {
    matcher: /^https?:\/\/.*\/(api|rest|rpc)\/.*/i,
    handler: new StaleWhileRevalidate({
      cacheName: "api-cache",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 Days
        }),
      ],
    }),
  },
  {
    matcher: /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
    handler: new CacheFirst({
      cacheName: "image-cache",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
        }),
      ],
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [navigationCache, ...defaultCache, ...customCache],
});

self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: data.icon || '/icon.png',
      badge: '/badge.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
      },
    };
    event.waitUntil(self.registration.showNotification(data.title, options));
  }
});
 
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(self.clients.openWindow('https://hnvtm.vercel.app'));
});

serwist.addEventListeners();