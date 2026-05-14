// hooks/data/useLocalFirstQuery.ts
'use client';

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
  // Fix: Removed 'string | number' constraint to support composite keys transparently
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  dexieTable: Table<TLocal, any>; 
  enabled?: boolean;
  staleTime?: number;
  preferNetwork?: boolean;
  skipSync?: boolean;
}

/**
 * useLocalFirstQuery (Viewer Version)
 * Provides instant data from local storage and strictly manual sync for server updates.
 */
export function useLocalFirstQuery<
  T extends PublicTableOrViewName,
  TRow = Row<T>,
  TLocal = TRow,
>({
  queryKey,
  onlineQueryFn,
  localQueryFn,
  localQueryDeps =[],
  dexieTable,
  staleTime = Infinity,
  preferNetwork = false,
  skipSync = false,
}: UseLocalFirstQueryOptions<T, TRow, TLocal>) {
  const isOnline = useOnlineStatus();
  const isSyncingRef = useRef(false);
  const [hasInitialLocalLoad, setHasInitialLocalLoad] = useState(false);
  const queryClient = useQueryClient();

  // 1. Local Database Observation
  const localData = useLiveQuery(
    () => Promise.resolve(localQueryFn()),
    localQueryDeps,
    "loading" as const,
  );

  useEffect(() => {
    if (localData !== "loading") {
      setHasInitialLocalLoad(true);
    }
  }, [localData]);

  // 2. Manual Network Query (Sync only)
  const {
    data: networkData,
    isFetching: isNetworkFetching,
    isError: isNetworkError,
    error: networkError,
    refetch,
  } = useQuery<TRow[]>({
    queryKey,
    queryFn: async () => {
      if (!isOnline) throw new Error("Currently offline. Sync unavailable.");
      return onlineQueryFn();
    },
    enabled: false, // STOPS AUTOMATIC FETCHING
    staleTime,
  });

  // 3. One-way Sync (Server -> Local)
  useEffect(() => {
    if (skipSync || !networkData || isSyncingRef.current || localData === "loading") return;

    const syncToLocal = async () => {
      try {
        isSyncingRef.current = true;
        const primaryKeyName = dexieTable.schema.primKey.name;

        const localMap = new Map<string | number, TLocal>();
        if (Array.isArray(localData)) {
          localData.forEach((item) => {
            const pk = (item as Record<string, unknown>)[primaryKeyName];
            if (pk !== undefined && pk !== null) localMap.set(pk as string | number, item);
          });
        }

        const dataToUpdate: TLocal[] = [];

        (networkData as unknown as TLocal[]).forEach((serverItem) => {
          const pk = (serverItem as Record<string, unknown>)[primaryKeyName];
          if (pk === undefined || pk === null) return;

          const localItem = localMap.get(pk as string | number);

          // Only write if there's a difference to keep DB performance high
          if (!localItem || !isEqual(localItem, serverItem)) {
            dataToUpdate.push(serverItem);
          }
        });

        if (dataToUpdate.length > 0) {
          await dexieTable.bulkPut(dataToUpdate);
        }
      } catch (e) {
        console.error(`[LocalFirstQuery] Sync failed for ${dexieTable.name}:`, e);
      } finally {
        isSyncingRef.current = false;
      }
    };
    syncToLocal();
  }, [networkData, dexieTable, localData, skipSync]);

  const cachedData = queryClient.getQueryData<TRow[]>(queryKey);

  const resolvedData =
    preferNetwork && networkData
      ? networkData
      : Array.isArray(localData)
        ? localData
        : cachedData
          ? (cachedData as unknown as TLocal[])
          :[];

  return {
    data: resolvedData as TRow[],
    isLoading: localData === "loading" && !hasInitialLocalLoad,
    isFetching: isNetworkFetching,
    error: isNetworkError && !hasInitialLocalLoad ? networkError : null,
    refetch
  };
}