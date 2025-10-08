"use client";

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { BsnlNode, BsnlCable, BsnlSystem } from './types';
import { BsnlSearchFilters } from '@/schemas/custom-schemas';

interface BsnlDashboardData {
  nodes: BsnlNode[];
  ofcCables: BsnlCable[];
  systems: BsnlSystem[];
}

export function useBsnlDashboardData(filters: BsnlSearchFilters) {
  const supabase = createClient();

  const queryParams = useMemo(() => ({
    p_query: filters.query || null,
    p_status: filters.status ? filters.status === 'active' : null,
    p_system_types: filters.type ? [filters.type] : null,
    p_cable_types: filters.type ? [filters.type] : null, // Assuming system and cable types are filtered by the same 'type' field
    p_regions: filters.region ? [filters.region] : null,
    p_node_types: filters.nodeType ? [filters.nodeType] : null,
    // p_priority is in the schema but not in the RPC, it can be added here if the RPC is updated
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
    staleTime: 5 * 60 * 1000,
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