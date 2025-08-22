import { useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase-types';
import { useTableQuery, useTableWithRelations } from './database/core-queries';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type OfcConnection = Database['public']['Tables']['ofc_connections']['Insert'] & {
  id?: string;
};

interface UseOfcConnectionProps {
  supabase: SupabaseClient<Database>;
  cableId: string;
}

export const useOfcConnection = ({ supabase, cableId }: UseOfcConnectionProps) => {
  const queryClient = useQueryClient();

  // Get cable details
  const { data: cable, isLoading: isLoadingCable } = useTableWithRelations<'ofc_cables'>(
    supabase,
    'ofc_cables',
    ["maintenance_area:maintenance_terminal_id(id, name)", "ofc_type:ofc_type_id(id, name)"],
    {
      filters: { id: cableId },
    }
  );
  
  // Get existing connections for this cable
  const { data: existingConnections = [], isLoading: isLoadingConnections, refetch: refetchConnections } = useTableQuery(
    supabase,
    'ofc_connections',
    {
      columns: 'connection_type,destination_id,destination_port,en_dom,en_power_dbm,fiber_no_en,fiber_no_sn,id,logical_path_id,ofc_id,otdr_distance_en_km,otdr_distance_sn_km,path_segment_order,remark,route_loss_db,sn_dom,sn_power_dbm,source_id,source_port,status,system_en_id,system_sn_id,updated_at',
      filters: { ofc_id: cableId },
    }
  );

  // Mutation for creating new connections
  const { mutateAsync: createConnections } = useMutation({
    mutationFn: async (newConnections: OfcConnection[]) => {
      const { data, error } = await supabase
        .from('ofc_connections')
        .insert(newConnections);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch the connections query after successful insertion
      queryClient.invalidateQueries({ queryKey: ['ofc_connections'] });
      refetchConnections();
    }
  });

  const createMissingConnections = useCallback(async (): Promise<void> => {
    if (!cable || !cable[0]) return;

    // Get fresh connection count to avoid stale data
    const { data: currentConnections, error } = await supabase
      .from('ofc_connections')
      .select('id')
      .eq('ofc_id', cableId);

    if (error) {
      console.error('Failed to fetch current connections:', error);
      throw error;
    }

    const currentConnectionCount = currentConnections?.length || 0;
    const cableCapacity = cable[0].capacity as number;
    const missingCount = cableCapacity - currentConnectionCount;
    
    console.log(`Cable capacity: ${cableCapacity}, Current connections: ${currentConnectionCount}, Missing: ${missingCount}`);
    
    if (missingCount <= 0) {
      console.log('No missing connections to create');
      return;
    }

    // Create an array of new connections to insert
    const newConnections = Array.from({ length: missingCount }, (_, index) => {
      const connection: OfcConnection = {
        ofc_id: cableId,
        fiber_no_sn: currentConnectionCount + index + 1,
        connection_type: 'straight',
        connection_category: 'OFC_JOINT_TYPES',
        status: true, // Set to true by default as per schema
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        // Set required fields with default values
        destination_id: null,
        destination_port: null,
        source_id: null,
        source_port: null,
        en_dom: null,
        en_power_dbm: null,
        fiber_no_en: null,
        logical_path_id: null,
        otdr_distance_en_km: null,
        otdr_distance_sn_km: null,
        path_segment_order: null,
        remark: null,
        route_loss_db: null,
        sn_dom: null,
        sn_power_dbm: null,
      };
      return connection;
    });

    try {
      console.log(`Creating ${newConnections.length} new connections`);
      await createConnections(newConnections);
    } catch (error) {
      console.error('Failed to create connections:', error);
      throw error;
    }
  }, [cable, cableId, createConnections, supabase]);

  const ensureConnectionsExist = useCallback(async (): Promise<void> => {
    if (isLoadingCable || isLoadingConnections) {
      console.log('Still loading data, skipping connection creation');
      return;
    }
    
    try {
      await createMissingConnections();
    } catch (error) {
      console.error('Error ensuring connections exist:', error);
      throw error;
    }
  }, [isLoadingCable, isLoadingConnections, createMissingConnections]);

  return {
    cable: cable?.[0],
    existingConnections,
    isLoading: isLoadingCable || isLoadingConnections,
    ensureConnectionsExist,
    createMissingConnections,
  };
};