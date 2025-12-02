// hooks/data/useDataSync.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { localDb, HNVTMDatabase, getTable } from '@/hooks/data/localDb';
import { PublicTableOrViewName } from '@/hooks/database';
import { SupabaseClient } from '@supabase/supabase-js';

const BATCH_SIZE = 2500; // Fetch in chunks to prevent timeouts

const entitiesToSync: PublicTableOrViewName[] = [
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
  'v_services',
];

export async function syncEntity(
  supabase: SupabaseClient,
  db: HNVTMDatabase,
  entityName: PublicTableOrViewName
) {
  try {
    await db.sync_status.put({ tableName: entityName, status: 'syncing', lastSynced: new Date().toISOString() });

    const table = getTable(entityName);
    let offset = 0;
    let hasMore = true;
    
    // CHANGED: Fetch ALL data into memory first to prevent partial state
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allFetchedData: any[] = [];

    while (hasMore) {
        // Fetch data in chunks using the RPC
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

        // Check if we reached the end
        if (responseData.length < BATCH_SIZE) {
            hasMore = false;
        } else {
            offset += BATCH_SIZE;
        }
    }

    // CHANGED: Safe transactional update
    // Only clear and put if we successfully fetched everything
    await db.transaction('rw', table, async () => {
        await table.clear();
        if (allFetchedData.length > 0) {
            await table.bulkPut(allFetchedData);
        }
    });

    await db.sync_status.put({ tableName: entityName, status: 'success', lastSynced: new Date().toISOString() });

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

  const { isLoading, error, refetch } = useQuery({
    queryKey: ['data-sync-all'],
    queryFn: async () => {
      // Use toast.promise to show progress/success/error UI
      return toast.promise(
        async () => {
          const failures: string[] = [];
          
          for (const entity of entitiesToSync) {
            try {
                await syncEntity(supabase, localDb, entity);
            } catch (e) {
                failures.push(`${entity} (${(e as Error).message})`);
            }
          }
    
          if (failures.length > 0) {
            throw new Error(`Failed entities: ${failures.join(', ')}`);
          }
          
          if (typeof window !== 'undefined') {
            localStorage.setItem('query_cache_buster', `v-${Date.now()}`);
          }
          
          await queryClient.invalidateQueries({
            predicate: (query) => query.queryKey[0] !== 'data-sync-all'
          });
          
          return { lastSynced: new Date().toISOString() };
        },
        {
          loading: 'Syncing data with server...',
          success: 'Local data is up to date.',
          error: (err: Error) => `Data sync failed: ${err.message}`,
        }
      );
    },
    staleTime: Infinity,          
    gcTime: 1000 * 60 * 60 * 24,  
    refetchOnMount: false,        
    refetchOnWindowFocus: false,  
    refetchOnReconnect: false,    
    retry: false,                 
  });

  return { 
    isSyncing: isLoading, 
    syncError: error, 
    syncStatus, 
    sync: refetch 
  };
}