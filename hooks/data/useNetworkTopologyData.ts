// hooks/data/useNetworkTopologyData.ts
import { useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { V_nodes_completeRowSchema, V_ofc_cables_completeRowSchema } from '@/schemas/zod-schemas';
import { useLocalFirstQuery } from '@/hooks/data/useLocalFirstQuery';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';

const supabase = createClient();

export function useNetworkTopologyData(maintenanceAreaId: string | null) {
  // 1. Nodes Query Configuration (RPC)
  const nodesOnlineFn = useCallback(async () => {
    const filters = maintenanceAreaId ? { maintenance_terminal_id: maintenanceAreaId } : {};

    // THE FIX: Use RPC 'get_paged_data' instead of direct select
    const { data, error } = await supabase.rpc('get_paged_data', {
      p_view_name: 'v_nodes_complete',
      p_limit: 10000,
      p_offset: 0,
      p_filters: buildRpcFilters(filters),
      p_order_by: 'name',
    });

    if (error) throw new Error(`Failed to fetch nodes: ${error.message}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as any)?.data || []) as V_nodes_completeRowSchema[];
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
    refetch: refetchNodes,
  } = useLocalFirstQuery<'v_nodes_complete'>({
    queryKey: ['topology-nodes', maintenanceAreaId],
    onlineQueryFn: nodesOnlineFn,
    localQueryFn: nodesLocalFn,
    dexieTable: localDb.v_nodes_complete,
    autoSync: false,
    localQueryDeps: [maintenanceAreaId],
  });

  // 2. Cables Query Configuration (RPC)
  const cablesOnlineFn = useCallback(async () => {
    const filters = maintenanceAreaId ? { maintenance_terminal_id: maintenanceAreaId } : {};

    // THE FIX: Use RPC 'get_paged_data'
    const { data, error } = await supabase.rpc('get_paged_data', {
      p_view_name: 'v_ofc_cables_complete',
      p_limit: 10000,
      p_offset: 0,
      p_filters: buildRpcFilters(filters),
      p_order_by: 'route_name',
    });

    if (error) throw new Error(`Failed to fetch cables: ${error.message}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as any)?.data || []) as V_ofc_cables_completeRowSchema[];
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
    refetch: refetchCables,
  } = useLocalFirstQuery<'v_ofc_cables_complete'>({
    queryKey: ['topology-cables', maintenanceAreaId],
    onlineQueryFn: cablesOnlineFn,
    localQueryFn: cablesLocalFn,
    dexieTable: localDb.v_ofc_cables_complete,
    autoSync: false,
    localQueryDeps: [maintenanceAreaId],
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
