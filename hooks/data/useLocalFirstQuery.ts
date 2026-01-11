// hooks/data/useLocalFirstQuery.ts
import { useQuery, type QueryKey } from '@tanstack/react-query';
import { useLiveQuery } from 'dexie-react-hooks';
import { useEffect, useRef } from 'react';
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
  tableName?: string; // Explicit table name for conflict checking (e.g. 'systems' vs 'v_systems_complete')
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
  // We use a ref to track if we are currently syncing to avoid loops
  const isSyncingRef = useRef(false);

  // 1. Fetch Local Data (Reactive)
  const localData = useLiveQuery(localQueryFn, localQueryDeps, 'loading');

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
        throw new Error('Offline');
      }
      return onlineQueryFn();
    },
    enabled: shouldFetchOnMount,
    refetchOnWindowFocus: false,
    refetchOnMount: refetchOnMount,
    refetchOnReconnect: false, // We rely on useDataSync or manual refresh
    staleTime,
    retry: 1,
  });

  // 3. Safe Sync Network Data to Local DB (Preserve Dirty Records)
  useEffect(() => {
    if (networkData && !isSyncingRef.current) {
      const syncToLocal = async () => {
        try {
          isSyncingRef.current = true;

          // Determine which table mutations we should care about
          const targetTableName =
            tableName || VIEW_TO_TABLE_MAP[dexieTable.name] || dexieTable.name;

          // Fetch IDs of records that are currently pending sync (dirty)
          const pendingMutations = await localDb.mutation_queue
            .where('tableName')
            .equals(targetTableName)
            .filter((task) => task.status === 'pending' || task.status === 'processing')
            .toArray();

          const dirtyIds = new Set<string>();
          pendingMutations.forEach((task) => {
            // Extract ID from payload based on mutation type
            if (task.type === 'update' && task.payload?.id) {
              dirtyIds.add(String(task.payload.id));
            } else if (task.type === 'delete' && task.payload?.ids) {
              task.payload.ids.forEach((id: string | number) => dirtyIds.add(String(id)));
            }
            // For inserts, we assume they have temp IDs or won't collide with server IDs yet
          });

          const primaryKey = dexieTable.schema.primKey.name;
          let dataToSave = networkData as unknown as TLocal[];

          // Filter logic
          dataToSave = dataToSave.filter((item) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pkValue = (item as any)[primaryKey];

            // 1. Basic Validity Check
            if (pkValue === null || pkValue === undefined) return false;

            // 2. Conflict Check: If this record is dirty locally, DO NOT overwrite it with server data
            if (dirtyIds.has(String(pkValue))) {
              // console.log(`[SafeSync] Skipping overwrite of dirty record: ${pkValue}`);
              return false;
            }

            return true;
          });

          if (dataToSave.length > 0) {
            await dexieTable.bulkPut(dataToSave);
          }
        } catch (e) {
          console.error(`[useLocalFirstQuery] Failed to sync data to ${dexieTable.name}`, e);
        } finally {
          isSyncingRef.current = false;
        }
      };

      syncToLocal();
    }
  }, [networkData, dexieTable, tableName]);

  // 4. Determine Loading State
  const isLocalLoading = localData === 'loading';
  const hasLocalData = Array.isArray(localData) && localData.length > 0;

  // Optimized loading state:
  // If we have local data, we are NOT loading (display stale-while-revalidate).
  // If we have NO local data, we are loading until network returns.
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
