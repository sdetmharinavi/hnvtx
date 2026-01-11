// hooks/data/useDataSync.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { localDb, HNVTMDatabase, getTable, MutationTask } from '@/hooks/data/localDb';
import { PublicTableOrViewName, PublicTableName } from '@/hooks/database';
import { SupabaseClient } from '@supabase/supabase-js';
import { useState, useCallback } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

const BATCH_SIZE = 2000;

type SyncStrategy = 'full' | 'incremental';

interface EntitySyncConfig {
  strategy: SyncStrategy;
  timestampColumn?: string;
  relatedTable?: PublicTableName;
}

const SYNC_CONFIG: Record<PublicTableOrViewName, EntitySyncConfig> = {
  'v_audit_logs': { strategy: 'incremental', timestampColumn: 'created_at', relatedTable: 'user_activity_logs' },
  'v_inventory_transactions_extended': { strategy: 'incremental', timestampColumn: 'created_at', relatedTable: 'inventory_transactions' },
  'v_file_movements_extended': { strategy: 'incremental', timestampColumn: 'created_at', relatedTable: 'file_movements' },
  'inventory_transactions': { strategy: 'incremental', timestampColumn: 'created_at' },
  'user_activity_logs': { strategy: 'incremental', timestampColumn: 'created_at' },
  'file_movements': { strategy: 'incremental', timestampColumn: 'created_at' },
  'systems': { strategy: 'full' },
  'system_connections': { strategy: 'full' },
  'ports_management': { strategy: 'full' },
  'ofc_connections': { strategy: 'full' },
  'services': { strategy: 'full' },
  'nodes': { strategy: 'full' },
  'rings': { strategy: 'full' },
  'ofc_cables': { strategy: 'full' },
  'lookup_types': { strategy: 'full' },
  'employee_designations': { strategy: 'full' },
  'user_profiles': { strategy: 'full' },
  'maintenance_areas': { strategy: 'full' },
  'employees': { strategy: 'full' },
  'ring_based_systems': { strategy: 'full' },
  'logical_fiber_paths': { strategy: 'full' },
  'logical_paths': { strategy: 'full' },
  'inventory_items': { strategy: 'full' },
  'diary_notes': { strategy: 'full' },
  'e_files': { strategy: 'full' },
  'files': { strategy: 'full' },
  'folders': { strategy: 'full' },
  'cable_segments': { strategy: 'full' },
  'junction_closures': { strategy: 'full' },
  'fiber_splices': { strategy: 'full' },
  'logical_path_segments': { strategy: 'full' },
  'sdh_connections': { strategy: 'full' },
  'v_systems_complete': { strategy: 'full', relatedTable: 'systems' },
  'v_system_connections_complete': { strategy: 'full', relatedTable: 'system_connections' },
  'v_ports_management_complete': { strategy: 'full', relatedTable: 'ports_management' },
  'v_ofc_connections_complete': { strategy: 'full', relatedTable: 'ofc_connections' },
  'v_services': { strategy: 'full', relatedTable: 'services' },
  'v_nodes_complete': { strategy: 'full', relatedTable: 'nodes' },
  'v_ring_nodes': { strategy: 'full', relatedTable: 'systems' },
  'v_rings': { strategy: 'full', relatedTable: 'rings' },
  'v_ofc_cables_complete': { strategy: 'full', relatedTable: 'ofc_cables' },
  'v_cable_utilization': { strategy: 'full', relatedTable: 'ofc_cables' },
  'v_end_to_end_paths': { strategy: 'full', relatedTable: 'logical_fiber_paths' },
  'v_inventory_items': { strategy: 'full', relatedTable: 'inventory_items' },
  'v_e_files_extended': { strategy: 'full', relatedTable: 'e_files' },
  'v_employee_designations': { strategy: 'full', relatedTable: 'employee_designations' },
  'v_junction_closures_complete': { strategy: 'full', relatedTable: 'junction_closures' },
  'v_cable_segments_at_jc': { strategy: 'full', relatedTable: 'cable_segments' },
  'v_maintenance_areas': { strategy: 'full', relatedTable: 'maintenance_areas' },
  'v_lookup_types': { strategy: 'full', relatedTable: 'lookup_types' },
  'v_user_profiles_extended': { strategy: 'full', relatedTable: 'user_profiles' },
  'v_employees': { strategy: 'full', relatedTable: 'employees' },
};

// Helper: Merges local pending changes into the server dataset to prevent overwriting user's offline work
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergePendingMutations(serverData: any[], pendingTasks: MutationTask[]) {
  const merged = [...serverData];
  const serverIdMap = new Map(merged.map((item, index) => [item.id, index]));

  pendingTasks.forEach(task => {
    if (task.type === 'insert') {
      // For inserts, we add them if they don't collide with server IDs
      if (!serverIdMap.has(task.payload.id)) {
        merged.push(task.payload);
      }
    } else if (task.type === 'update') {
      // For updates, we apply the local change on top of server data
      const targetId = task.payload.id;
      const index = serverIdMap.get(targetId);
      if (index !== undefined) {
        merged[index] = { ...merged[index], ...task.payload.data };
      }
    } else if (task.type === 'delete') {
      // For deletes, we remove the item from the incoming server list
      // (This handles the race condition where server sends data, but user just deleted it locally)
      const idsToDelete = new Set(task.payload.ids);
      for (let i = merged.length - 1; i >= 0; i--) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (idsToDelete.has((merged[i] as any).id)) {
          merged.splice(i, 1);
        }
      }
    }
  });
  return merged;
}

// ** MODIFIED: Safe Sync Implementation **
// Instead of clearing the table, we Upsert batches and then Prune stale records.
async function performFullSync(
    supabase: SupabaseClient,
    db: HNVTMDatabase,
    entityName: PublicTableOrViewName,
    config: EntitySyncConfig
  ) {
    const table = getTable(entityName);
    let offset = 0;
    let hasMore = true;
    let totalSynced = 0;

    // 1. Fetch pending local mutations to respect offline work
    let pendingTasks: MutationTask[] = [];
    if (config.relatedTable) {
       pendingTasks = await db.mutation_queue
         .where('tableName')
         .equals(config.relatedTable)
         .toArray();
       pendingTasks = pendingTasks.filter(t => t.status === 'pending' || t.status === 'processing');
    }

    // Identify pending INSERT IDs. We must NOT delete these during the pruning phase.
    const pendingInsertIds = new Set(
        pendingTasks
            .filter(t => t.type === 'insert')
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map(t => String((t.payload as any).id))
    );

    // Track all IDs seen from the server to identify what needs deletion later
    const serverIdsSeen = new Set<string>();

    // 2. Fetch & Upsert Loop
    while (hasMore) {
      const { data: rpcResponse, error: rpcError } = await supabase.rpc('get_paged_data', {
        p_view_name: entityName,
        p_limit: BATCH_SIZE,
        p_offset: offset,
        p_filters: {},
      });

      if (rpcError) throw rpcError;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let batchData = (rpcResponse as { data: any[] })?.data || [];
      const validDataCount = batchData.length;

      if (validDataCount > 0) {
        // Track IDs from server
        batchData.forEach(item => {
            if (item.id !== undefined && item.id !== null) {
                serverIdsSeen.add(String(item.id));
            } else if (entityName === 'ring_based_systems') {
                // Special case for composite keys if needed, 
                // but Dexie bulkDelete usually needs primary keys. 
                // ring_based_systems uses [system_id, ring_id].
                // For simplicity in this generic function, we might skip pruning 
                // complex composite key tables or handle them specifically if needed.
                // Assuming standard 'id' for most tables.
            }
        });

        // Merge local edits onto server data
        if (pendingTasks.length > 0) {
            batchData = mergePendingMutations(batchData, pendingTasks);
        }

        // UPSERT (put) instead of add. This updates existing records and adds new ones.
        await db.transaction('rw', table, async () => {
            await table.bulkPut(batchData);
        });

        totalSynced += batchData.length;
      }

      if (validDataCount < BATCH_SIZE) {
        hasMore = false;
      } else {
        offset += BATCH_SIZE;
      }
    }

    // 3. Handle Local Creations (Pending Inserts)
    // We explicitly re-apply pending inserts to ensure they exist locally
    // (in case the merge step above didn't cover them because they weren't in server batches)
    if (pendingTasks.length > 0) {
        const inserts = pendingTasks.filter(t => t.type === 'insert').map(t => t.payload);
        if (inserts.length > 0) {
            await db.transaction('rw', table, async () => {
                await table.bulkPut(inserts);
            });
            // Add these to "Seen" so we don't prune them
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            inserts.forEach((item: any) => {
                if (item.id) serverIdsSeen.add(String(item.id));
            });
            totalSynced += inserts.length;
        }
    }

    // 4. Prune Stale Data (The "Sweep" Phase)
    // We only perform this if the table uses a simple 'id' primary key.
    // Complex composite keys are harder to diff generically and less prone to "stale ghost" issues in this specific app.
    if (table.schema.primKey.name === 'id') {
        const allLocalKeys = await table.toCollection().primaryKeys();
        
        // Find keys present locally but NOT on server AND NOT pending insert
        const keysToDelete = allLocalKeys.filter(key => {
            const keyStr = String(key);
            return !serverIdsSeen.has(keyStr) && !pendingInsertIds.has(keyStr);
        });

        if (keysToDelete.length > 0) {
            // console.log(`[Sync] Pruning ${keysToDelete.length} stale records from ${entityName}`);
            await table.bulkDelete(keysToDelete);
        }
    }

    return totalSynced;
}

// Incremental sync logic remains unchanged as it inherently relies on upserts
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
    const safeConfig = config || { strategy: 'full' };

    if (safeConfig.strategy === 'incremental') {
      count = await performIncrementalSync(supabase, db, entityName, safeConfig.timestampColumn);
    } else {
      count = await performFullSync(supabase, db, entityName, safeConfig);
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
  const isOnline = useOnlineStatus();

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncError, setSyncError] = useState<Error | null>(null);

  const executeSync = useCallback(async (specificTables?: PublicTableOrViewName[]) => {
    // 1. Online Check
    if (!isOnline) {
        toast.error("Cannot sync while offline.");
        return;
    }

    setIsSyncing(true);
    setSyncError(null);
    const startTime = Date.now();

    try {
      const failures: string[] = [];
      const entitiesToSync = specificTables && specificTables.length > 0
        ? specificTables
        : (Object.keys(SYNC_CONFIG) as PublicTableOrViewName[]);

      const isPartial = entitiesToSync.length < Object.keys(SYNC_CONFIG).length;

      if (!isPartial) {
        toast.info('Starting full sync...');
      }

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
        toast.success(isPartial ? 'Data refreshed.' : 'All local data is up to date.');
      } else {
         toast.warning(`Sync completed with warnings. ${failures.length} tables failed.`);
      }

      // Smart Invalidation
      if (isPartial) {
        await queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey as unknown[];
            return entitiesToSync.some(table =>
              key.includes(table) ||
              (typeof key[0] === 'string' && key[0].includes(table))
            );
          }
        });
      } else {
        await queryClient.invalidateQueries({
          predicate: (query) => query.queryKey[0] !== 'data-sync-all'
        });
      }

      if (failures.length > 0) {
          console.error("Sync Failures:", failures);
      }

      return { lastSynced: new Date().toISOString() };

    } catch (err) {
      setSyncError(err as Error);
      toast.error("Sync process failed.");
      throw err;
    } finally {
      // 2. Minimum Spin Time to ensure user sees feedback
      const elapsed = Date.now() - startTime;
      const minDuration = 1000;
      if (elapsed < minDuration) {
          await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }
      setIsSyncing(false);
    }
  }, [supabase, queryClient, isOnline]);

  const { data: globalSyncState } = useQuery({
    queryKey: ['data-sync-all'],
    queryFn: () => ({ lastSynced: null }),
    enabled: false,
    staleTime: Infinity
  });

  return {
    isSyncing,
    syncError,
    syncStatus,
    sync: executeSync,
    lastGlobalSync: globalSyncState?.lastSynced
  };
}