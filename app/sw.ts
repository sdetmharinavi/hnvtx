// path: app/sw.ts
/// <reference lib="webworker" />

import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig, RuntimeCaching } from "serwist";
import { Serwist } from "serwist";
import { StaleWhileRevalidate, CacheFirst, NetworkOnly } from "@serwist/strategies"; // CHANGED
import { ExpirationPlugin } from "@serwist/expiration";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const customCache: RuntimeCaching[] = [
  // 1. API/Supabase/Auth: Network Only (No Caching)
// THE FIX: We strictly disable SW caching for API/Supabase calls.
  // Our 'useLocalFirstQuery' + Dexie architecture handles offline data persistence at the application layer.
  // Caching here causes stale data issues and conflicts with optimistic UI updates.
  {
    matcher: ({ url }) => {
      const isApiRoute = url.pathname.startsWith('/api/');
      const isSupabaseApi = url.hostname.includes('supabase.co') && 
                            (url.pathname.startsWith('/rest/') || url.pathname.startsWith('/rpc/'));
      
      // THE FIX START: Exclude auth routes from service worker interception.
      // This allows OAuth redirects (`/auth/v1/authorize`) to function correctly.
      const isSupabaseAuth = url.hostname.includes('supabase.co') && url.pathname.startsWith('/auth/');
      if (isSupabaseAuth) {
        return false; // Let the browser handle this navigation.
      }
      // THE FIX END

      return isApiRoute || isSupabaseApi;
    },
    handler: new NetworkOnly(),
  },

  // 2. Static Assets (Images, Fonts): CacheFirst
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

  // 3. Navigation (HTML Pages): StaleWhileRevalidate
  // THE FIX: Instant load from cache, update in background
  {
    matcher: ({ request }) => request.mode === 'navigate',
    handler: new StaleWhileRevalidate({
      cacheName: 'pages-cache',
      plugins: [
        new ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24, // 24 Hours
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