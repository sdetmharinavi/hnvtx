// hooks/data/useBsnlDashboardData.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { BsnlSearchFilters, ExtendedOfcCable, LinkedCable } from '@/schemas/custom-schemas';
import { BsnlNode, BsnlSystem } from '@/components/bsnl/types';
import { Row } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';

type OfcCableRow = Row<'v_ofc_cables_complete'>;

interface BsnlDashboardData {
  nodes: BsnlNode[];
  ofcCables: ExtendedOfcCable[];
  ofcCablesTable: OfcCableRow[];
  systems: BsnlSystem[];
}

interface FilterOptions {
  typeOptions: string[];
  regionOptions: string[];
  nodeTypeOptions: string[];
}

function normalizeLinkedCables(value: unknown): LinkedCable[] | null | undefined {
  if (value == null) return value as null | undefined;
  if (Array.isArray(value)) return value as LinkedCable[];
  return null;
}

function normalizeDashboardData(input: unknown): BsnlDashboardData {
  const raw = input as {
    nodes?: BsnlNode[];
    ofcCables?: Array<Partial<OfcCableRow> & { linked_cables?: unknown }>;
    systems?: BsnlSystem[];
  };

  const ofcCableDefaults: OfcCableRow = {
    asset_no: null,
    capacity: null,
    commissioned_on: null,
    created_at: null,
    current_rkm: null,
    en_id: null,
    en_name: null,
    en_node_type_name: null,
    id: null,
    last_activity_at: null,
    linked_cables: null,
    maintenance_area_code: null,
    maintenance_area_name: null,
    maintenance_terminal_id: null,
    ofc_owner_code: null,
    ofc_owner_id: null,
    ofc_owner_name: null,
    ofc_type_code: null,
    ofc_type_id: null,
    ofc_type_name: null,
    remark: null,
    route_name: null,
    sn_id: null,
    sn_name: null,
    sn_node_type_name: null,
    status: null,
    transnet_id: null,
    transnet_rkm: null,
    updated_at: null,
  };

  const ofcCablesTable: OfcCableRow[] = (raw.ofcCables ?? []).map(
    (c) => Object.assign({}, ofcCableDefaults, c) as OfcCableRow,
  );

  const ofcCables: ExtendedOfcCable[] = (raw.ofcCables ?? []).map(
    (c) =>
      Object.assign({}, c, {
        linked_cables: normalizeLinkedCables(c.linked_cables),
      }) as ExtendedOfcCable,
  );

  return {
    nodes: raw.nodes ?? [],
    systems: raw.systems ?? [],
    ofcCables,
    ofcCablesTable,
  };
}

export function useBsnlDashboardData(filters: BsnlSearchFilters) {
  const supabase = createClient();

  // --- QUERY 1: Fetch Global Filter Options (Cached) ---
  const { data: globalOptions = { typeOptions: [], regionOptions: [], nodeTypeOptions: [] } } =
    useQuery<FilterOptions>({
      queryKey: ['bsnl-global-options'],
      queryFn: async () => {
        const { data, error } = await supabase.rpc('get_bsnl_dashboard_data', {
          p_query: null,
          p_status: null,
          p_system_types: null,
          p_cable_types: null,
          p_regions: null,
          p_node_types: null,
          p_min_lat: null,
          p_max_lat: null,
          p_min_lng: null,
          p_max_lng: null,
        });
        if (error) throw error;

        const allData = normalizeDashboardData(data);
        const systemTypes = new Set(
          allData.systems.map((s) => s.system_type_name).filter(Boolean) as string[],
        );
        const cableTypes = new Set(
          allData.ofcCablesTable.map((c) => c.ofc_type_name).filter(Boolean) as string[],
        );
        const uniqueTypes = Array.from(new Set([...systemTypes, ...cableTypes])).sort();
        const uniqueRegions = Array.from(
          new Set(allData.nodes.map((n) => n.maintenance_area_name).filter(Boolean) as string[]),
        ).sort();
        const uniqueNodeTypes = Array.from(
          new Set(allData.nodes.map((n) => n.node_type_name).filter(Boolean) as string[]),
        ).sort();

        return {
          typeOptions: uniqueTypes,
          regionOptions: uniqueRegions,
          nodeTypeOptions: uniqueNodeTypes,
        };
      },
      staleTime: 1000 * 60 * 60, // Cache for 1 hour
    });

  // --- QUERY 2: Fetch Filtered Data for Display ---
  const { data, isLoading, isError, error } = useQuery<BsnlDashboardData>({
    // THE FIX: Removed mapBounds from the cache key so panning doesn't trigger refetches
    queryKey: ['bsnl-dashboard-data', filters],
    queryFn: async () => {
      // Prepare filters for the RPC call
      const status =
        filters.status === 'active' ? true : filters.status === 'inactive' ? false : undefined;

      const { data, error } = await supabase.rpc('get_bsnl_dashboard_data', {
        p_query: filters.query || null,
        p_status: status,
        p_system_types: Array.isArray(filters.type)
          ? filters.type
          : filters.type
            ? [filters.type]
            : null,
        p_cable_types: Array.isArray(filters.type)
          ? filters.type
          : filters.type
            ? [filters.type]
            : null,
        p_regions: Array.isArray(filters.region)
          ? filters.region
          : filters.region
            ? [filters.region]
            : null,
        p_node_types: Array.isArray(filters.nodeType)
          ? filters.nodeType
          : filters.nodeType
            ? [filters.nodeType]
            : null,
        // THE FIX: Hardcode coordinates to null to always fetch the full dataset matching the filter
        p_min_lat: null,
        p_max_lat: null,
        p_min_lng: null,
        p_max_lng: null,
      });

      if (error) throw new Error(error.message);

      return normalizeDashboardData(data);
    },
    placeholderData: (previousData) => previousData, // Keep old data visible while refetching
  });

  return {
    data: data ?? { nodes: [], ofcCables: [], ofcCablesTable: [], systems: [] },
    globalOptions,
    isLoading,
    isError,
    error,
  };
}
