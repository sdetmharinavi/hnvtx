// hooks/data/useDataSync.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { localDb, HNVTXDatabase, getTable } from '@/data/localDb';
import { PublicTableOrViewName } from '@/hooks/database';
import { useEffect } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';

const entitiesToSync: PublicTableOrViewName[] = [
  'v_nodes_complete',
  'v_ofc_cables_complete',
  'v_systems_complete',
  'v_rings',
  'v_employees',
  'v_maintenance_areas',
  'v_cable_utilization',
  'v_ring_nodes',
  'lookup_types',
  'employee_designations',
  'user_profiles',
];

// A set of our view names for a fast lookup
const viewNames = new Set<PublicTableOrViewName>([
    'v_nodes_complete',
    'v_ofc_cables_complete',
    'v_systems_complete',
    'v_rings',
    'v_employees',
    'v_maintenance_areas',
    'v_cable_utilization',
    'v_ring_nodes',
]);

export async function syncEntity(
  supabase: SupabaseClient,
  db: HNVTXDatabase,
  entityName: PublicTableOrViewName
) {
  try {
    await db.sync_status.put({ tableName: entityName, status: 'syncing', lastSynced: new Date().toISOString() });

    let data: any[] | null = null;

    // THE DEFINITIVE FIX: Use the correct data fetching strategy based on entity type.
    if (viewNames.has(entityName)) {
      // For VIEWS, use the RPC to bypass RLS issues.
      const { data: rpcResponse, error: rpcError } = await supabase.rpc('get_paged_data', {
        p_view_name: entityName,
        p_limit: 50000,
        p_offset: 0,
      });
      if (rpcError) throw rpcError;
      data = (rpcResponse as { data: any[] })?.data || [];
    } else {
      // For TABLES, use a direct select.
      const { data: tableData, error: tableError } = await supabase.from(entityName).select('*');
      if (tableError) throw tableError;
      data = tableData;
    }
    
    if (!data) {
        throw new Error("No data returned from the server.");
    }

    const validData = data.filter(item => item.id != null);
    
    const table = getTable(entityName);
    await table.bulkPut(validData);

    await db.sync_status.put({ tableName: entityName, status: 'success', lastSynced: new Date().toISOString() });
    console.log(`✅ [Sync] Successfully synced entity: ${entityName}`);

  } catch (err) {
    // IMPROVED ERROR LOGGING
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

  const { isLoading, isError, error, refetch } = useQuery({
    queryKey: ['data-sync-all'],
    queryFn: async () => {
      console.log('🚀 [Sync] Starting full data synchronization...');
      const results = await Promise.allSettled(
        entitiesToSync.map(entityName => syncEntity(supabase, localDb, entityName))
      );
      
      const failedEntities = results
        .map((result, index) => ({ result, name: entitiesToSync[index] }))
        .filter(item => item.result.status === 'rejected');

      if (failedEntities.length > 0) {
        // Construct a more detailed error message
        const errorDetails = failedEntities.map(item => `${item.name} (${(item.result as PromiseRejectedResult).reason.message})`).join(', ');
        throw new Error(`Failed to sync the following entities: ${errorDetails}`);
      }
      
      console.log('🎉 [Sync] Full data synchronization complete.');
      return { lastSynced: new Date().toISOString() };
    },
    staleTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });

  useEffect(() => {
    if (isLoading && !syncStatus?.some(s => s.status === 'syncing')) {
      toast.info("Starting data sync with server...", { id: 'sync-status' });
    } else if (!isLoading && !isError) {
      toast.success("Local data is up to date.", { id: 'sync-status' });
    } else if (isError) {
      toast.error(`Data sync failed: ${error.message}`, { id: 'sync-status', duration: 10000 });
    }
  }, [isLoading, isError, error, syncStatus]);

  return { isSyncing: isLoading, syncError: error, syncStatus, refetchSync: refetch };
}