// hooks/data/useLocalFirstQuery.ts
import { useQuery, type QueryKey } from '@tanstack/react-query';
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
  
  // NEW ENTRIES FOR EXPENSES
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

  // 1. Fetch Local Data
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
  });

  // 3. Safe Sync Network Data to Local DB (Upsert + Prune)
  useEffect(() => {
    if (skipSync) return;

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

          // B. Filter and UPSERT (Update/Insert) from Network
          const primaryKey = dexieTable.schema.primKey.name;

          const dataToSave = (networkData as unknown as TLocal[]).filter((item) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pkValue = (item as any)[primaryKey];
            if (pkValue === null || pkValue === undefined) return false;
            const pkStr = String(pkValue);
            return !dirtyIds.has(pkStr);
          });

          if (dataToSave.length > 0) {
            // Optimization: Deep compare to avoid unnecessary writes
            const shouldWrite = !isEqual(dataToSave, localData);
            if (shouldWrite) {
              await dexieTable.bulkPut(dataToSave);
            }
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

  const resolvedData =
    preferNetwork && networkData
      ? networkData
      : Array.isArray(localData)
      ? localData
      : [];

  const isHardLoading = localData === 'loading' && !hasInitialLocalLoad && !networkData;

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