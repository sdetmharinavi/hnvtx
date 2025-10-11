"use client";

import { BsnlSearchFilters } from '@/schemas/custom-schemas';
import { V_systems_completeRowSchema, V_nodes_completeRowSchema, V_ofc_cables_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { LatLngBounds } from 'leaflet';

type BsnlSystem = V_systems_completeRowSchema;
type BsnlNode = V_nodes_completeRowSchema;
type BsnlCable = V_ofc_cables_completeRowSchema;

interface BsnlDashboardData {
  nodes: BsnlNode[];
  ofcCables: BsnlCable[];
  systems: BsnlSystem[];
}

export function useBsnlDashboardData(filters: BsnlSearchFilters, mapBounds: LatLngBounds | null) {
  const supabase = createClient();

  const queryParams = useMemo(() => ({
    p_query: filters.query || undefined,
    p_status: filters.status ? filters.status === 'active' : undefined,
    p_system_types: filters.type ? [filters.type] : undefined,
    p_cable_types: filters.type ? [filters.type] : undefined,
    p_regions: filters.region ? [filters.region] : undefined,
    p_node_types: filters.nodeType ? [filters.nodeType] : undefined,
    // THE FIX: Pass bounds as separate, correctly named numeric parameters
    p_min_lat: mapBounds?.getSouth(),
    p_max_lat: mapBounds?.getNorth(),
    p_min_lng: mapBounds?.getWest(),
    p_max_lng: mapBounds?.getEast(),
  }), [filters, mapBounds]);

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<BsnlDashboardData>({
    queryKey: ['bsnl-dashboard-data', queryParams],
    queryFn: async () => {
      if (!mapBounds) {
        return { nodes: [], ofcCables: [], systems: [] };
      }

      const { data: rpcData, error: rpcError } = await supabase.rpc('get_bsnl_dashboard_data', queryParams);

      if (rpcError) {
        throw new Error(`Failed to fetch dashboard data: ${rpcError.message}`);
      }

      return rpcData as BsnlDashboardData;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: (previousData) => previousData,
    enabled: !!mapBounds,
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