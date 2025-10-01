"use client";

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { BsnlNode, BsnlCable, BsnlSystem, SearchFilters } from './types';

interface BsnlDashboardData {
  nodes: BsnlNode[];
  ofcCables: BsnlCable[];
  systems: BsnlSystem[];
}

export function useBsnlDashboardData(filters: SearchFilters) {
  const supabase = createClient();

  const queryParams = useMemo(() => ({
    p_query: filters.query || null,
    p_status: filters.status.length > 0 ? filters.status[0] === 'active' : null,
    p_system_types: filters.type.length > 0 ? filters.type : null,
    p_cable_types: filters.type.length > 0 ? filters.type : null,
    p_regions: filters.region.length > 0 ? filters.region : null,
    p_node_types: filters.nodeType.length > 0 ? filters.nodeType : null,
  }), [filters]);

  const { data, isLoading, isError, error, refetch } = useQuery<BsnlDashboardData>({
    queryKey: ['bsnl-dashboard-data', queryParams],
    queryFn: async () => {
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_bsnl_dashboard_data', queryParams);

      if (rpcError) {
        throw new Error(`Failed to fetch dashboard data: ${rpcError.message}`);
      }

      // The RPC returns a single JSON object with the keys we defined.
      return rpcData as BsnlDashboardData;
    },
    // Set a longer stale time for this heavy query
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return { 
    data: data ?? { nodes: [], ofcCables: [], systems: [] }, 
    isLoading, 
    isError, 
    error, 
    refetchAll: refetch 
  };
}