// hooks/data/useDataSync.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { localDb, HNVTMDatabase, getTable } from '@/hooks/data/localDb';
import { PublicTableOrViewName } from '@/hooks/database';
import { SupabaseClient } from '@supabase/supabase-js';

const BATCH_SIZE = 2500;

type SyncStrategy = 'full' | 'incremental';

interface EntitySyncConfig {
  strategy: SyncStrategy;
  timestampColumn?: string; // e.g., 'created_at' or 'updated_at'
}

// Configuration Map for Sync Strategies
const SYNC_CONFIG: Record<PublicTableOrViewName, EntitySyncConfig> = {
  // --- Incremental Sync Tables (True Append-Only / History) ---
  'v_audit_logs': { strategy: 'incremental', timestampColumn: 'created_at' },
  'v_inventory_transactions_extended': { strategy: 'incremental', timestampColumn: 'created_at' },
  'v_file_movements_extended': { strategy: 'incremental', timestampColumn: 'created_at' },
  'inventory_transactions': { strategy: 'incremental', timestampColumn: 'created_at' },
  'user_activity_logs': { strategy: 'incremental', timestampColumn: 'created_at' }, 
  'file_movements': { strategy: 'incremental', timestampColumn: 'created_at' }, 

  // --- RAW TABLES (Safe for Incremental if updated_at is reliable) ---
  'systems': { strategy: 'incremental', timestampColumn: 'updated_at' },
  'system_connections': { strategy: 'incremental', timestampColumn: 'updated_at' },
  'ports_management': { strategy: 'incremental', timestampColumn: 'updated_at' },
  'ofc_connections': { strategy: 'incremental', timestampColumn: 'updated_at' }, 
  'services': { strategy: 'incremental', timestampColumn: 'updated_at' },

  // --- VIEWS (Reverted to FULL SYNC to prevent stale joins) ---
  // Views involve joins. If a joined table updates, the view row changes
  // but the primary ID's updated_at might not. This leads to stale local data
  // with incremental sync. Reverting to FULL for data integrity.
  'v_systems_complete': { strategy: 'full' },
  'v_system_connections_complete': { strategy: 'full' },
  'v_ports_management_complete': { strategy: 'full' },
  'v_ofc_connections_complete': { strategy: 'full' }, 
  'v_services': { strategy: 'full' },

  // --- Full Sync Tables (Reference / Small) ---
  'lookup_types': { strategy: 'full' },
  'v_lookup_types': { strategy: 'full' },
  'employee_designations': { strategy: 'full' },
  'user_profiles': { strategy: 'full' },
  'v_user_profiles_extended': { strategy: 'full' },
  'maintenance_areas': { strategy: 'full' },
  'v_maintenance_areas': { strategy: 'full' },
  'employees': { strategy: 'full' },
  'v_employees': { strategy: 'full' },
  'nodes': { strategy: 'full' },
  'v_nodes_complete': { strategy: 'full' },
  'v_ring_nodes': { strategy: 'full' },
  'rings': { strategy: 'full' },
  'v_rings': { strategy: 'full' },
  'ring_based_systems': { strategy: 'full' },
  'ofc_cables': { strategy: 'full' },
  'v_ofc_cables_complete': { strategy: 'full' },
  'v_cable_utilization': { strategy: 'full' },
  'logical_fiber_paths': { strategy: 'full' },
  'v_end_to_end_paths': { strategy: 'full' },
  'logical_paths': { strategy: 'full' },
  'inventory_items': { strategy: 'full' },
  'v_inventory_items': { strategy: 'full' },
  'diary_notes': { strategy: 'full' },
  'e_files': { strategy: 'full' },
  'v_e_files_extended': { strategy: 'full' },
  'files': { strategy: 'full' },
  'folders': { strategy: 'full' },
  'cable_segments': { strategy: 'full' },
  'junction_closures': { strategy: 'full' },
  'fiber_splices': { strategy: 'full' },
  'logical_path_segments': { strategy: 'full' },
  'sdh_connections': { strategy: 'full' },
  'v_employee_designations': { strategy: 'full' },
  'v_junction_closures_complete': { strategy: 'full' },
  'v_cable_segments_at_jc': { strategy: 'full' }
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
      const validData = responseData.filter(item => item.id != null);

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
      p_order_dir: 'asc'
    });

    if (rpcError) throw rpcError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseData = (rpcResponse as { data: any[] })?.data || [];
    const validData = responseData.filter(item => item.id != null);

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
    await db.sync_status.put({ tableName: entityName, status: 'syncing', lastSynced: new Date().toISOString() });

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
      count
    });

  } catch (err) {
    const errorMessage = err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Unknown error';
    console.error(`❌ [Sync] Error syncing entity ${entityName}:`, errorMessage);

    await db.sync_status.put({
      tableName: entityName,
      status: 'error',
      lastSynced: new Date().toISOString(),
      error: errorMessage,
    });
    throw new Error(`Failed to sync ${entityName}: ${errorMessage}`);
  }
}

export function useDataSync() {
  const supabase = createClient();
  const syncStatus = useLiveQuery(() => localDb.sync_status.toArray(), []);
  const queryClient = useQueryClient();

  const { isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['data-sync-all'],
    queryFn: async () => {
      try {
        const failures: string[] = [];
        
        const entitiesToSync = Object.keys(SYNC_CONFIG) as PublicTableOrViewName[];

        for (const entity of entitiesToSync) {
          try {
              await syncEntity(supabase, localDb, entity);
          } catch (e) {
              failures.push(`${entity} (${(e as Error).message})`);
          }
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('query_cache_buster', `v-${Date.now()}`);
        }

        if (failures.length === 0) {
          toast.success('Local data is up to date.');
        } else {
           toast.warning(`Sync completed with warnings. ${failures.length} tables failed.`);
        }

        await queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] !== 'data-sync-all'
        });

        if (failures.length > 0) {
            console.error("Sync Failures:", failures);
        }

        return { lastSynced: new Date().toISOString() };
      } catch (err) {
        throw err;
      }
    },
    enabled: false,
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: false,
  });

  return {
    isSyncing: isLoading || isFetching,
    syncError: error,
    syncStatus,
    sync: refetch
  };
}