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

// --- CUSTOM CACHING STRATEGIES ---

const customCache: RuntimeCaching[] = [
  // 1. API/RPC Calls: NetworkFirst with Timeout
  // Try network for 5 seconds (to get fresh data), if slow/offline, use cache.
  // This ensures "freshness" when online but "speed/availability" when network is spotty.
  {
    matcher: ({ url }) => url.pathname.startsWith('/api/') || url.pathname.startsWith('/rest/') || url.pathname.startsWith('/rpc/'),
    handler: new NetworkFirst({
      cacheName: "api-cache",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 500,
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days (Increased from 7)
        }),
      ],
      networkTimeoutSeconds: 5, // Wait 5s for network, then fall back to cache
    }),
  },
  
  // 2. Static Assets (Images, Fonts): CacheFirst
  // These rarely change. Serve immediately from cache.
  {
    matcher: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico|woff2?)$/i,
    handler: new CacheFirst({
      cacheName: "static-assets-cache",
      plugins: [
        new ExpirationPlugin({
          maxEntries: 200,
          maxAgeSeconds: 60 * 60 * 24 * 60, // 60 Days
        }),
      ],
    }),
  },

  // 3. Navigation (HTML Pages): NetworkFirst with Short Timeout
  // CRITICAL FIX: This makes navigation fast. 
  // It tries network for 3 seconds. If slow, it serves the cached HTML immediately.
  // The previous setting of 24h expiration caused the "not working after many days" issue.
  {
    matcher: ({ request }) => request.mode === 'navigate',
    handler: new NetworkFirst({
      cacheName: 'pages-cache',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 100, // Keep last 100 visited pages
          maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days (Increased from 24 hours)
        }),
      ],
      networkTimeoutSeconds: 3, // If network takes > 3s, use cache
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  // Merge custom strategies BEFORE defaultCache to ensure they take precedence
  runtimeCaching: [...customCache, ...defaultCache],
  disableDevLogs: true, // Cleaner console in production
});

// Push Notification Listeners
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
        primaryKey: '1',
        url: data.url || 'https://hnvtm.vercel.app'
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