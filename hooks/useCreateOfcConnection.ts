import { useCallback, useMemo } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagedData} from './database';
import { Ofc_cablesRowSchema, Ofc_connectionsRowSchema } from '@/schemas/zod-schemas';


interface useCreateOfcConnectionProps {
  supabase: SupabaseClient<Database>;
  cableId: string;
  rawConnections: Ofc_connectionsRowSchema[];
  refetchOfcConnections: () => void;
  isLoadingOfcConnections: boolean;
}

export const useCreateOfcConnection = ({
  supabase,
  cableId,
  rawConnections,
  refetchOfcConnections,
  isLoadingOfcConnections,
}: useCreateOfcConnectionProps) => {
  const queryClient = useQueryClient();

  // Get OFC cable by Id
  const { data: cable, isLoading: isLoadingCable } = usePagedData<Ofc_cablesRowSchema>(
    supabase,
    'ofc_cables',
    {
      filters: { id: cableId },
      limit: 1,
      offset: 0,
    }
  );

  // Return the appropriate data based on sorting preference
  const existingConnections = useMemo(() => {
    const connections = rawConnections || [];
    return connections;
  }, [rawConnections]);

  // Mutation for creating new connections (unchanged)
  const { mutateAsync: createConnections } = useMutation({
    mutationFn: async (newConnections: Ofc_connectionsRowSchema[]) => {
      const { data, error } = await supabase
        .from('ofc_connections')
        .insert(newConnections);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // Invalidate and refetch the connections query after successful insertion
      queryClient.invalidateQueries({ queryKey: ['ofc_connections'] });
      refetchOfcConnections();
    },
  });

  // createMissingConnections (unchanged)
  const createMissingConnections = useCallback(async (): Promise<void> => {
    if (!cable || !cable.data || !cable.data[0]) return;

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
    const cableCapacity = cable.data[0].capacity;
    const missingCount = cableCapacity - currentConnectionCount;

    if (missingCount <= 0) {
      console.log('No missing connections to create');
      return;
    }



    // Create an array of new connections to insert
    const newConnections = Array.from({ length: missingCount }, (_, index) => {
      const connection: Partial<Ofc_connectionsRowSchema> = {
        connection_category: 'OFC_JOINT_TYPES', // Or a default value
        connection_type: 'straight', // Or a default value
        destination_port: null,
        en_dom: null,
        en_power_dbm: null,
        ofc_id: cableId,
        fiber_no_sn: currentConnectionCount + index + 1,
        fiber_no_en: currentConnectionCount + index + 1,
        fiber_role: 'working', // Or a default value
        logical_path_id: null,
        status: true,
        // --- All optional fields are explicitly set to null for clarity ---
        system_id: null, // <-- The only missing field, now added
        otdr_distance_en_km: null,
        otdr_distance_sn_km: null,
        path_segment_order: null,
        source_port: null,
        remark: null,
        route_loss_db: null,
        sn_dom: null,
        sn_power_dbm: null,
        // created_at and updated_at are best handled by the database itself
      };
      return connection;
    });

    try {
      console.log(`Creating ${newConnections.length} new connections`);
      await createConnections(newConnections as Ofc_connectionsRowSchema[]);
    } catch (error) {
      console.error('Failed to create connections:', error);
      throw error;
    }
  }, [cable, cableId, createConnections, supabase]);

  // ensureConnectionsExist (unchanged)
  const ensureConnectionsExist = useCallback(async (): Promise<void> => {
    if (isLoadingCable || isLoadingOfcConnections) {
      console.log('Still loading data, skipping connection creation');
      return;
    }

    try {
      await createMissingConnections();
    } catch (error) {
      console.error('Error ensuring connections exist:', error);
      throw error;
    }
  }, [isLoadingCable, isLoadingOfcConnections, createMissingConnections]);

  return {
    cable: cable?.data?.[0],
    existingConnections, // Now optionally client-sorted, but maintains same structure
    isLoadingOfc: isLoadingCable,
    ensureConnectionsExist,
    createMissingConnections,
  };
};
