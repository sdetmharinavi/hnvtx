// hooks/data/useLocalFirstQuery.ts
import { useQuery, type QueryKey } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';
// import { useOnlineStatus } from '@/hooks/useOnlineStatus';
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
  staleTime = 5 * 60 * 1000,
}: UseLocalFirstQueryOptions<T, TRow, TLocal>) {
  // const isOnline = useOnlineStatus();
  // const queryClient = useQueryClient();

  // 1. Fetch Local Data (Always available via Dexie)
  const localData = useLiveQuery(localQueryFn, localQueryDeps, undefined);

  // 2. Fetch Network Data (Standard React Query)
  const {
    data: networkData,
    isLoading: isNetworkLoading,
    isFetching,
    isError: isNetworkError,
    error: networkError,
    refetch,
  } = useQuery<TRow[]>({
    queryKey,
    queryFn: onlineQueryFn,
    enabled: enabled, 
    refetchOnWindowFocus: false,
    refetchOnMount: true, // Attempt to fetch on mount to keep data fresh
    refetchOnReconnect: true,
    staleTime,
    retry: 1, // Minimize retries to avoid long waiting times if offline
  });

  // 3. Sync Network Data to Local DB
  useEffect(() => {
    if (networkData) {
      const syncToLocal = async () => {
        try {
          // Transactional bulk put to ensure data consistency
          // We rely on the caller to ensure TRow matches TLocal structure or is compatible
          await dexieTable.bulkPut(networkData as unknown as TLocal[]);
        } catch (e) {
          console.error(`[useLocalFirstQuery] Failed to sync data to ${dexieTable.name}`, e);
        }
      };
      syncToLocal();
    }
  }, [networkData, dexieTable]);

  // 4. Determine "Effective" State (Offline-First Logic)
  
  // Check if we actually have local data
  const hasLocalData = Array.isArray(localData) ? localData.length > 0 : !!localData;
  
  // LOGIC FIX:
  // If we have local data, we are NOT loading (even if network is fetching).
  // We only show loading state if we have NO data at all and are waiting for network.
  const isLoading = isNetworkLoading && !hasLocalData;

  // LOGIC FIX:
  // If we have local data, we SUPPRESS the network error.
  // The user sees the stale data, and we can show a toast or indicator elsewhere if needed.
  // We only show the error screen if we have NO data and the network failed.
  const error = hasLocalData ? null : networkError;
  const isError = hasLocalData ? false : isNetworkError;

  return {
    data: localData, // Always return local data as the source of truth for the UI
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}