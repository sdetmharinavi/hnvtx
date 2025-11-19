// hooks/data/useDataSync.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { localDb, HNVTMDatabase, getTable } from '@/hooks/data/localDb';
import { PublicTableOrViewName } from '@/hooks/database';
import { SupabaseClient } from '@supabase/supabase-js';

// THE FIX: Added essential base tables `rings`, `nodes`, `systems`, and `ring_based_systems`
// This ensures that all data required to construct views locally is available.
const entitiesToSync: PublicTableOrViewName[] = [
  'lookup_types',
  'employee_designations',
  'user_profiles',
  'diary_notes',
  'inventory_items',
  'rings', // <-- ADDED
  'nodes', // <-- ADDED
  'systems', // <-- ADDED
  'ring_based_systems', // <-- ADDED
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
];

export async function syncEntity(
  supabase: SupabaseClient,
  db: HNVTMDatabase,
  entityName: PublicTableOrViewName
) {
  try {
    await db.sync_status.put({ tableName: entityName, status: 'syncing', lastSynced: new Date().toISOString() });

    const { data: rpcResponse, error: rpcError } = await supabase.rpc('get_paged_data', {
      p_view_name: entityName,
      p_limit: 50000,
      p_offset: 0,
      p_filters: {}, 
    });

    if (rpcError) throw rpcError;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (rpcResponse as { data: any[] })?.data || [];
    
    const validData = data.filter(item => item.id != null);
    
    const table = getTable(entityName);

    await db.transaction('rw', table, async () => {
      await table.clear();
      await table.bulkPut(validData);
    });

    await db.sync_status.put({ tableName: entityName, status: 'success', lastSynced: new Date().toISOString() });

  } catch (err) {
    const errorMessage = err && typeof err === 'object' && 'message' in err ? String(err.message) : 'Unknown error';
    console.error(`❌ [Sync] Error syncing entity ${entityName}:`, errorMessage, JSON.stringify(err, null, 2));
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

  const { isLoading, error, refetch } = useQuery({
    queryKey: ['data-sync-all'],
    queryFn: () => 
      toast.promise(
        async () => {
          const results = await Promise.allSettled(
            entitiesToSync.map(entityName => syncEntity(supabase, localDb, entityName))
          );
          
          const failedEntities = results
            .map((result, index) => ({ result, name: entitiesToSync[index] }))
            .filter(item => item.result.status === 'rejected');
    
          if (failedEntities.length > 0) {
            const errorDetails = failedEntities.map(item => `${item.name} (${(item.result as PromiseRejectedResult).reason.message})`).join(', ');
            throw new Error(`Failed to sync the following entities: ${errorDetails}`);
          }
          return { lastSynced: new Date().toISOString() };
        },
        {
          loading: 'Syncing data with server...',
          success: 'Local data is up to date.',
          error: (err: Error) => `Data sync failed: ${err.message}`,
        }
      ),
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  return { 
    isSyncing: isLoading, 
    syncError: error, 
    syncStatus, 
    sync: refetch 
  };
}