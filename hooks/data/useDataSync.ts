// hooks/data/useDataSync.ts
import { useLiveQuery } from 'dexie-react-hooks';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { localDb, HNVTXDatabase } from '@/data/localDb';
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

// Function to perform the sync for a single table or view
export async function syncEntity(
  supabase: SupabaseClient,
  db: HNVTXDatabase,
  entityName: PublicTableOrViewName
) {
  try {
    await db.sync_status.put({ tableName: entityName, status: 'syncing', lastSynced: new Date().toISOString() });

    // THE DEFINITIVE FIX: Always use the 'get_paged_data' RPC.
    // This function runs with elevated privileges on the server, bypassing RLS issues for complex views.
    const { data: rpcResponse, error } = await supabase.rpc('get_paged_data', {
      p_view_name: entityName,
      p_limit: 50000, // Fetch all records for local caching
      p_offset: 0,
    });

    if (error) throw error;
    
    // The RPC returns a JSON object like { data: [...] }, so we extract the data array.
    const data = (rpcResponse as { data: any[] })?.data || [];

    await (db as any)[entityName].bulkPut(data);

    await db.sync_status.put({ tableName: entityName, status: 'success', lastSynced: new Date().toISOString() });
    console.log(`✅ [Sync] Successfully synced entity: ${entityName}`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error(`❌ [Sync] Error syncing entity ${entityName}:`, errorMessage);
    await db.sync_status.put({
      tableName: entityName,
      status: 'error',
      lastSynced: new Date().toISOString(),
      error: errorMessage,
    });
    throw error;
  }
}

/**
 * Custom hook to manage the data synchronization process between Supabase and IndexedDB.
 */
export function useDataSync() {
  const supabase = createClient();

  const syncStatus = useLiveQuery(() => localDb.sync_status.toArray(), []);

  const { isLoading, isError, error, refetch } = useQuery({
    queryKey: ['data-sync-all'],
    queryFn: async () => {
      console.log('🚀 [Sync] Starting full data synchronization...');
      const syncPromises = entitiesToSync.map(entityName => syncEntity(supabase, localDb, entityName));
      
      const results = await Promise.allSettled(syncPromises);

      const failedEntities = results
        .filter(result => result.status === 'rejected')
        .map((_, index) => entitiesToSync[index]);

      if (failedEntities.length > 0) {
        throw new Error(`Failed to sync the following entities: ${failedEntities.join(', ')}`);
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

  return {
    isSyncing: isLoading,
    syncError: error,
    syncStatus,
    refetchSync: refetch,
  };
}