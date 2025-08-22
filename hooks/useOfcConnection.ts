import { useCallback } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase-types';
import { useTableQuery, useTableWithRelations } from './database/core-queries';
import { useMutation } from '@tanstack/react-query';

type OfcConnection = Database['public']['Tables']['ofc_connections']['Insert'] & {
  id?: string;
};

interface UseOfcConnectionProps {
  supabase: SupabaseClient<Database>;
  cableId: string;
}

export const useOfcConnection = ({ supabase, cableId }: UseOfcConnectionProps) => {
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
  const { data: existingConnections = [], isLoading: isLoadingConnections } = useTableQuery(
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
    }
  });

  const createMissingConnections = useCallback(async (): Promise<void> => {
    if (!cable) return;

    const missingCount = (cable[0].capacity as number) - (existingConnections?.length || 0);
    
    if (missingCount <= 0) return;

    // Create an array of new connections to insert
    const newConnections = Array.from({ length: missingCount }, (_, index) => {
      const connection: OfcConnection = {
        ofc_id: cableId,
        fiber_no_sn: existingConnections.length + index + 1,
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
      await createConnections(newConnections);
    } catch (error) {
      console.error('Failed to create connections:', error);
      throw error;
    }
  }, [cable, existingConnections, cableId, createConnections]);

  const ensureConnectionsExist = useCallback(async (): Promise<void> => {
    if (isLoadingCable || isLoadingConnections) return;
    
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