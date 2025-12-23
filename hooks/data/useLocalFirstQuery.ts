// hooks/data/useLocalFirstQuery.ts
import { useQuery, type QueryKey } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { PublicTableOrViewName, Row } from '@/hooks/database';
import { Table, PromiseExtended } from 'dexie';

interface UseLocalFirstQueryOptions<
  T extends PublicTableOrViewName,
  TRow = Row<T>,
  TLocal = TRow
> {
  queryKey: QueryKey;
  onlineQueryFn: () => Promise<TRow[]>;
  localQueryFn: () => Promise<TLocal[]> | PromiseExtended<TLocal[]>;
  localQueryDeps?: unknown[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dexieTable: Table<TLocal, any>;
  enabled?: boolean;
  staleTime?: number;
  /**
   * If true, attempts to fetch from network on component mount.
   * If false, relies solely on local data until refetch() is called manually.
   * Default: false (Offline-first, manual sync)
   */
  autoSync?: boolean; 
}

export function useLocalFirstQuery<
  T extends PublicTableOrViewName,
  TRow = Row<T>,
  TLocal = TRow
>({
  queryKey,
  onlineQueryFn,
  localQueryFn,
  localQueryDeps = [],
  dexieTable,
  enabled = true,
  staleTime = Infinity, // Default to Infinity to prevent background refetches
  autoSync = false,     // Default to Manual Sync
}: UseLocalFirstQueryOptions<T, TRow, TLocal>) {
  const isOnline = useOnlineStatus();

  // 1. Fetch Local Data (Always available via Dexie)
  // useLiveQuery returns undefined while loading, then the array
  const localData = useLiveQuery(localQueryFn, localQueryDeps, "loading");
  
  // 2. Network Query Configuration
  const shouldFetchOnMount = enabled && isOnline && autoSync;

  const {
    data: networkData,
    isLoading: isNetworkLoading,
    isFetching: isNetworkFetching,
    isError: isNetworkError,
    error: networkError,
    refetch,
    status: networkQueryStatus,
  } = useQuery<TRow[]>({
    queryKey,
    queryFn: async () => {
      if (!isOnline) {
        throw new Error("Offline");
      }
      return onlineQueryFn();
    },
    // Controls whether the query runs automatically
    enabled: shouldFetchOnMount, 
    
    // Strict Manual Mode Settings
    refetchOnWindowFocus: false,
    refetchOnMount: false, // Do not refetch on mount if data exists
    refetchOnReconnect: false, // Do not auto-refetch on reconnect
    
    staleTime,
    retry: 1, 
  });

  // 3. Sync Network Data to Local DB
  useEffect(() => {
    if (networkData) {
      const syncToLocal = async () => {
        try {
          // Bulk put updates existing records and inserts new ones
          await dexieTable.bulkPut(networkData as unknown as TLocal[]);
        } catch (e) {
          console.error(`[useLocalFirstQuery] Failed to sync data to ${dexieTable.name}`, e);
        }
      };
      syncToLocal();
    }
  }, [networkData, dexieTable]);

  // 4. Determine Loading State
  // "loading" is the string identifier we passed to useLiveQuery default
  const isLocalLoading = localData === "loading";
  const hasLocalData = Array.isArray(localData) && localData.length > 0;
  
  // Show loading if:
  // 1. Dexie is still initializing (isLocalLoading)
  // 2. OR we are forced to fetch network (autoSync) AND we have no local data yet
  const isLoading = isLocalLoading || ((isNetworkLoading && autoSync) && !hasLocalData);

  // 5. Determine Error State
  // Suppress network errors if we have local data to show
  const isError = isNetworkError && !hasLocalData;
  const error = isError ? networkError : null;

  // 6. Indicators
  const isSyncing = isNetworkFetching;
  const isStale = isNetworkError && hasLocalData; // We have data, but last sync failed
  
  // Safe data return
  const safeData = Array.isArray(localData) ? localData : [];

  return {
    data: safeData,
    isLoading,
    isFetching: isSyncing,
    isError,
    error,
    refetch, 
    networkStatus: networkQueryStatus,
    isStale,
    isSyncing
  };
}