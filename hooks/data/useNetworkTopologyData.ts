// hooks/useNetworkTopologyData.ts
import { useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { V_nodes_completeRowSchema, V_ofc_cables_completeRowSchema } from '@/schemas/zod-schemas';
import { useLocalFirstQuery } from '@/hooks/data/useLocalFirstQuery';
import { localDb } from '@/hooks/data/localDb';

const supabase = createClient();

export function useNetworkTopologyData(maintenanceAreaId: string | null) {
  
  // 1. Nodes Query Configuration
  const nodesOnlineFn = useCallback(async () => {
    let query = supabase.from('v_nodes_complete').select('*');
    if (maintenanceAreaId) {
      query = query.eq('maintenance_terminal_id', maintenanceAreaId);
    }
    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch nodes: ${error.message}`);
    return (data || []) as V_nodes_completeRowSchema[];
  }, [maintenanceAreaId]);

  const nodesLocalFn = useCallback(() => {
    if (maintenanceAreaId) {
      return localDb.v_nodes_complete
        .where('maintenance_terminal_id')
        .equals(maintenanceAreaId)
        .toArray();
    }
    return localDb.v_nodes_complete.toArray();
  }, [maintenanceAreaId]);

  const { 
    data: nodes = [], 
    isLoading: isLoadingNodes,
    isError: isNodesError,
    error: nodesError,
    refetch: refetchNodes
  } = useLocalFirstQuery<'v_nodes_complete'>({
    queryKey: ['topology-nodes', maintenanceAreaId],
    onlineQueryFn: nodesOnlineFn,
    localQueryFn: nodesLocalFn,
    dexieTable: localDb.v_nodes_complete,
    // Disable auto-sync to align with app-wide policy
    autoSync: false,
    localQueryDeps: [maintenanceAreaId]
  });

  // 2. Cables Query Configuration
  const cablesOnlineFn = useCallback(async () => {
    let query = supabase.from('v_ofc_cables_complete').select('*');
    if (maintenanceAreaId) {
      query = query.eq('maintenance_terminal_id', maintenanceAreaId);
    }
    const { data, error } = await query;
    if (error) throw new Error(`Failed to fetch cables: ${error.message}`);
    return (data || []) as V_ofc_cables_completeRowSchema[];
  }, [maintenanceAreaId]);

  const cablesLocalFn = useCallback(() => {
    if (maintenanceAreaId) {
      return localDb.v_ofc_cables_complete
        .where('maintenance_terminal_id')
        .equals(maintenanceAreaId)
        .toArray();
    }
    return localDb.v_ofc_cables_complete.toArray();
  }, [maintenanceAreaId]);

  const { 
    data: cables = [], 
    isLoading: isLoadingCables,
    isError: isCablesError,
    error: cablesError,
    refetch: refetchCables
  } = useLocalFirstQuery<'v_ofc_cables_complete'>({
    queryKey: ['topology-cables', maintenanceAreaId],
    onlineQueryFn: cablesOnlineFn,
    localQueryFn: cablesLocalFn,
    dexieTable: localDb.v_ofc_cables_complete,
    autoSync: false,
    localQueryDeps: [maintenanceAreaId]
  });

  // Combined Refresh Action
  const refetch = useCallback(() => {
    Promise.all([refetchNodes(), refetchCables()]);
  }, [refetchNodes, refetchCables]);

  return {
    nodes,
    cables,
    isLoading: isLoadingNodes || isLoadingCables,
    isError: isNodesError || isCablesError,
    error: nodesError || cablesError,
    refetch,
  };
}