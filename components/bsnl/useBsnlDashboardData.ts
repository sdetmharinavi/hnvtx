// path: components/bsnl/useBsnlDashboardData.ts
"use client";

import { BsnlSearchFilters } from '@/schemas/custom-schemas';
import { V_systems_completeRowSchema, V_nodes_completeRowSchema, V_ofc_cables_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

type BsnlSystem = V_systems_completeRowSchema;
type BsnlNode = V_nodes_completeRowSchema;
type BsnlCable = V_ofc_cables_completeRowSchema;

interface BsnlDashboardData {
  nodes: BsnlNode[];
  ofcCables: BsnlCable[];
  systems: BsnlSystem[];
}

export function useBsnlDashboardData(filters: BsnlSearchFilters) {
  const supabase = createClient();

  const queryParams = useMemo(() => ({
    p_query: filters.query || undefined,
    p_status: filters.status ? filters.status === 'active' : undefined,
    p_system_types: filters.type ? [filters.type] : undefined,
    p_cable_types: filters.type ? [filters.type] : undefined,
    p_regions: filters.region ? [filters.region] : undefined,
    p_node_types: filters.nodeType ? [filters.nodeType] : undefined,
  }), [filters]);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<BsnlDashboardData>({
    queryKey: ['bsnl-dashboard-data', queryParams],
    queryFn: async () => {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_bsnl_dashboard_data', queryParams);

      if (rpcError) {
        throw new Error(`Failed to fetch dashboard data: ${rpcError.message}`);
      }

      return rpcData as BsnlDashboardData;
    },
    staleTime: 60 * 60 * 1000,
    // THE FIX: Keep displaying the last successful fetch's data while new data is being fetched.
    // This provides a seamless UX by preventing the UI from showing a loading state on filter changes.
    placeholderData: (previousData) => previousData,
  });

  return {
    data: data ?? { nodes: [], ofcCables: [], systems: [] },
    isLoading,
    isError,
    error,
    refetchAll: refetch,
    isFetching
  };
}