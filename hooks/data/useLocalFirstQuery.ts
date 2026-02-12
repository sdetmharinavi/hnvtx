// hooks/data/useLocalFirstQuery.ts
import { useQuery, type QueryKey, useQueryClient } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef, useState } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { PublicTableOrViewName, Row } from '@/hooks/database';
import { Table, PromiseExtended } from 'dexie';
import { localDb } from '@/hooks/data/localDb';
import isEqual from 'lodash.isequal';

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
  tableName?: string;
  preferNetwork?: boolean;
  skipSync?: boolean;
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
  v_advances_complete: 'advances',
  v_expenses_complete: 'expenses',
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
      return Promise.resolve(localQueryFn()).finally(() => {
        // Mark as loaded once the promise resolves/rejects
      });
    },
    localQueryDeps,
    'loading'
  );

  useEffect(() => {
    if (localData !== 'loading') {
      setHasInitialLocalLoad(true);
    }
  }, [localData]);

  // 2. Network Query Configuration
  // Optimization: If we have local data, we don't strictly *need* to fetch immediately if staleTime is Infinity
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
    // Use cached data if available while fetching new data
    placeholderData: (previousData) => previousData,
  });

  // 3. Safe Sync Network Data to Local DB (Upsert + Prune)
  useEffect(() => {
    if (skipSync) return;

    // Wait until both network and local data are available to perform a smart merge
    if (networkData && !isSyncingRef.current && localData !== 'loading') {
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

          pendingMutations.forEach((task) => {
            if (task.type === 'update' && task.payload?.id) {
              dirtyIds.add(String(task.payload.id));
            } else if (task.type === 'delete' && task.payload?.ids) {
              task.payload.ids.forEach((id: string | number) => dirtyIds.add(String(id)));
            }
          });

          const primaryKey = dexieTable.schema.primKey.name;

          // Map local data for quick lookup during merge
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const localMap = new Map<string, any>();
          if (Array.isArray(localData)) {
            localData.forEach((item) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const pk = (item as any)[primaryKey];
              if (pk) localMap.set(String(pk), item);
            });
          }

          // B. Smart Merge: Filter and prepare data for UPSERT
          const dataToSave: TLocal[] = [];

          (networkData as unknown as TLocal[]).forEach((serverItem) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pkValue = (serverItem as any)[primaryKey];
            if (pkValue === null || pkValue === undefined) return;
            const pkStr = String(pkValue);

            // 1. Skip if pending offline mutation exists for this ID
            if (dirtyIds.has(pkStr)) return;

            // 2. Race Condition Check: Compare updated_at timestamps
            const localItem = localMap.get(pkStr);
            if (localItem) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const serverTime = (serverItem as any).updated_at
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ? new Date((serverItem as any).updated_at).getTime()
                : 0;
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const localTime = (localItem as any).updated_at
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ? new Date((localItem as any).updated_at).getTime()
                : 0;

              // If local item is NEWER than server item (e.g. from optimistic update),
              // preserve the local item and ignore the stale server data.
              // Note: We use a small buffer (e.g. 0ms) just direct comparison.
              // Since optimistic updates set local time to Date.now(), it should be > server time
              // until the server record is actually updated and returned.
              if (localTime > serverTime) {
                // Skip overwriting
                return;
              }

              // Optimization: If they are identical in content, skip write to save cycles
              if (isEqual(localItem, serverItem)) {
                return;
              }
            }

            dataToSave.push(serverItem);
          });

          if (dataToSave.length > 0) {
            await dexieTable.bulkPut(dataToSave);
          }
        } catch (e) {
          console.error(`[useLocalFirstQuery] Sync failed for ${dexieTable.name}`, e);
        } finally {
          isSyncingRef.current = false;
        }
      };

      syncToLocal();
    }
  }, [networkData, dexieTable, tableName, localData, skipSync]);

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
    localData === 'loading' && !hasInitialLocalLoad && !networkData && !cachedData;

  const isError = isNetworkError && !hasInitialLocalLoad;
  const error = isError ? networkError : null;

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: resolvedData as any[],
    isLoading: isHardLoading,
    isFetching: isNetworkFetching,
    isError,
    error,
    refetch,
    networkStatus: networkQueryStatus,
    isSyncing: isNetworkFetching,
  };
}