// path: app/sw.ts
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import { Serwist } from "serwist";
import { StaleWhileRevalidate, CacheFirst } from "@serwist/strategies";
import { ExpirationPlugin } from "@serwist/expiration";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// --- THIS IS THE FIX: Define custom caching rules in a declarative array ---
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
// --- END FIX ---

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // --- THIS IS THE FIX: Combine default Next.js rules with our custom rules ---
  runtimeCaching: [...defaultCache, ...customCache],
});

// --- Custom Event Listeners (This part remains correct) ---
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