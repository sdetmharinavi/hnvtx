// hooks/data/useNetworkTopologyData.ts
import { useCallback } from 'react';
import { createClient } from '@/utils/supabase/client';
import { V_nodes_completeRowSchema, V_ofc_cables_completeRowSchema } from '@/schemas/zod-schemas';
import { buildRpcFilters } from '@/hooks/database';
import { useQuery } from '@tanstack/react-query';

const supabase = createClient();

export function useNetworkTopologyData(maintenanceAreaId: string | null) {
  
  // 1. Nodes Query
  const {
    data: nodes = [],
    isLoading: isLoadingNodes,
    isError: isNodesError,
    error: nodesError,
    refetch: refetchNodes,
  } = useQuery({
    queryKey: ['topology-nodes', maintenanceAreaId],
    queryFn: async () => {
      const filters = maintenanceAreaId ? { maintenance_terminal_id: maintenanceAreaId } : {};
      
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
    },
    staleTime: 5 * 60 * 1000
  });

  // 2. Cables Query
  const {
    data: cables = [],
    isLoading: isLoadingCables,
    isError: isCablesError,
    error: cablesError,
    refetch: refetchCables,
  } = useQuery({
    queryKey: ['topology-cables', maintenanceAreaId],
    queryFn: async () => {
      const filters = maintenanceAreaId ? { maintenance_terminal_id: maintenanceAreaId } : {};

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
    },
    staleTime: 5 * 60 * 1000
  });

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