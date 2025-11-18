// hooks/data/useLocalFirstQuery.ts
import { useQuery, type QueryKey } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect } from 'react';
// import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { PublicTableOrViewName, Row } from '@/hooks/database';
import { Table, PromiseExtended } from 'dexie';

// THE FIX: Added a second generic parameter `TLocal` to represent the Dexie-specific type.
// `TRow` now defaults to `Row<T>`, but `TLocal` defaults to `TRow`, allowing for overrides.
interface UseLocalFirstQueryOptions<
  T extends PublicTableOrViewName,
  TRow = Row<T>,
  TLocal = TRow
> {
  queryKey: QueryKey;
  onlineQueryFn: () => Promise<TRow[]>;
  localQueryFn: () => PromiseExtended<TLocal[]>;
  dexieTable: Table<TLocal, string>; // This now uses TLocal
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
  dexieTable,
  // enabled = true,
  staleTime = 5 * 60 * 1000,
}: UseLocalFirstQueryOptions<T, TRow, TLocal>) {
  // const isOnline = useOnlineStatus();
  // const queryClient = useQueryClient();

  // This `useLiveQuery` will now correctly return `TLocal[] | undefined`
  const localData = useLiveQuery(localQueryFn, [], undefined);

  const {
    data: networkData,
    isLoading: isNetworkLoading,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery<TRow[]>({
    queryKey,
    queryFn: onlineQueryFn,
    enabled: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime,
  });

  useEffect(() => {
    if (networkData) {
      const syncToLocal = async () => {
        try {
          // The `bulkPut` operation now expects data that conforms to `TLocal`.
          // The `onlineQueryFn` must return data that can be safely cast to `TLocal[]`.
          await dexieTable.bulkPut(networkData as unknown as TLocal[]);
          console.log(`[useLocalFirstQuery] Synced ${networkData.length} records to ${dexieTable.name}`);
        } catch (e) {
          console.error(`[useLocalFirstQuery] Failed to sync data to ${dexieTable.name}`, e);
        }
      };
      syncToLocal();
    }
  }, [networkData, dexieTable]);

  const isLoading = isNetworkLoading && localData === undefined;

  return {
    data: localData,
    isLoading,
    isFetching,
    isError,
    error,
    refetch,
  };
}