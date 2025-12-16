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
// These are entities that can be edited/deleted, so a full refresh ensures deletions are propagated locally.
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
// These are typically logs or history where deletion is rare/forbidden and data volume is high.
const ENTITIES_INCREMENTAL_SYNC: PublicTableOrViewName[] = [
  'v_audit_logs',
  'v_inventory_transactions_extended',
];

/**
 * Performs a safe, atomic Full Sync of an entity.
 * Fetches all data into memory (batched), clears the local table, and bulk inserts.
 * Recommended for datasets < 50,000 rows.
 */
async function performFullSync(
  supabase: SupabaseClient,
  db: HNVTMDatabase,
  entityName: PublicTableOrViewName
) {
  const table = getTable(entityName);
  let offset = 0;
  let hasMore = true;

  // Temporary storage for the new dataset
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
    // Ensure we only sync records with IDs to satisfy Dexie keys
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

  // Atomic Update: Clear and Write
  // Using a transaction ensures we don't leave the table empty if the write fails
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
 * Finds the latest `created_at` timestamp locally, then fetches only newer records.
 */
async function performIncrementalSync(
  supabase: SupabaseClient,
  db: HNVTMDatabase,
  entityName: PublicTableOrViewName
) {
  const table = getTable(entityName);

  // 1. Find the latest timestamp locally
  // We assume the table has a 'created_at' index as defined in localDb.ts version 25
  const latestRecord = await table.orderBy('created_at').last();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let lastCreatedAt: string | null = (latestRecord as any)?.created_at || null;

  let offset = 0;
  let hasMore = true;
  let totalSynced = 0;

  while (hasMore) {
    // Construct filters: fetch records strictly greater than last local timestamp
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filters: any = {};
    if (lastCreatedAt) {
      filters['created_at'] = { operator: 'gt', value: lastCreatedAt };
    }

    const { data: rpcResponse, error: rpcError } = await supabase.rpc('get_paged_data', {
      p_view_name: entityName,
      p_limit: BATCH_SIZE,
      p_offset: offset,
      p_filters: filters,
      p_order_by: 'created_at',
      p_order_dir: 'asc', // Oldest to newest among the new records
    });

    if (rpcError) throw rpcError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const responseData = (rpcResponse as { data: any[] })?.data || [];
    const validData = responseData.filter((item) => item.id != null);

    if (validData.length > 0) {
      await table.bulkPut(validData);
      totalSynced += validData.length;

      // Update tracking cursor
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
    await db.sync_status.put({
      tableName: entityName,
      status: 'syncing',
      lastSynced: new Date().toISOString(),
    });

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
    // We throw to let the caller know something failed, but other tables might still succeed
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

        // Combine all entities to sync
        const allEntities = [...ENTITIES_FULL_SYNC, ...ENTITIES_INCREMENTAL_SYNC];

        // Process sequentially to manage network load, or use Promise.allLimit if available
        // For simplicity and reliability, we do it sequentially here.
        for (const entity of allEntities) {
          try {
            await syncEntity(supabase, localDb, entity);
          } catch (e) {
            failures.push(`${entity} (${(e as Error).message})`);
            // Continue syncing other tables even if one fails
          }
        }

        if (typeof window !== 'undefined') {
          localStorage.setItem('query_cache_buster', `v-${Date.now()}`);
        }

        // Only hard invalidate if everything succeeded, otherwise we might have partial stale data
        if (failures.length === 0) {
          toast.success('Local data is up to date.');
        } else {
          toast.warning(`Sync completed with errors: ${failures.length} tables failed.`);
        }

        await queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] !== 'data-sync-all',
        });

        if (failures.length > 0) {
          throw new Error(`Failed entities: ${failures.join(', ')}`);
        }

        return { lastSynced: new Date().toISOString() };
      } catch (err) {
        const message = (err as Error).message;
        console.error(`Data sync failed: ${message}`);
        // Toast is already handled in the failure block logic usually
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
    syncStatus,
    sync: refetch,
  };
}
