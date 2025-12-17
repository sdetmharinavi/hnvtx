// path: app/sw.ts
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import { Serwist } from "serwist";
import { NetworkFirst, CacheFirst, NetworkOnly } from "@serwist/strategies";
import { ExpirationPlugin } from "@serwist/expiration";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

// --- CUSTOM CACHING STRATEGIES ---

const customCache: RuntimeCaching[] = [
  // 1. API/RPC Calls: Network Only
  // THE FIX: We strictly disable SW caching for API/Supabase calls.
  // Our 'useLocalFirstQuery' + Dexie architecture handles offline data persistence at the application layer.
  // Caching here causes stale data issues and conflicts with optimistic UI updates.
  {
    matcher: ({ url }) => 
      url.pathname.startsWith('/api/') || 
      url.pathname.startsWith('/rest/') || 
      url.pathname.startsWith('/rpc/') ||
      url.hostname.includes('supabase.co'), // Match Supabase hosted domains
    handler: new NetworkOnly(),
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
  // Keeps the App Shell fresh but loads fast.
  {
    matcher: ({ request }) => request.mode === 'navigate',
    handler: new NetworkFirst({
      cacheName: 'pages-cache',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 50, 
          maxAgeSeconds: 60 * 60 * 24 * 7, // 7 Days
        }),
      ],
      networkTimeoutSeconds: 3, 
    }),
  },
];

const serwist = new Serwist({
  precacheEntries: self.__SW_MANIFEST,
  skipWaiting: true,
  clientsClaim: true,
  navigationPreload: true,
  runtimeCaching: [...customCache, ...defaultCache],
  disableDevLogs: true, 
});

// Push Notification Listeners (Unchanged)
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