// hooks/data/useDataSync.ts
'use client';

import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncStore } from '@/stores/syncStore';
import { toast } from 'sonner';
import { invalidateRelatedCaches } from '@/hooks/database/cache-performance';

/**
 * Online-Only Data Sync Hook.
 * "Syncing" in this context refers to invalidating the React Query cache
 * to force a re-fetch from the server, ensuring the UI reflects the latest state.
 */
export function useDataSync() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const { addActiveSync, removeActiveSync, isGlobalSyncing } = useSyncStore();

  const sync = useCallback(
    async (entitiesToInvalidate?: string[]) => {
      // If offline, we can't fetch new data, so "sync" is impossible.
      if (!isOnline) {
        toast.warning('Cannot refresh data while offline.');
        return;
      }

      // Use a generic identifier if specific entities aren't provided
      const syncId = entitiesToInvalidate ? entitiesToInvalidate.join(',') : 'global-refresh';
      addActiveSync(syncId);

      try {
        if (entitiesToInvalidate && entitiesToInvalidate.length > 0) {
          // Use our smart, targeted invalidator
          entitiesToInvalidate.forEach((entity) => {
            invalidateRelatedCaches(queryClient, entity);
          });
        } else {
          // Global refresh: Invalidate everything
          await queryClient.invalidateQueries();
        }
      } catch (error) {
        console.error('Data refresh failed:', error);
        toast.error('Failed to refresh data.');
      } finally {
        removeActiveSync(syncId);
      }
    },
    [isOnline, queryClient, addActiveSync, removeActiveSync],
  );

  return {
    isSyncing: isGlobalSyncing,
    sync,
  };
}
