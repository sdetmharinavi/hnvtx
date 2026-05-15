// hooks/useRealtimeSubscription.ts
'use client';

import { useEffect, useRef, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { invalidateRelatedCaches } from '@/hooks/database/cache-performance';
import { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Subscribes to global database changes and invalidates relevant React Query caches.
 * This keeps the UI in sync with server state in real-time across multiple users.
 */
export function useRealtimeSubscription() {
  // Memoize the client to prevent unnecessary re-subscriptions on re-renders
  const supabase = useMemo(() => createClient(),[]);
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  // Use a ref to debounce rapid-fire events (e.g., bulk uploads from other users)
  const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
  const pendingTables = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Safety guard: Do not attempt connection if offline
    if (!isOnline) return;

    let channel: RealtimeChannel | null = null;
    let isMounted = true;

    // THE FIX: Delay the connection slightly to bypass React 18 Strict Mode's
    // immediate mount/unmount cycle. This prevents the browser from throwing
    // the native "WebSocket is closed before the connection is established" error.
    const connectionTimer = setTimeout(() => {
      if (!isMounted) return;

      channel = supabase
        .channel('global-db-changes')
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to INSERT, UPDATE, DELETE
            schema: 'public',
          },
          (payload) => {
            const tableName = payload.table;

            // Add table to pending set
            pendingTables.current.add(tableName);

            // Only start a timer if one isn't already running. This prevents
            // calling clearTimeout/setTimeout 5000 times during a bulk insert,
            // saving massive amounts of CPU cycles.
            if (!debounceTimeout.current) {
              debounceTimeout.current = setTimeout(() => {
                const tablesToInvalidate = Array.from(pendingTables.current);
                pendingTables.current.clear();

                tablesToInvalidate.forEach((tbl) => {
                  // Trigger our Master Invalidation Logic for every table changed remotely
                  invalidateRelatedCaches(queryClient, tbl);
                });

                // Reset the timeout marker
                debounceTimeout.current = null;
              }, 1000); // Wait 1 second after the FIRST event of a batch
            }
          },
        )
        .subscribe((status, err) => {
          if (err) {
            console.debug('Realtime subscription issue:', err);
          }
        });
    }, 150); // 150ms is enough to outlast the synchronous Strict Mode unmount

    return () => {
      isMounted = false;
      
      // If we unmounted before the timer fired (Strict Mode), cancel the connection attempt
      clearTimeout(connectionTimer);

      // If the channel was created, clean it up safely
      if (channel) {
        supabase.removeChannel(channel).catch(() => {
          // Intentionally swallow teardown errors during unmount to keep console clean
        });
      }

      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
        debounceTimeout.current = null;
      }
    };
  }, [supabase, queryClient, isOnline]);
}