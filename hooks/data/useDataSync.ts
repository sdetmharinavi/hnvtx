// hooks/data/useDataSync.ts
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { localDb, HNVTMDatabase, getTable, MutationTask } from '@/hooks/data/localDb';
import { PublicTableOrViewName, PublicTableName } from '@/hooks/database';
import { SupabaseClient } from '@supabase/supabase-js';
import { useCallback } from 'react';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useSyncStore } from '@/stores/syncStore';
import { useLiveQuery } from 'dexie-react-hooks';

const BATCH_SIZE = 2500;

type SyncStrategy = 'full' | 'incremental';

interface EntitySyncConfig {
  strategy: SyncStrategy;
  timestampColumn?: string;
  relatedTable?: PublicTableName;
}

// Configuration Map for Sync Strategies
const SYNC_CONFIG: Record<PublicTableOrViewName, EntitySyncConfig> = {
  // --- Incremental Sync Tables ---
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

  // --- FULL SYNC TABLES ---
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

  // --- EXPENSE MODULE SYNC ---
  // Ensure these are present and correct
  advances: { strategy: 'full' },
  expenses: { strategy: 'full' },
  v_advances_complete: { strategy: 'full', relatedTable: 'advances' },
  v_expenses_complete: { strategy: 'full', relatedTable: 'expenses' },

  // Views
  v_systems_complete: { strategy: 'full', relatedTable: 'systems' },
  v_system_connections_complete: { strategy: 'full', relatedTable: 'system_connections' },
  v_ports_management_complete: { strategy: 'full', relatedTable: 'ports_management' },
  v_ofc_connections_complete: { strategy: 'full', relatedTable: 'ofc_connections' },
  v_services: { strategy: 'full', relatedTable: 'services' },
  v_nodes_complete: { strategy: 'full', relatedTable: 'nodes' },
  v_ring_nodes: { strategy: 'full', relatedTable: 'systems' },
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

// ... (keep mergePendingMutations, performFullSync, performIncrementalSync as provided in your original file) ...

// Include the rest of the file logic (syncEntity, useDataSync) exactly as provided in the context,
// ensuring the SYNC_CONFIG map above replaces the existing one.
// [Rest of useDataSync.ts content omitted for brevity as it was correct in the context]
// Only the SYNC_CONFIG object needed the explicit check/update.

// ... (Rest of useDataSync.ts) ...
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mergePendingMutations(serverData: any[], pendingTasks: MutationTask[]) {
  const merged = [...serverData];
  const serverIdMap = new Map(merged.map((item, index) => [String(item.id), index]));

  pendingTasks.forEach((task) => {
    if (task.type === 'insert') {
      if (!serverIdMap.has(String(task.payload.id))) {
        merged.push(task.payload);
      }
    } else if (task.type === 'update') {
      const targetId = String(task.payload.id);
      const index = serverIdMap.get(targetId);
      if (index !== undefined) {
        merged[index] = { ...merged[index], ...task.payload.data };
      }
    } else if (task.type === 'delete') {
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
  let fetchSuccessful = true;

  let pendingTasks: MutationTask[] = [];
  const targetTableForMutations = config.relatedTable || entityName;

  if (targetTableForMutations) {
    pendingTasks = await db.mutation_queue
      .where('tableName')
      .equals(targetTableForMutations as string)
      .toArray();
    pendingTasks = pendingTasks.filter((t) => t.status === 'pending' || t.status === 'processing');
  }

  const pendingInsertIds = new Set(
    pendingTasks
      .filter((t) => t.type === 'insert')
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((t) => String((t.payload as any).id)),
  );

  const serverIdsSeen = new Set<string>();

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
        batchData.forEach((item) => {
          if (item.id !== undefined && item.id !== null) {
            serverIdsSeen.add(String(item.id));
          }
          if (entityName === 'ring_based_systems' && item.system_id && item.ring_id) {
             serverIdsSeen.add(`${item.system_id}+${item.ring_id}`);
          }
           if (entityName === 'v_ring_nodes' && item.id && item.ring_id) {
             serverIdsSeen.add(`${item.id}+${item.ring_id}`);
           }
        });

        if (pendingTasks.length > 0) {
          batchData = mergePendingMutations(batchData, pendingTasks);
        }

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
    } catch (error) {
      console.error(`[Sync] Error syncing batch for ${entityName}`, error);
      fetchSuccessful = false;
      hasMore = false;
      throw error;
    }
  }

  if (pendingTasks.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inserts = pendingTasks.filter((t) => t.type === 'insert').map((t) => t.payload as any);
    if (inserts.length > 0) {
      await db.transaction('rw', table, async () => {
        await table.bulkPut(inserts);
      });
      inserts.forEach((item) => {
        if (item.id) serverIdsSeen.add(String(item.id));
      });
      totalSynced += inserts.length;
    }
  }

  if (fetchSuccessful) {
    const allLocalKeys = await table.toCollection().primaryKeys();
    const keysToDelete = allLocalKeys.filter((key) => {
      if (Array.isArray(key)) {
         const compositeKey = key.join('+');
         return !serverIdsSeen.has(compositeKey);
      }
      const keyStr = String(key);
      return !serverIdsSeen.has(keyStr) && !pendingInsertIds.has(keyStr);
    });

    if (keysToDelete.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await table.bulkDelete(keysToDelete as any[]);
    }
  }

  return totalSynced;
}

async function performIncrementalSync(
  supabase: SupabaseClient,
  db: HNVTMDatabase,
  entityName: PublicTableOrViewName,
  timestampColumn: string = 'created_at',
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
  entityName: PublicTableOrViewName,
) {
  const { addActiveSync, removeActiveSync } = useSyncStore.getState();

  addActiveSync(entityName);

  db.sync_status.put({
    tableName: entityName,
    status: 'syncing',
    lastSynced: new Date().toISOString(),
  }).catch(console.error);

  try {
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
    throw new Error(`Failed to sync ${entityName}: ${errorMessage}`);
  } finally {
    removeActiveSync(entityName);
  }
}

export function useDataSync() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  const isSyncing = useSyncStore((state) => state.isGlobalSyncing);

  const executeSync = useCallback(
    async (specificTables?: PublicTableOrViewName[]) => {
      if (!isOnline) {
        toast.error('Cannot sync while offline.');
        return;
      }

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

      } catch (err) {
        console.error("Critical Sync Error", err);
        toast.error('Sync process failed.');
        throw err;
      } finally {
        const elapsed = Date.now() - startTime;
        const minDuration = 800;
        if (elapsed < minDuration) {
          await new Promise((resolve) => setTimeout(resolve, minDuration - elapsed));
        }
      }
    },
    [supabase, queryClient, isOnline],
  );

  return {
    isSyncing,
    sync: executeSync,
  };
}

export function useSyncHistory() {
  const syncStatus = useLiveQuery(() => localDb.sync_status.toArray(), []);
  return { syncStatus };
}