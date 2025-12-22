// hooks/useCreateOfcConnection.ts
import { useCallback, useRef } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { usePagedData} from './database';
import { Ofc_cablesRowSchema, Ofc_connectionsInsertSchema } from '@/schemas/zod-schemas';
import { toast } from 'sonner';

interface useCreateOfcConnectionProps {
  supabase: SupabaseClient<Database>;
  cableId: string;
  refetchOfcConnections: () => void;
  isLoadingOfcConnections: boolean;
}

export const useCreateOfcConnection = ({
  supabase,
  cableId,
  refetchOfcConnections,
  isLoadingOfcConnections,
}: useCreateOfcConnectionProps) => {
  const queryClient = useQueryClient();
  const isCreatingConnections = useRef(false);

  const { data: cable, isLoading: isLoadingCable } = usePagedData<Ofc_cablesRowSchema>(
    supabase,
    'ofc_cables',
    {
      filters: { id: cableId },
      limit: 1,
      offset: 0,
    }
  );

  const { mutateAsync: createConnections } = useMutation({
    mutationFn: async (newConnections: Ofc_connectionsInsertSchema[]) => {
      const { data, error } = await supabase
        .from('ofc_connections')
        .insert(newConnections)
        .select();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['table', 'ofc_connections', { filters: { ofc_id: cableId } }] });
      refetchOfcConnections();
    },
  });
  
  const cableData = cable?.data?.[0];

  const createMissingConnections = useCallback(async (): Promise<void> => {
    if (isCreatingConnections.current) {
      console.log('Connection creation already in progress, skipping.');
      return;
    }
    
    if (!cableData || !cableData.capacity || cableData.capacity <= 0) {
        console.log('Skipping connection check: Cable data or capacity is missing.');
        return;
    }

    try {
      isCreatingConnections.current = true;

      const { data: existingConnections, error } = await supabase
        .from('ofc_connections')
        .select('fiber_no_sn', { count: 'exact' })
        .eq('ofc_id', cableId);

      if (error) {
        toast.error(`Failed to fetch existing connections: ${error.message}`);
        throw error;
      }

      // THE FIX: Robustly handle null response before mapping to prevent TypeError.
      const existingFiberNumbers = new Set(existingConnections?.map(c => c.fiber_no_sn) || []);
      
      const missingFiberNumbers: number[] = [];
      for (let i = 1; i <= cableData.capacity; i++) {
        if (!existingFiberNumbers.has(i)) {
          missingFiberNumbers.push(i);
        }
      }

      if (missingFiberNumbers.length === 0) {
        console.log('No missing connections to create.');
        return;
      }

      toast.info(`Found ${missingFiberNumbers.length} missing fiber connections. Re-creating them now...`);

      const newConnections: Ofc_connectionsInsertSchema[] = missingFiberNumbers.map(fiberNo => ({
        ofc_id: cableId,
        fiber_no_sn: fiberNo,
        fiber_no_en: fiberNo,
        updated_fiber_no_sn: fiberNo,
        updated_fiber_no_en: fiberNo,
        updated_sn_id: cableData.sn_id,
        updated_en_id: cableData.en_id,
        connection_category: 'SPLICE_TYPES',
        connection_type: 'straight',
        status: true,
      }));

      await createConnections(newConnections);
      toast.success(`Successfully created ${newConnections.length} missing connections.`);

    } catch (creationError) {
      // THE FIX: Log the actual error message, not the object.
      const errorMessage = creationError instanceof Error ? creationError.message : String(creationError);
      toast.error(`Failed to create missing connections: ${errorMessage}`);
      throw creationError;
    } finally {
      isCreatingConnections.current = false;
    }
  // THE FIX: Use stable primitive values as dependencies to prevent re-creation of the function.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cableData?.capacity, cableData?.sn_id, cableData?.en_id, cableId, createConnections, supabase]);

  const ensureConnectionsExist = useCallback(async (): Promise<void> => {
    if (isLoadingCable || isLoadingOfcConnections) {
      return;
    }
    try {
      await createMissingConnections();
    } catch (error) {
      // THE FIX: Log the specific error message for better debugging.
      console.error(`Failed to ensure connections exist:`, error instanceof Error ? error.message : error);
    }
  }, [isLoadingCable, isLoadingOfcConnections, createMissingConnections]);

  return {
    cable: cable?.data?.[0],
    isLoadingOfc: isLoadingCable,
    ensureConnectionsExist,
  };
};