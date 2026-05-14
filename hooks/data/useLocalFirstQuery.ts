// hooks/data/useLocalFirstQuery.ts
import { useQuery, type QueryKey, useQueryClient } from "@tanstack/react-query";
import { useLiveQuery } from "dexie-react-hooks";
import { useEffect, useRef, useState } from "react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { PublicTableOrViewName, Row } from "@/hooks/database";
import { Table, PromiseExtended } from "dexie";
import isEqual from "lodash.isequal";

interface UseLocalFirstQueryOptions<
  T extends PublicTableOrViewName,
  TRow = Row<T>,
  TLocal = TRow,
> {
  queryKey: QueryKey;
  onlineQueryFn: () => Promise<TRow[]>;
  localQueryFn: () => Promise<TLocal[]> | PromiseExtended<TLocal[]>;
  localQueryDeps?: unknown[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dexieTable: Table<TLocal, any>;
  enabled?: boolean;
  staleTime?: number;
  autoSync?: boolean;
  refetchOnMount?: boolean | "always";
  tableName?: string;
  preferNetwork?: boolean;
  skipSync?: boolean;
}

export function useLocalFirstQuery<
  T extends PublicTableOrViewName,
  TRow = Row<T>,
  TLocal = TRow,
>({
  queryKey,
  onlineQueryFn,
  localQueryFn,
  localQueryDeps = [],
  dexieTable,
  enabled = true,
  staleTime = Infinity,
  autoSync = false,
  refetchOnMount = false,
  preferNetwork = false,
  skipSync = false,
}: UseLocalFirstQueryOptions<T, TRow, TLocal>) {
  const isOnline = useOnlineStatus();
  const isSyncingRef = useRef(false);
  const [hasInitialLocalLoad, setHasInitialLocalLoad] = useState(false);
  const queryClient = useQueryClient();

  // 1. Fetch Local Data (Dexie)
  const localData = useLiveQuery(
    () => {
      return Promise.resolve(localQueryFn()).finally(() => {});
    },
    localQueryDeps,
    "loading",
  );

  useEffect(() => {
    if (localData !== "loading") {
      setHasInitialLocalLoad(true);
    }
  }, [localData]);

  // 2. Network Query Configuration
  const shouldFetchOnMount = enabled && isOnline && autoSync;

  const {
    data: networkData,
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
    refetchOnMount: refetchOnMount,
    refetchOnReconnect: false,
    staleTime,
    retry: 1,
    placeholderData: (previousData) => previousData,
  });

  // 3. Fast Sync Network Data to Local DB (Pure Read-Only Mode)
  useEffect(() => {
    if (skipSync) return;

    if (networkData && !isSyncingRef.current && localData !== "loading") {
      const syncToLocal = async () => {
        try {
          isSyncingRef.current = true;
          const primaryKey = dexieTable.schema.primKey.name;

          // Map local data for quick lookup to prevent unnecessary writes
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const localMap = new Map<string, any>();
          if (Array.isArray(localData)) {
            localData.forEach((item) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const pk = (item as any)[primaryKey];
              if (pk) localMap.set(String(pk), item);
            });
          }

          const dataToSave: TLocal[] = [];

          (networkData as unknown as TLocal[]).forEach((serverItem) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pkValue = (serverItem as any)[primaryKey];
            if (pkValue === null || pkValue === undefined) return;

            const pkStr = String(pkValue);
            const localItem = localMap.get(pkStr);

            // Optimization: If the local item is identical to the server item, skip the DB write
            if (localItem && isEqual(localItem, serverItem)) {
              return;
            }

            dataToSave.push(serverItem);
          });

          if (dataToSave.length > 0) {
            await dexieTable.bulkPut(dataToSave);
          }
        } catch (e) {
          console.error(
            `[useLocalFirstQuery] Sync failed for ${dexieTable.name}`,
            e,
          );
        } finally {
          isSyncingRef.current = false;
        }
      };

      syncToLocal();
    }
  }, [networkData, dexieTable, localData, skipSync]);

  // 4. Data Resolution Strategy
  const cachedData = queryClient.getQueryData<TRow[]>(queryKey);

  const resolvedData =
    preferNetwork && networkData
      ? networkData
      : Array.isArray(localData)
        ? localData
        : cachedData
          ? (cachedData as unknown as TLocal[])
          : [];

  const isHardLoading =
    localData === "loading" &&
    !hasInitialLocalLoad &&
    !networkData &&
    !cachedData;

  const isError = isNetworkError && !hasInitialLocalLoad;
  const error = isError ? networkError : null;

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: resolvedData as any,
  };
}
