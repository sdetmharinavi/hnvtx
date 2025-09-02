import { useCallback, useMemo } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagedOfcCablesComplete } from './database';
import { Row } from './database';

type OfcConnection = Row<'ofc_connections'>;
interface useCreateOfcConnectionProps {
  supabase: SupabaseClient<Database>;
  cableId: string;
  rawConnections: OfcConnection[];
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
  const { data: cable, isLoading: isLoadingCable } = usePagedOfcCablesComplete(
    supabase,
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
      refetchOfcConnections();
    },
  });

  // createMissingConnections (unchanged)
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

    if (missingCount <= 0) {
      console.log('No missing connections to create');
      return;
    }



    // Create an array of new connections to insert
    const newConnections = Array.from({ length: missingCount }, (_, index) => {
      const connection: Partial<OfcConnection> = {
        ofc_id: cableId,
        fiber_no_sn: currentConnectionCount + index + 1,
        fiber_no_en: currentConnectionCount + index + 1,
        connection_type: 'straight', // Or a default value
        connection_category: 'OFC_JOINT_TYPES', // Or a default value
        fiber_role: 'working', // Or a default value
        status: true,
        // --- All optional fields are explicitly set to null for clarity ---
        system_id: null, // <-- The only missing field, now added
        en_dom: null,
        en_power_dbm: null,
        logical_path_id: null,
        otdr_distance_en_km: null,
        otdr_distance_sn_km: null,
        path_segment_order: null,
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
      await createConnections(newConnections as OfcConnection[]);
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
    cable: cable?.[0],
    existingConnections, // Now optionally client-sorted, but maintains same structure
    isLoadingOfc: isLoadingCable,
    ensureConnectionsExist,
    createMissingConnections,
  };
};
