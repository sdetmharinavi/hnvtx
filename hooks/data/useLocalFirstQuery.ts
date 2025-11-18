// hooks/data/useLocalFirstQuery.ts
import { useQuery, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { PublicTableOrViewName, Row } from '@/hooks/database';
import { Table, PromiseExtended } from 'dexie';

interface UseLocalFirstQueryOptions<T extends PublicTableOrViewName> {
  queryKey: QueryKey;
  onlineQueryFn: () => Promise<Row<T>[]>;
  // THE FIX: The type now correctly expects a function that returns a Promise-like object,
  // which matches the return type of Dexie's toArray().
  localQueryFn: () => PromiseExtended<Row<T>[]>;
  dexieTable: Table<Row<T>, string>;
  enabled?: boolean;
  staleTime?: number;
}

/**
 * Implements a "local-first with background revalidation" data fetching strategy.
 * - Instantly returns data from IndexedDB (via Dexie) for a fast UI response.
 * - If the user is online, it triggers a background fetch from the primary API.
 * - On successful fetch, it updates the local IndexedDB table.
 * - The UI automatically updates reactively when the local data changes.
 *
 * @param queryKey Unique key for the query, used by TanStack Query.
 * @param onlineQueryFn Async function to fetch fresh data from the network (e.g., Supabase).
 * @param localQueryFn A function that returns a Dexie Promise (`PromiseExtended`) for the local data.
 * @param dexieTable The Dexie table instance to which fresh data will be written.
 * @param enabled Flag to enable or disable the query.
 * @param staleTime How long the data is considered fresh before a background refetch is attempted.
 */
export function useLocalFirstQuery<T extends PublicTableOrViewName>({
  queryKey,
  onlineQueryFn,
  localQueryFn,
  dexieTable,
  enabled = true,
  staleTime = 5 * 60 * 1000, // 5 minutes
}: UseLocalFirstQueryOptions<T>) {
  const isOnline = useOnlineStatus();
  const queryClient = useQueryClient();

  // Step 1: Reactively subscribe to local Dexie data. This is what the UI will display.
  // `useLiveQuery` is extremely fast and updates automatically when Dexie changes.
  const localData = useLiveQuery(localQueryFn, [], undefined);

  // Step 2: Use TanStack Query to manage the background network request.
  const {
    data: networkData,
    isLoading: isNetworkLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<Row<T>[]>({
    queryKey,
    queryFn: onlineQueryFn,
    enabled: isOnline && enabled, // Only fetch from network if online and enabled
    staleTime,
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Attempt to refetch when the component mounts
  });

  // Step 3: Sync network data back to the local database when it arrives.
  useEffect(() => {
    if (networkData) {
      const syncToLocal = async () => {
        try {
          // Use bulkPut for efficient add/update operations.
          await dexieTable.bulkPut(networkData);
          console.log(`[useLocalFirstQuery] Synced ${networkData.length} records to ${dexieTable.name}`);
        } catch (e) {
          console.error(`[useLocalFirstQuery] Failed to sync data to ${dexieTable.name}`, e);
        }
      };
      syncToLocal();
    }
  }, [networkData, dexieTable]);

  // Step 4: Manually trigger a refetch when coming back online.
  useEffect(() => {
    if (isOnline) {
      queryClient.invalidateQueries({ queryKey });
    }
  }, [isOnline, queryKey, queryClient]);

  // Determine the final loading state. It's loading only on the very first fetch.
  const isLoading = isNetworkLoading && localData === undefined;

  return {
    // Return local data for the UI to consume instantly.
    // It will be `undefined` on the first render, then populate from Dexie.
    data: localData,
    isLoading,
    isFetching, // Indicates a background fetch is in progress
    isError,
    error,
    refetch,
  };
}