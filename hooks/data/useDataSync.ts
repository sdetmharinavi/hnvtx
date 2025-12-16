// hooks/data/useDataSync.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { localDb, HNVTMDatabase, getTable } from '@/hooks/data/localDb';
import { PublicTableOrViewName } from '@/hooks/database';
import { SupabaseClient } from '@supabase/supabase-js';

const BATCH_SIZE = 2500;

// List of tables that should be synced completely (Full Sync)
const ENTITIES_FULL_SYNC: PublicTableOrViewName[] = [
  'lookup_types',
  'employee_designations',
  'user_profiles',
  'diary_notes',
  'inventory_items',
  'rings',
  'nodes',
  'systems',
  'ring_based_systems',
  'ports_management',
  'logical_fiber_paths',
  'v_nodes_complete',
  'v_ofc_cables_complete',
  'v_systems_complete',
  'v_rings',
  'v_employees',
  'v_maintenance_areas',
  'v_cable_utilization',
  'v_ring_nodes',
  'v_employee_designations',
  'v_inventory_items',
  'v_user_profiles_extended',
  'v_ofc_connections_complete',
  'v_system_connections_complete',
  'v_ports_management_complete',
  'v_end_to_end_paths',
  'v_services',
];

// List of tables that should be synced incrementally (Append Only)
const ENTITIES_INCREMENTAL_SYNC: PublicTableOrViewName[] = [
  'v_audit_logs',
  'v_inventory_transactions_extended'
];

/**
 * Performs a safe, atomic Full Sync of an entity.
 */
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

  await db.transaction('rw', table, async () => {
    await table.clear();
    if (allFetchedData.length > 0) {
      await table.bulkPut(allFetchedData);
    }
  });

  return allFetchedData.length;
}

/**
 * Performs an Incremental Sync for append-only data.
 */
async function performIncrementalSync(
  supabase: SupabaseClient,
  db: HNVTMDatabase,
  entityName: PublicTableOrViewName
) {
  const table = getTable(entityName);
  
  // 1. Find the latest timestamp locally
  const latestRecord = await table.orderBy('created_at').last();
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastCreatedAt: string | null = (latestRecord as any)?.created_at || null;
  
  let offset = 0;
  let hasMore = true;
  let totalSynced = 0;

  while (hasMore) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filters: any = {};
    if (lastCreatedAt) {
      // THE FIX: Use '>' instead of 'gt' for SQL syntax compatibility in build_where_clause.
      // Also, we try to ensure the string format is comparable if possible, but usually ISO is safe enough 
      // if the DB cast::text output is consistent. 
      // Note: 'get_paged_data' calls 'build_where_clause' which injects this operator directly.
      filters['created_at'] = { operator: '>', value: lastCreatedAt };
    }

    const { data: rpcResponse, error: rpcError } = await supabase.rpc('get_paged_data', {
      p_view_name: entityName,
      p_limit: BATCH_SIZE,
      p_offset: offset,
      p_filters: filters,
      p_order_by: 'created_at',
      p_order_dir: 'asc' // Oldest to newest
    });

    if (rpcError) throw rpcError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseData = (rpcResponse as { data: any[] })?.data || [];
    const validData = responseData.filter(item => item.id != null);

    if (validData.length > 0) {
      // Use put to upsert to avoid key collision errors if overlap occurs
      await table.bulkPut(validData);
      totalSynced += validData.length;
      
      const lastItem = validData[validData.length - 1];
      if (lastItem.created_at) {
        lastCreatedAt = lastItem.created_at;
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
    // Only log if not pending to avoid spam
    // console.log(`[Sync] Starting sync for ${entityName}...`);
    await db.sync_status.put({ tableName: entityName, status: 'syncing', lastSynced: new Date().toISOString() });

    let count = 0;

    if (ENTITIES_INCREMENTAL_SYNC.includes(entityName)) {
      count = await performIncrementalSync(supabase, db, entityName);
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
    // Log error to console but do not break the app flow
    console.error(`❌ [Sync] Error syncing entity ${entityName}:`, errorMessage);
    
    await db.sync_status.put({
      tableName: entityName,
      status: 'error',
      lastSynced: new Date().toISOString(),
      error: errorMessage,
    });
    
    // Throw to let the main loop know, but the loop catches it
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
        const allEntities = [...ENTITIES_FULL_SYNC, ...ENTITIES_INCREMENTAL_SYNC];

        // Process sequentially
        for (const entity of allEntities) {
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
           toast.warning(`Sync completed with errors: ${failures.length} tables failed.`);
        }
        
        await queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] !== 'data-sync-all'
        });

        if (failures.length > 0) {
            // Log full details to console but don't crash the query
            console.error("Sync Failures:", failures);
        }

        return { lastSynced: new Date().toISOString() };
      } catch (err) {
        throw err;
      }
    },
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
    syncStatus, // Return the live query result for UI usage
    sync: refetch
  };
}