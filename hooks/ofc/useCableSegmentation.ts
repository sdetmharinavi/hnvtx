import { createClient } from '@/utils/supabase/client';
import { useCallback, useState } from 'react';
import { toast } from 'sonner';

export interface JunctionClosure {
  id: string;
  node_id: string;
  name: string;
  ofc_cable_id: string;
  position_km: number;
  created_at: string;
  updated_at: string;
}

export interface CableSegment {
  id: string;
  original_cable_id: string;
  segment_order: number;
  start_node_id: string;
  end_node_id: string;
  start_node_type: 'node' | 'jc';
  end_node_type: 'node' | 'jc';
  distance_km: number;
  fiber_count: number;
  created_at: string;
  updated_at: string;
}

export interface SpliceConfiguration {
  incoming_fiber_no: number;
  outgoing_fiber_no: number;
  splice_type: 'straight' | 'cross';
}

export const useCableSegmentation = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const addJunctionClosure = useCallback(async (
    cableId: string,
    positionKm: number,
    name: string
  ): Promise<JunctionClosure | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: insertError } = await supabase
        .rpc('add_junction_closure', {
          p_ofc_cable_id: cableId,
          p_position_km: positionKm,
          p_name: name
        });

      if (insertError) {
        throw insertError;
      }

      toast.success('Junction Closure added successfully');
      return data as JunctionClosure;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(`Failed to add Junction Closure: ${errorMessage}`);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const createCableSegments = useCallback(async (
    jcId: string,
    cableId: string
  ): Promise<CableSegment[]> => {
    console.log('=== CREATE CABLE SEGMENTS FUNCTION CALLED ===');
    console.log('Input parameters:', { jcId, cableId });
    setIsLoading(true);
    setError(null);

    console.log('=== CREATE CABLE SEGMENTS DEBUG ===');
    console.log('Calling create_cable_segments_on_jc_add with:', { p_jc_id: jcId, p_ofc_cable_id: cableId });

    try {
      const { data, error: segmentError } = await supabase
        .rpc('create_cable_segments_on_jc_add', {
          p_jc_id: jcId,
          p_ofc_cable_id: cableId
        });

      console.log('Function result:', { data, segmentError });

      if (segmentError) {
        console.error('Database function error:', segmentError);
        throw segmentError;
      }

      toast.success('Cable segments created successfully');
      return data as CableSegment[];
    } catch (err: unknown) {
      console.error('Error in createCableSegments:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Error details:', errorMessage, (err instanceof Error && 'details' in err) ? err.details : undefined, (err instanceof Error && 'hint' in err) ? err.hint : undefined, (err instanceof Error && 'code' in err) ? err.code : undefined);
      setError(errorMessage);
      toast.error(`Failed to create cable segments: ${errorMessage}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const createInitialFiberConnections = useCallback(async (
    segmentId: string
  ): Promise<number> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: connectionError } = await supabase
        .rpc('create_initial_fiber_connections', {
          p_segment_id: segmentId
        });

      if (connectionError) {
        throw connectionError;
      }

      toast.success('Fiber connections created successfully');
      return data as number;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(`Failed to create fiber connections: ${errorMessage}`);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const updateFiberConnections = useCallback(async (
    jcId: string,
    incomingSegmentId: string,
    outgoingSegmentId: string,
    spliceConfig: SpliceConfiguration[]
  ): Promise<number> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: updateError } = await supabase
        .rpc('update_fiber_connections_on_splice', {
          p_jc_id: jcId,
          p_incoming_segment_id: incomingSegmentId,
          p_outgoing_segment_id: outgoingSegmentId,
          p_splice_config: spliceConfig
        });

      if (updateError) {
        throw updateError;
      }

      toast.success('Fiber connections updated successfully');
      return data as number;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(`Failed to update fiber connections: ${errorMessage}`);
      return 0;
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  const getFiberPath = useCallback(async (
    startNodeId: string,
    endNodeId: string,
    fiberNumber: number
  ) => {
    setIsLoading(true);
    setError(null);

    try {
      const { data, error: pathError } = await supabase
        .rpc('get_fiber_path', {
          p_start_node_id: startNodeId,
          p_end_node_id: endNodeId,
          p_fiber_number: fiberNumber
        });

      if (pathError) {
        throw pathError;
      }

      return data;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      toast.error(`Failed to get fiber path: ${errorMessage}`);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [supabase]);

  return {
    isLoading,
    error,
    addJunctionClosure,
    createCableSegments,
    createInitialFiberConnections,
    updateFiberConnections,
    getFiberPath,
  };
};
