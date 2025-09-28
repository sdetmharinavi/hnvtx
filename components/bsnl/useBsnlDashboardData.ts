"use client";

import { useMemo } from 'react';
import { useTableQuery, Filters } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { BsnlNode, BsnlCable, BsnlSystem, SearchFilters } from './types';

export function useBsnlDashboardData(filters: SearchFilters) {
  const supabase = createClient();

  const nodeFilters = useMemo(() => {
    const f: Filters = { status: true };
    // CORRECTED: Check if filters.nodeType exists before accessing .length
    if (filters.nodeType && filters.nodeType.length > 0) {
      f.node_type_name = { operator: 'in', value: filters.nodeType };
    }
    return f;
  }, [filters.nodeType]);
  
  const systemFilters = useMemo(() => {
    const f: Filters = {};
    if (filters.query) { f.or = { system_name: filters.query, node_name: filters.query }; }
    if (filters.status && filters.status.length > 0) { f.status = filters.status[0] === 'active'; }
    if (filters.type && filters.type.length > 0) { f.system_type_name = { operator: 'in', value: filters.type }; }
    if (filters.region && filters.region.length > 0) { f.system_maintenance_terminal_name = { operator: 'in', value: filters.region }; }
    if (filters.nodeType && filters.nodeType.length > 0) { f.node_type_name = { operator: 'in', value: filters.nodeType }; }
    return f;
  }, [filters]);

  const cableFilters = useMemo(() => {
    const f: Filters = {};
    if (filters.query) { f.or = { route_name: filters.query, asset_no: filters.query }; }
    if (filters.status && filters.status.length > 0) { f.status = filters.status[0] === 'active'; }
    if (filters.type && filters.type.length > 0) { f.ofc_type_name = { operator: 'in', value: filters.type }; }
    if (filters.region && filters.region.length > 0) { f.maintenance_area_name = { operator: 'in', value: filters.region }; }
    if (filters.nodeType && filters.nodeType.length > 0) {
      const types = filters.nodeType.map(n => `'${n}'`).join(',');
      f.or = `(sn_node_type_name.in.(${types}),en_node_type_name.in.(${types}))`;
    }
    return f;
  }, [filters]);

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