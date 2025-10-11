"use strict";

import { Serwist } from "@serwist/sw";
import { StaleWhileRevalidate, CacheFirst } from "@serwist/strategies";
import { ExpirationPlugin } from "@serwist/expiration";

// This is the Serwist instance that will be used to handle all the caching and routing.
const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
});

// --- THE FIX: Runtime Caching logic is now defined here directly ---

// 1. API Cache (Stale-While-Revalidate)
serwist.registerRoute(
  /^https?:\/\/.*\/(api|rest|rpc)\/.*/i,
  new StaleWhileRevalidate({
    cacheName: "api-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 200,
        maxAgeSeconds: 60 * 60 * 24 * 7, // 7 Days
      }),
    ],
  })
);

// 2. Image Cache (CacheFirst)
serwist.registerRoute(
  /\.(?:png|jpg|jpeg|svg|gif|webp|avif)$/i,
  new CacheFirst({
    cacheName: "image-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
      }),
    ],
  })
);

// 3. Next.js Static Assets Cache (CacheFirst)
serwist.registerRoute(
  /_next\/static\/.*/i,
  new CacheFirst({
    cacheName: "next-static-cache",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
      }),
    ],
  })
);

// --- Your existing Push Notification logic remains unchanged ---

self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json()
    const options = {
      body: data.body,
      icon: data.icon || '/icon.png',
      badge: '/badge.png',
      vibrate: [100, 50, 100],
      data: {
        dateOfArrival: Date.now(),
        primaryKey: '2',
      },
    }
    event.waitUntil(self.registration.showNotification(data.title, options))
  }
});
 
self.addEventListener('notificationclick', function (event) {
  event.notification.close()
  event.waitUntil(clients.openWindow('https://hnvtx.vercel.app'))
});

// This is the magic that makes all of the above work.
serwist.addEventListeners();