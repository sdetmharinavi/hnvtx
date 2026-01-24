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

const BATCH_SIZE = 2500;

type SyncStrategy = 'full' | 'incremental';

interface EntitySyncConfig {
  strategy: SyncStrategy;
  timestampColumn?: string; // e.g., 'created_at' or 'updated_at'
  relatedTable?: PublicTableName; // Used to check mutation queue for views
}

// Configuration Map for Sync Strategies
const SYNC_CONFIG: Record<PublicTableOrViewName, EntitySyncConfig> = {
  // --- Incremental Sync Tables (True Append-Only / History) ---
  v_audit_logs: {
    strategy: 'incremental',
    timestampColumn: 'created_at',
    relatedTable: 'user_activity_logs',
  },
  user_activity_logs: { strategy: 'incremental', timestampColumn: 'created_at' },
  v_inventory_transactions_extended: {
    strategy: 'incremental',
    timestampColumn: 'created_at',
    relatedTable: 'inventory_transactions',
  },
  inventory_transactions: { strategy: 'incremental', timestampColumn: 'created_at' },
  v_file_movements_extended: {
    strategy: 'incremental',
    timestampColumn: 'created_at',
    relatedTable: 'file_movements',
  },
  file_movements: { strategy: 'incremental', timestampColumn: 'created_at' },

  // --- FULL SYNC TABLES (Operational Data) ---
  // We use full sync for these to ensure deletions propagate correctly via pruning
  systems: { strategy: 'full' },
  system_connections: { strategy: 'full' },
  ports_management: { strategy: 'full' },
  ofc_connections: { strategy: 'full' },
  services: { strategy: 'full' },
  nodes: { strategy: 'full' },
  rings: { strategy: 'full' },
  ofc_cables: { strategy: 'full' },
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
  technical_notes: { strategy: 'full' },

  // Views mapped to their underlying tables for mutation checking
  v_systems_complete: { strategy: 'full', relatedTable: 'systems' },
  v_system_connections_complete: { strategy: 'full', relatedTable: 'system_connections' },
  v_ports_management_complete: { strategy: 'full', relatedTable: 'ports_management' },
  v_ofc_connections_complete: { strategy: 'full', relatedTable: 'ofc_connections' },
  v_services: { strategy: 'full', relatedTable: 'services' },
  v_nodes_complete: { strategy: 'full', relatedTable: 'nodes' },
  v_ring_nodes: { strategy: 'full', relatedTable: 'systems' }, // Composite view, linking to systems is safest
  v_rings: { strategy: 'full', relatedTable: 'rings' },
  v_ofc_cables_complete: { strategy: 'full', relatedTable: 'ofc_cables' },
  v_cable_utilization: { strategy: 'full', relatedTable: 'ofc_cables' },
  v_end_to_end_paths: { strategy: 'full', relatedTable: 'logical_fiber_paths' },
  v_inventory_items: { strategy: 'full', relatedTable: 'inventory_items' },
  v_e_files_extended: { strategy: 'full', relatedTable: 'e_files' },
  v_employee_designations: { strategy: 'full', relatedTable: 'employee_designations' },
  v_junction_closures_complete: { strategy: 'full', relatedTable: 'junction_closures' },
  v_cable_segments_at_jc: { strategy: 'full', relatedTable: 'cable_segments' },
  v_maintenance_areas: { strategy: 'full', relatedTable: 'maintenance_areas' },
  v_lookup_types: { strategy: 'full', relatedTable: 'lookup_types' },
  v_user_profiles_extended: { strategy: 'full', relatedTable: 'user_profiles' },
  v_employees: { strategy: 'full', relatedTable: 'employees' },
  v_technical_notes: { strategy: 'full', relatedTable: 'technical_notes' },
};

// Helper: Merges local pending changes into the server dataset
// This prevents the "flash of old content" where server data overwrites a user's offline edit before the edit syncs up.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergePendingMutations(serverData: any[], pendingTasks: MutationTask[]) {
  const merged = [...serverData];
  // Map for O(1) lookup
  const serverIdMap = new Map(merged.map((item, index) => [String(item.id), index]));

  pendingTasks.forEach((task) => {
    if (task.type === 'insert') {
      // For inserts, add them if they don't collide with server IDs (which they shouldn't usually, as temp IDs are UUIDs)
      if (!serverIdMap.has(String(task.payload.id))) {
        merged.push(task.payload);
      }
    } else if (task.type === 'update') {
      // For updates, apply local changes on top of server data
      const targetId = String(task.payload.id);
      const index = serverIdMap.get(targetId);
      if (index !== undefined) {
        merged[index] = { ...merged[index], ...task.payload.data };
      }
    } else if (task.type === 'delete') {
      // For deletes, remove the item from the incoming server list
      // This handles the race condition where server sends data, but user just deleted it locally
      const idsToDelete = new Set((task.payload.ids || []).map(String));
      for (let i = merged.length - 1; i >= 0; i--) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (idsToDelete.has(String((merged[i] as any).id))) {
          merged.splice(i, 1);
        }
      }
    }
  });
  return merged;
}

// ** STREAMING SYNC IMPLEMENTATION **
async function performFullSync(
  supabase: SupabaseClient,
  db: HNVTMDatabase,
  entityName: PublicTableOrViewName,
  config: EntitySyncConfig,
) {
  const table = getTable(entityName);
  let offset = 0;
  let hasMore = true;
  let totalSynced = 0;
  let fetchSuccessful = true; // Track sync integrity

  // 1. Fetch pending local mutations from the Queue
  // We look at the 'relatedTable' (e.g. 'systems' for 'v_systems_complete') to find edits
  let pendingTasks: MutationTask[] = [];
  const targetTableForMutations = config.relatedTable || entityName;

  // Only check queue if the target is a valid table name (not a view without mapping)
  if (targetTableForMutations) {
    pendingTasks = await db.mutation_queue
      .where('tableName')
      .equals(targetTableForMutations as string)
      .toArray();
    // Only care about tasks not yet successfully synced
    pendingTasks = pendingTasks.filter((t) => t.status === 'pending' || t.status === 'processing');
  }

  // Identify pending INSERT IDs.
  // We must NOT delete these during the pruning phase, even if the server doesn't have them yet.
  const pendingInsertIds = new Set(
    pendingTasks
      .filter((t) => t.type === 'insert')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((t) => String((t.payload as any).id)),
  );

  // Track all IDs seen from the server to identify what needs deletion (Pruning)
  const serverIdsSeen = new Set<string>();

  // 2. Fetch & Upsert Loop (Streaming)
  while (hasMore) {
    try {
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
        // A. Track IDs from server
        batchData.forEach((item) => {
          if (item.id !== undefined && item.id !== null) {
            serverIdsSeen.add(String(item.id));
          }
        });

        // B. Merge local edits onto server data
        if (pendingTasks.length > 0) {
          batchData = mergePendingMutations(batchData, pendingTasks);
        }

        // C. UPSERT to Local DB
        await db.transaction('rw', table, async () => {
          await table.bulkPut(batchData);
        });

        totalSynced += batchData.length;
      }

      // Pagination check
      if (validDataCount < BATCH_SIZE) {
        hasMore = false;
      } else {
        offset += BATCH_SIZE;
      }
    } catch (error) {
      console.error(`[Sync] Error syncing batch for ${entityName}`, error);
      fetchSuccessful = false; // Mark sync as tainted
      hasMore = false; // Stop loop
      throw error; // Propagate error to update status in DB
    }
  }

  // 3. Handle Local Creations (Pending Inserts)
  // If we created a new item locally, it won't be in the server response yet.
  // We must ensure it exists in the table view.
  if (pendingTasks.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inserts = pendingTasks.filter((t) => t.type === 'insert').map((t) => t.payload as any);
    if (inserts.length > 0) {
      await db.transaction('rw', table, async () => {
        await table.bulkPut(inserts);
      });
      // Add these to "Seen" so we don't prune them
      inserts.forEach((item) => {
        if (item.id) serverIdsSeen.add(String(item.id));
      });
      totalSynced += inserts.length;
    }
  }

  // 4. Prune Stale Data (The "Sweep" Phase)
  // Only prune if the fetch loop completed successfully without errors.
  // This prevents deleting local data if the server connection drops midway.
  // Also, only prune if the table uses 'id' as primary key (most do).
  if (fetchSuccessful && table.schema.primKey.name === 'id') {
    // Get all keys currently in local DB
    const allLocalKeys = await table.toCollection().primaryKeys();

    // Find keys present locally but NOT on server AND NOT pending insert
    const keysToDelete = allLocalKeys.filter((key) => {
      const keyStr = String(key);
      // Keep it if it's in the server list OR if it's a pending creation
      return !serverIdsSeen.has(keyStr) && !pendingInsertIds.has(keyStr);
    });

    if (keysToDelete.length > 0) {
      // console.log(`[Sync] Pruning ${keysToDelete.length} stale records from ${entityName}`);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await table.bulkDelete(keysToDelete as any[]);
    }
  } else if (!fetchSuccessful) {
    console.warn(`[Sync] Skipping prune for ${entityName} due to fetch errors.`);
  }

  return totalSynced;
}

// Incremental sync logic
// Used for log tables where records are append-only and rarely deleted/modified
async function performIncrementalSync(
  supabase: SupabaseClient,
  db: HNVTMDatabase,
  entityName: PublicTableOrViewName,
  timestampColumn: string = 'created_at',
) {
  const table = getTable(entityName);

  // Find the most recent record locally
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

      // Update timestamp for next batch/loop check
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
  entityName: PublicTableOrViewName,
) {
  try {
    await db.sync_status.put({
      tableName: entityName,
      status: 'syncing',
      lastSynced: new Date().toISOString(),
    });

    let count = 0;
    const config = SYNC_CONFIG[entityName];
    // Default to full sync if not configured
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
    // Propagate error
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

  const executeSync = useCallback(
    async (specificTables?: PublicTableOrViewName[]) => {
      // 1. Online Check
      if (!isOnline) {
        toast.error('Cannot sync while offline.');
        return;
      }

      setIsSyncing(true);
      setSyncError(null);
      const startTime = Date.now();

      try {
        const failures: string[] = [];
        const entitiesToSync =
          specificTables && specificTables.length > 0
            ? specificTables
            : (Object.keys(SYNC_CONFIG) as PublicTableOrViewName[]);

        const isPartial = entitiesToSync.length < Object.keys(SYNC_CONFIG).length;

        if (!isPartial) {
          toast.info('Starting full sync...');
        }

        // Process sequentially to control concurrency
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
              return entitiesToSync.some(
                (table) =>
                  key.includes(table) || (typeof key[0] === 'string' && key[0].includes(table)),
              );
            },
          });
        } else {
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
        // Minimum Spin Time for UI feedback
        const elapsed = Date.now() - startTime;
        const minDuration = 800;
        if (elapsed < minDuration) {
          await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
        }
        setIsSyncing(false);
      }
    },
    [supabase, queryClient, isOnline],
  );

  const { data: globalSyncState } = useQuery({
    queryKey: ['data-sync-all'],
    queryFn: () => ({ lastSynced: null }),
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
