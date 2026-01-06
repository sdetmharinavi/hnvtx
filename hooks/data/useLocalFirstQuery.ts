// hooks/data/useLocalFirstQuery.ts
import { useQuery, type QueryKey } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { PublicTableOrViewName, Row } from "@/hooks/database";
import { Table, PromiseExtended } from "dexie";

interface UseLocalFirstQueryOptions<T extends PublicTableOrViewName, TRow = Row<T>, TLocal = TRow> {
  queryKey: QueryKey;
  onlineQueryFn: () => Promise<TRow[]>;
  localQueryFn: () => Promise<TLocal[]> | PromiseExtended<TLocal[]>;
  localQueryDeps?: unknown[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dexieTable: Table<TLocal, any>;
  enabled?: boolean;
  staleTime?: number;
  autoSync?: boolean;
  refetchOnMount?: boolean | "always"; // ADDED
}

export function useLocalFirstQuery<T extends PublicTableOrViewName, TRow = Row<T>, TLocal = TRow>({
  queryKey,
  onlineQueryFn,
  localQueryFn,
  localQueryDeps = [],
  dexieTable,
  enabled = true,
  staleTime = Infinity,
  autoSync = false,
  refetchOnMount = false, // ADDED
}: UseLocalFirstQueryOptions<T, TRow, TLocal>) {
  const isOnline = useOnlineStatus();

  // 1. Fetch Local Data
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
    enabled: shouldFetchOnMount,
    refetchOnWindowFocus: false,
    refetchOnMount: refetchOnMount, // UPDATED
    refetchOnReconnect: false,
    staleTime,
    retry: 1,
  });

  // 3. Sync Network Data to Local DB
  useEffect(() => {
    if (networkData) {
      const syncToLocal = async () => {
        try {
          const primaryKey = dexieTable.schema.primKey.name;

          let dataToSave = networkData as unknown as TLocal[];

          if (primaryKey) {
            dataToSave = dataToSave.filter((item) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const pkValue = (item as any)[primaryKey];
              return pkValue !== null && pkValue !== undefined;
            });
          }

          if (dataToSave.length > 0) {
            await dexieTable.bulkPut(dataToSave);
          }
        } catch (e) {
          console.error(`[useLocalFirstQuery] Failed to sync data to ${dexieTable.name}`, e);
        }
      };
      syncToLocal();
    }
  }, [networkData, dexieTable]);

  // 4. Determine Loading State
  const isLocalLoading = localData === "loading";
  const hasLocalData = Array.isArray(localData) && localData.length > 0;

  const isLoading = isLocalLoading || (isNetworkLoading && autoSync && !hasLocalData);

  const isError = isNetworkError && !hasLocalData;
  const error = isError ? networkError : null;

  const isSyncing = isNetworkFetching;
  const isStale = isNetworkError && hasLocalData;

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
    isSyncing,
  };
}
