// hooks/data/useDataSync.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { localDb, HNVTMDatabase, getTable } from '@/hooks/data/localDb';
import { PublicTableOrViewName } from '@/hooks/database';
import { SupabaseClient } from '@supabase/supabase-js';
import { useState, useCallback } from 'react';

const BATCH_SIZE = 2500;

type SyncStrategy = 'full' | 'incremental';

interface EntitySyncConfig {
  strategy: SyncStrategy;
  timestampColumn?: string; // e.g., 'created_at' or 'updated_at'
}

// Configuration Map for Sync Strategies
const SYNC_CONFIG: Record<PublicTableOrViewName, EntitySyncConfig> = {
  // --- Incremental Sync Tables (True Append-Only / History) ---
  v_audit_logs: { strategy: 'incremental', timestampColumn: 'created_at' },
  v_inventory_transactions_extended: { strategy: 'incremental', timestampColumn: 'created_at' },
  v_file_movements_extended: { strategy: 'incremental', timestampColumn: 'created_at' },
  inventory_transactions: { strategy: 'incremental', timestampColumn: 'created_at' },
  user_activity_logs: { strategy: 'incremental', timestampColumn: 'created_at' },
  file_movements: { strategy: 'incremental', timestampColumn: 'created_at' },

  // --- FULL SYNC TABLES (Operational Data) ---
  systems: { strategy: 'full' },
  system_connections: { strategy: 'full' },
  ports_management: { strategy: 'full' },
  ofc_connections: { strategy: 'full' },
  services: { strategy: 'full' },
  nodes: { strategy: 'full' },
  rings: { strategy: 'full' },
  ofc_cables: { strategy: 'full' },

  // --- VIEWS ---
  v_systems_complete: { strategy: 'full' },
  v_system_connections_complete: { strategy: 'full' },
  v_ports_management_complete: { strategy: 'full' },
  v_ofc_connections_complete: { strategy: 'full' },
  v_services: { strategy: 'full' },
  v_nodes_complete: { strategy: 'full' },
  v_ring_nodes: { strategy: 'full' },
  v_rings: { strategy: 'full' },
  v_ofc_cables_complete: { strategy: 'full' },
  v_cable_utilization: { strategy: 'full' },
  v_end_to_end_paths: { strategy: 'full' },
  v_inventory_items: { strategy: 'full' },
  v_e_files_extended: { strategy: 'full' },
  v_employee_designations: { strategy: 'full' },
  v_junction_closures_complete: { strategy: 'full' },
  v_cable_segments_at_jc: { strategy: 'full' },
  v_maintenance_areas: { strategy: 'full' },
  v_lookup_types: { strategy: 'full' },
  v_user_profiles_extended: { strategy: 'full' },
  v_employees: { strategy: 'full' },

  // --- Reference & Small Tables ---
  lookup_types: { strategy: 'full' },
  employee_designations: { strategy: 'full' },
  user_profiles: { strategy: 'full' },
  maintenance_areas: { strategy: 'full' },
  employees: { strategy: 'full' },
  ring_based_systems: { strategy: 'full' },
  logical_fiber_paths: { strategy: 'full' },
  logical_paths: { strategy: 'full' },
  inventory_items: { strategy: 'full' },
  diary_notes: { strategy: 'full' },
  e_files: { strategy: 'full' },
  files: { strategy: 'full' },
  folders: { strategy: 'full' },
  cable_segments: { strategy: 'full' },
  junction_closures: { strategy: 'full' },
  fiber_splices: { strategy: 'full' },
  logical_path_segments: { strategy: 'full' },
  sdh_connections: { strategy: 'full' },
};

async function performFullSync(
  supabase: SupabaseClient,
  db: HNVTMDatabase,
  entityName: PublicTableOrViewName
) {
  const table = getTable(entityName);
  let offset = 0;
  let hasMore = true;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allFetchedData: any[] = [];

  // 1. Fetch all data from server in batches
  while (hasMore) {
    const { data: rpcResponse, error: rpcError } = await supabase.rpc('get_paged_data', {
      p_view_name: entityName,
      p_limit: BATCH_SIZE,
      p_offset: offset,
      p_filters: {},
    });

    if (rpcError) throw rpcError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseData = (rpcResponse as { data: any[] })?.data || [];
    const validData = responseData.filter((item) => item.id != null);

    if (validData.length > 0) {
      allFetchedData.push(...validData);
    }

    if (responseData.length < BATCH_SIZE) {
      hasMore = false;
    } else {
      offset += BATCH_SIZE;
    }
  }

  // 2. Atomic Replacement in Local DB
  await db.transaction('rw', table, async () => {
    await table.clear();
    if (allFetchedData.length > 0) {
      await table.bulkPut(allFetchedData);
    }
  });

  return allFetchedData.length;
}

async function performIncrementalSync(
  supabase: SupabaseClient,
  db: HNVTMDatabase,
  entityName: PublicTableOrViewName,
  timestampColumn: string = 'created_at'
) {
  const table = getTable(entityName);

  const latestRecord = await table.orderBy(timestampColumn).last();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastTimestamp: string | null = (latestRecord as any)?.[timestampColumn] || null;

  let offset = 0;
  let hasMore = true;
  let totalSynced = 0;

  while (hasMore) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filters: any = {};

    if (lastTimestamp) {
      filters[timestampColumn] = { operator: '>', value: lastTimestamp };
    }

    const { data: rpcResponse, error: rpcError } = await supabase.rpc('get_paged_data', {
      p_view_name: entityName,
      p_limit: BATCH_SIZE,
      p_offset: offset,
      p_filters: filters,
      p_order_by: timestampColumn,
      p_order_dir: 'asc',
    });

    if (rpcError) throw rpcError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseData = (rpcResponse as { data: any[] })?.data || [];
    const validData = responseData.filter((item) => item.id != null);

    if (validData.length > 0) {
      await table.bulkPut(validData);
      totalSynced += validData.length;

      const lastItem = validData[validData.length - 1];
      if (lastItem[timestampColumn]) {
        lastTimestamp = lastItem[timestampColumn];
      }
    }

    if (responseData.length < BATCH_SIZE) {
      hasMore = false;
    } else {
      offset += BATCH_SIZE;
    }
  }

  return totalSynced;
}

export async function syncEntity(
  supabase: SupabaseClient,
  db: HNVTMDatabase,
  entityName: PublicTableOrViewName
) {
  try {
    await db.sync_status.put({
      tableName: entityName,
      status: 'syncing',
      lastSynced: new Date().toISOString(),
    });

    let count = 0;
    const config = SYNC_CONFIG[entityName];

    if (config?.strategy === 'incremental') {
      count = await performIncrementalSync(supabase, db, entityName, config.timestampColumn);
    } else {
      count = await performFullSync(supabase, db, entityName);
    }

    await db.sync_status.put({
      tableName: entityName,
      status: 'success',
      lastSynced: new Date().toISOString(),
      count,
    });
  } catch (err) {
    const errorMessage =
      err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Unknown error';
    console.error(`❌ [Sync] Error syncing entity ${entityName}:`, errorMessage);

    await db.sync_status.put({
      tableName: entityName,
      status: 'error',
      lastSynced: new Date().toISOString(),
      error: errorMessage,
    });
    // We throw to let the parent Promise.allSettled or try/catch block handle the UI feedback
    throw new Error(`Failed to sync ${entityName}: ${errorMessage}`);
  }
}

export function useDataSync() {
  const supabase = createClient();
  const syncStatus = useLiveQuery(() => localDb.sync_status.toArray(), []);
  const queryClient = useQueryClient();

  // Internal loading state for imperative sync
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<Error | null>(null);

  // THE FIX: Renamed from 'refetch' to 'executeSync' and modified to accept tables
  const executeSync = useCallback(
    async (specificTables?: PublicTableOrViewName[]) => {
      setIsSyncing(true);
      setSyncError(null);

      try {
        const failures: string[] = [];
        // Use specific tables if provided, otherwise sync ALL
        const entitiesToSync =
          specificTables && specificTables.length > 0
            ? specificTables
            : (Object.keys(SYNC_CONFIG) as PublicTableOrViewName[]);

        const isPartial = entitiesToSync.length < Object.keys(SYNC_CONFIG).length;

        if (!isPartial) {
          toast.info('Starting full sync...');
        }

        // Process sequentially to manage load and connection pool
        for (const entity of entitiesToSync) {
          try {
            await syncEntity(supabase, localDb, entity);
          } catch (e) {
            failures.push(`${entity} (${(e as Error).message})`);
          }
        }

        if (typeof window !== 'undefined' && !isPartial) {
          localStorage.setItem('query_cache_buster', `v-${Date.now()}`);
        }

        if (failures.length === 0) {
          toast.success(isPartial ? 'Page data refreshed.' : 'All local data is up to date.');
        } else {
          toast.warning(`Sync completed with warnings. ${failures.length} tables failed.`);
        }

        // If partial, only invalidate specific queries related to those tables
        if (isPartial) {
          // We broadly invalidate queries containing the table name.
          // This is a heuristic but works with our key structure ['table', 'tableName'] or ['tableName-data']
          await queryClient.invalidateQueries({
            predicate: (query) => {
              const key = query.queryKey as unknown[];
              return entitiesToSync.some(
                (table) =>
                  // Check various key patterns
                  key.includes(table) || (typeof key[0] === 'string' && key[0].includes(table))
              );
            },
          });
        } else {
          // Full invalidation
          await queryClient.invalidateQueries({
            predicate: (query) => query.queryKey[0] !== 'data-sync-all',
          });
        }

        if (failures.length > 0) {
          console.error('Sync Failures:', failures);
        }

        return { lastSynced: new Date().toISOString() };
      } catch (err) {
        setSyncError(err as Error);
        toast.error('Sync process failed.');
        throw err;
      } finally {
        setIsSyncing(false);
      }
    },
    [supabase, queryClient]
  );

  // Initial load check (optional, can be kept minimal)
  const { data: globalSyncState } = useQuery({
    queryKey: ['data-sync-all'],
    queryFn: () => ({ lastSynced: null }), // We don't auto-sync all on mount anymore
    enabled: false,
    staleTime: Infinity,
  });

  return {
    isSyncing,
    syncError,
    syncStatus,
    sync: executeSync,
    lastGlobalSync: globalSyncState?.lastSynced,
  };
}
