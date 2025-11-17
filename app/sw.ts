// path: app/sw.ts
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import { Serwist } from "serwist";
import { StaleWhileRevalidate, CacheFirst, NetworkFirst } from "@serwist/strategies"; // --- IMPORT NetworkFirst ---
import { ExpirationPlugin } from "@serwist/expiration";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// --- THIS IS THE FIX: A NEW CACHING RULE FOR NAVIGATION ---
const navigationCache: RuntimeCaching = {
  // Match any request that is a navigation to a new page.
  matcher: ({ request }) => request.mode === 'navigate',
  // Use a NetworkFirst strategy.
  handler: new NetworkFirst({
    cacheName: 'pages-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50, // Cache up to 50 pages.
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 Days
      }),
    ],
  }),
};
// --- END FIX ---

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
  // --- THIS IS THE FIX: Add the new navigation rule to the runtimeCaching array ---
  // It's important to place it BEFORE defaultCache so it takes precedence for navigation requests.
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