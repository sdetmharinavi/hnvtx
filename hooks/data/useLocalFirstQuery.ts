// hooks/data/useLocalFirstQuery.ts
import { useQuery, type QueryKey } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { PublicTableOrViewName, Row } from '@/hooks/database';
import { Table, PromiseExtended } from 'dexie';
import { localDb } from '@/hooks/data/localDb';

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
  refetchOnMount?: boolean | 'always';
  tableName?: string; // Explicit table name for conflict checking
}

// Helper to map View Names to Table Names for conflict checking
const VIEW_TO_TABLE_MAP: Record<string, string> = {
  v_systems_complete: 'systems',
  v_ofc_cables_complete: 'ofc_cables',
  v_nodes_complete: 'nodes',
  v_employees: 'employees',
  v_inventory_items: 'inventory_items',
  v_e_files_extended: 'e_files',
  v_maintenance_areas: 'maintenance_areas',
  v_lookup_types: 'lookup_types',
  v_system_connections_complete: 'system_connections',
  v_ofc_connections_complete: 'ofc_connections',
  v_user_profiles_extended: 'user_profiles',
};

export function useLocalFirstQuery<T extends PublicTableOrViewName, TRow = Row<T>, TLocal = TRow>({
  queryKey,
  onlineQueryFn,
  localQueryFn,
  localQueryDeps = [],
  dexieTable,
  enabled = true,
  staleTime = Infinity,
  autoSync = false,
  refetchOnMount = false,
  tableName,
}: UseLocalFirstQueryOptions<T, TRow, TLocal>) {
  const isOnline = useOnlineStatus();
  const isSyncingRef = useRef(false);
  const [hasInitialLocalLoad, setHasInitialLocalLoad] = useState(false);

  // 1. Fetch Local Data
  // 'loading' is the default value while Dexie fetches
  const localData = useLiveQuery(
    () => {
      // Wrap in a promise to track completion
      return Promise.resolve(localQueryFn()).finally(() => {
        // Mark as loaded once the promise resolves/rejects
      });
    },
    localQueryDeps,
    'loading',
  );

  // Track when local data has finished its first fetch
  useEffect(() => {
    if (localData !== 'loading') {
      setHasInitialLocalLoad(true);
    }
  }, [localData]);

  // 2. Network Query Configuration
  // Only auto-fetch if enabled, online, and autoSync is true
  const shouldFetchOnMount = enabled && isOnline && autoSync;

  const {
    data: networkData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        throw new Error('Offline');
      }
      return onlineQueryFn();
    },
    enabled: shouldFetchOnMount,
    refetchOnWindowFocus: false,
    refetchOnMount: refetchOnMount,
    refetchOnReconnect: false,
    staleTime,
    retry: 1,
  });

  // 3. Safe Sync Network Data to Local DB (Upsert + Prune)
  useEffect(() => {
    if (networkData && !isSyncingRef.current) {
      const syncToLocal = async () => {
        try {
          isSyncingRef.current = true;
          const targetTableName =
            tableName || VIEW_TO_TABLE_MAP[dexieTable.name] || dexieTable.name;

          // A. Fetch pending mutations to respect offline work
          const pendingMutations = await localDb.mutation_queue
            .where('tableName')
            .equals(targetTableName)
            .filter((task) => task.status === 'pending' || task.status === 'processing')
            .toArray();

          const dirtyIds = new Set<string>();
          const pendingInsertIds = new Set<string>();

          pendingMutations.forEach((task) => {
            if (task.type === 'update' && task.payload?.id) {
              dirtyIds.add(String(task.payload.id));
            } else if (task.type === 'delete' && task.payload?.ids) {
              task.payload.ids.forEach((id: string | number) => dirtyIds.add(String(id)));
            } else if (task.type === 'insert' && task.payload?.id) {
              pendingInsertIds.add(String(task.payload.id));
            }
          });

          // B. Filter and UPSERT (Update/Insert) from Network
          const primaryKey = dexieTable.schema.primKey.name;

          const dataToSave = (networkData as unknown as TLocal[]).filter((item) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pkValue = (item as any)[primaryKey];
            if (pkValue === null || pkValue === undefined) return false;

            const pkStr = String(pkValue);

            // Conflict Check: Don't overwrite if we have pending local updates/deletes for this ID
            return !dirtyIds.has(pkStr);
          });

          if (dataToSave.length > 0) {
            await dexieTable.bulkPut(dataToSave);
          }

          // Note: We deliberately do NOT perform deletions/pruning here.
          // Since this hook usually fetches filtered subsets of data (e.g. search results),
          // pruning items missing from `networkData` would incorrectly delete valid local items
          // that just didn't match the current filter.
          // Full synchronization/pruning is handled by `useDataSync`.
        } catch (e) {
          console.error(`[useLocalFirstQuery] Sync failed for ${dexieTable.name}`, e);
        } finally {
          isSyncingRef.current = false;
        }
      };

      syncToLocal();
    }
  }, [networkData, dexieTable, tableName]);

  // 4. Enhanced Loading Logic
  // - If local data is loading, we are loading (hard load).
  // - If local data is ready, we show it immediately.
  // - Background network fetch is indicated by isFetching.

  const isHardLoading = localData === 'loading' && !hasInitialLocalLoad;

  const isError = isNetworkError && !hasInitialLocalLoad;
  const error = isError ? networkError : null;

  const safeData = Array.isArray(localData) ? localData : [];

  return {
    data: safeData,
    isLoading: isHardLoading,
    isFetching: isNetworkFetching,
    isError,
    error,
    refetch,
    networkStatus: networkQueryStatus,
    isSyncing: isNetworkFetching,
  };
}
