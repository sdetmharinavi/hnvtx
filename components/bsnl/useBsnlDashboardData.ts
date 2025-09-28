"use client";

import { useMemo } from 'react';
import { useTableQuery, Filters } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { BsnlNode, BsnlCable, BsnlSystem, SearchFilters } from './types';

export function useBsnlDashboardData(filters: SearchFilters) {
  const supabase = createClient();

  const nodeFilters = useMemo(() => ({ status: true }), []);
  
  // CORRECTED: Create structured filters for server-side RPCs
  const systemFilters = useMemo(() => {
    const f: Filters = {};
    if (filters.query) {
      // Pass a structured object for the OR condition
      f.or = {
        system_name: filters.query,
        node_name: filters.query,
      };
    }
    return f;
  }, [filters.query]);

  const cableFilters = useMemo(() => {
    const f: Filters = {};
    if (filters.query) {
      // Pass a structured object for the OR condition
      f.or = {
        route_name: filters.query,
        asset_no: filters.query,
      };
    }
    return f;
  }, [filters.query]);

  const { data: nodesData, isLoading: isLoadingNodes, isError: isErrorNodes, error: errorNodes, refetch: refetchNodes } = 
    useTableQuery(supabase, 'v_nodes_complete', { filters: nodeFilters });
  
  const { data: cablesData, isLoading: isLoadingCables, isError: isErrorCables, error: errorCables, refetch: refetchCables } = 
    useTableQuery(supabase, 'v_ofc_cables_complete', { filters: cableFilters });
  
  const { data: systemsData, isLoading: isLoadingSystems, isError: isErrorSystems, error: errorSystems, refetch: refetchSystems } = 
    useTableQuery(supabase, 'v_systems_complete', { filters: systemFilters });

  const isLoading = isLoadingNodes || isLoadingCables || isLoadingSystems;
  const isError = isErrorNodes || isErrorCables || isErrorSystems;
  const error = errorNodes || errorCables || errorSystems;

  const data = useMemo(() => ({
    nodes: (nodesData as BsnlNode[]) || [],
    ofcCables: (cablesData as BsnlCable[]) || [],
    systems: (systemsData as BsnlSystem[]) || [],
  }), [nodesData, cablesData, systemsData]);
  
  const refetchAll = async () => {
    await Promise.all([
      refetchNodes(),
      refetchCables(),
      refetchSystems(),
    ]);
  };

  return { data, isLoading, isError, error, refetchAll };
}