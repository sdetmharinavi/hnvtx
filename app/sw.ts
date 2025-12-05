// path: app/sw.ts
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import { Serwist } from "serwist";
import { NetworkFirst, CacheFirst } from "@serwist/strategies";
import { ExpirationPlugin } from "@serwist/expiration";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// --- Navigation Strategy: NetworkFirst ---
// 1. Try Network: Get the latest HTML from the server.
// 2. Fallback to Cache: If offline, serve the previously cached HTML for this route.
// This fixes the "This site can't be reached" error on reload.
const navigationCache: RuntimeCaching = {
  matcher: ({ request }) => request.mode === 'navigate',
  handler: new NetworkFirst({
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
  // --- API Strategy: NetworkFirst with Timeout ---
  // 1. Try Network: Get fresh data.
  // 2. Timeout (10s): If slow, fall back to cache immediately.
  // 3. Offline: Serve cache immediately.
  {
    matcher: /^https?:\/\/.*\/(api|rest|rpc)\/.*/i,
    handler: new NetworkFirst({
      cacheName: "api-cache",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 Days
        }),
      ],
      networkTimeoutSeconds: 10, 
    }),
  },
  // --- Static Assets: CacheFirst ---
  // Images change rarely, so serve from cache for speed.
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