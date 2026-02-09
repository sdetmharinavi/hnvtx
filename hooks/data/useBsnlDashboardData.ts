// hooks/data/useBsnlDashboardData.ts
'use client';

import { useMemo, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { LatLngBounds } from 'leaflet';
import { BsnlSearchFilters } from '@/schemas/custom-schemas';
import { localDb } from '@/hooks/data/localDb';
import { BsnlNode, BsnlCable, BsnlSystem } from '@/components/bsnl/types';
import { ExtendedOfcCable, LinkedCable } from '@/schemas/custom-schemas';
import { useDataSync } from '@/hooks/data/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { Json } from '@/types/supabase-types';

interface BsnlDashboardData {
  nodes: BsnlNode[];
  ofcCables: ExtendedOfcCable[];
  systems: BsnlSystem[];
}

interface FilterOptions {
  typeOptions: string[];
  regionOptions: string[];
  nodeTypeOptions: string[];
}

// Helper to check if a value matches a filter (string or array of strings)
const matchesFilter = (
  value: string | null | undefined,
  filter: string | string[] | undefined
) => {
  if (!filter || filter.length === 0) return true; // No filter applied
  if (!value) return false; // Filter exists but value is missing

  if (Array.isArray(filter)) {
    return filter.includes(value);
  }
  return value === filter;
};

// Helper to transform cable data to match ExtendedOfcCable type
const transformCableData = (cables: any[]): ExtendedOfcCable[] => {
  return cables.map(item => {
    const linkedCables = item.linked_cables;
    // Parse JSON if it's a string, otherwise use as-is
    let parsedLinkedCables: LinkedCable[] | null = null;
    
    if (linkedCables) {
      if (typeof linkedCables === 'string') {
        try {
          parsedLinkedCables = JSON.parse(linkedCables);
        } catch (e) {
          console.warn('Failed to parse linked_cables JSON:', linkedCables);
          parsedLinkedCables = null;
        }
      } else if (Array.isArray(linkedCables)) {
        parsedLinkedCables = linkedCables;
      }
    }
    
    return {
      ...item,
      linked_cables: parsedLinkedCables as Json
    };
  });
};

export function useBsnlDashboardData(
  filters: BsnlSearchFilters,
  mapBounds: LatLngBounds | null
) {
  const { sync, isSyncing } = useDataSync();
  const isOnline = useOnlineStatus();

  // Ref to prevent double-triggering sync in strict mode
  const hasAttemptedAutoSync = useRef(false);

  // Fetch data from local Dexie DB
  const allNodes = useLiveQuery(() => localDb.v_nodes_complete.toArray(), [], undefined);
  const allCables = useLiveQuery(
    () => localDb.v_ofc_cables_complete.toArray(),
    [],
    undefined
  );
  const allSystems = useLiveQuery(
    () => localDb.v_systems_complete.toArray(),
    [],
    undefined
  );

  // Determine actual loading state (Dexie initial load)
  const isLocalLoading =
    allNodes === undefined || allCables === undefined || allSystems === undefined;

  // --- AUTO-HYDRATION LOGIC ---
  useEffect(() => {
    if (isOnline && !isLocalLoading && !hasAttemptedAutoSync.current) {
      hasAttemptedAutoSync.current = true;

      const checkAndSync = async () => {
        const nodeCount = allNodes?.length || 0;
        const cableCount = allCables?.length || 0;
        const systemCount = allSystems?.length || 0;

        const isDbEmpty = nodeCount === 0 && cableCount === 0 && systemCount === 0;

        if (isDbEmpty) {
          console.log('[Dashboard] Local DB is empty. Triggering initial sync...');
          try {
            await sync([
              'v_nodes_complete',
              'v_ofc_cables_complete',
              'v_systems_complete',
              'v_cable_utilization',
              'lookup_types',
            ]);
          } catch (error) {
            console.error('Auto-sync failed', error);
          }
        }
      };

      checkAndSync();
    }
  }, [isOnline, isLocalLoading, allNodes, allCables, allSystems, sync]);

  // --- DERIVE FILTER OPTIONS (UNFILTERED) ---
  // This ensures dropdowns show all possibilities, regardless of current selection
  const globalOptions = useMemo((): FilterOptions => {
    if (isLocalLoading)
      return { typeOptions: [], regionOptions: [], nodeTypeOptions: [] };

    const nodes = allNodes || [];
    const cables = allCables || [];
    const systems = allSystems || [];

    const systemTypes = new Set(
      systems.map((s) => s.system_type_name).filter(Boolean) as string[]
    );
    const cableTypes = new Set(
      cables.map((c) => c.ofc_type_name).filter(Boolean) as string[]
    );
    const uniqueTypes = Array.from(new Set([...systemTypes, ...cableTypes])).sort();

    const uniqueRegions = Array.from(
      new Set(
        nodes.map((n) => n.maintenance_area_name).filter(Boolean) as string[]
      )
    ).sort();

    const uniqueNodeTypes = Array.from(
      new Set(nodes.map((n) => n.node_type_name).filter(Boolean) as string[])
    ).sort();

    return {
      typeOptions: uniqueTypes,
      regionOptions: uniqueRegions,
      nodeTypeOptions: uniqueNodeTypes,
    };
  }, [allNodes, allCables, allSystems, isLocalLoading]);

  const data = useMemo((): BsnlDashboardData => {
    if (isLocalLoading) return { nodes: [], ofcCables: [], systems: [] };

    let visibleNodes = allNodes || [];
    let visibleCables = allCables || [];
    let visibleSystems = allSystems || [];

    // --- 1. SEARCH FILTER ---
    if (filters.query) {
      const lowerQuery = filters.query.toLowerCase();
      const nodeIds = new Set<string>();
      const cableIds = new Set<string>();
      const systemIds = new Set<string>();

      visibleNodes.forEach((n) => {
        if (
          n.name?.toLowerCase().includes(lowerQuery) ||
          n.remark?.toLowerCase().includes(lowerQuery)
        )
          if (n.id) nodeIds.add(n.id);
      });
      visibleCables.forEach((c) => {
        if (
          c.route_name?.toLowerCase().includes(lowerQuery) ||
          c.asset_no?.toLowerCase().includes(lowerQuery)
        )
          if (c.id) cableIds.add(c.id);
      });
      visibleSystems.forEach((s) => {
        if (
          s.system_name?.toLowerCase().includes(lowerQuery) ||
          (
            s.ip_address &&
            s.ip_address.split('/')[0].toString().toLowerCase().includes(lowerQuery)
          )
        )
          if (s.id) systemIds.add(s.id);
      });

      visibleNodes = visibleNodes.filter((n) => n.id && nodeIds.has(n.id));
      visibleCables = visibleCables.filter((c) => c.id && cableIds.has(c.id));
      visibleSystems = visibleSystems.filter((s) => s.id && systemIds.has(s.id));
    }

    // --- 2. STATUS FILTER ---
    if (filters.status) {
      const isActive = filters.status === 'active';
      visibleNodes = visibleNodes.filter((n) => n.status === isActive);
      visibleCables = visibleCables.filter((c) => c.status === isActive);
      visibleSystems = visibleSystems.filter((s) => s.status === isActive);
    }

    // --- 3. ATTRIBUTE FILTERS ---
    // Region
    if (filters.region && filters.region.length > 0) {
      visibleNodes = visibleNodes.filter((n) =>
        matchesFilter(n.maintenance_area_name, filters.region)
      );
    }

    // Node Type
    if (filters.nodeType && filters.nodeType.length > 0) {
      visibleNodes = visibleNodes.filter((n) =>
        matchesFilter(n.node_type_name, filters.nodeType)
      );
    }

    // Type (System & Cable)
    if (filters.type && filters.type.length > 0) {
      visibleCables = visibleCables.filter((c) =>
        matchesFilter(c.ofc_type_name, filters.type)
      );
      visibleSystems = visibleSystems.filter((s) =>
        matchesFilter(s.system_type_name, filters.type)
      );
    }

    // --- 4. GEOGRAPHIC BOUNDS FILTER ---
    if (mapBounds) {
      const bufferedBounds = mapBounds.pad(0.5);
      visibleNodes = visibleNodes.filter(
        (n) =>
          n.latitude &&
          n.longitude &&
          bufferedBounds.contains([n.latitude, n.longitude])
      );
    }

    // --- 5. RELATIONAL INTEGRITY ---
    // Enforce relationship consistency based on node visibility
    if (
      mapBounds ||
      (filters.region && filters.region.length > 0) ||
      (filters.nodeType && filters.nodeType.length > 0) ||
      filters.query
    ) {
      const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

      visibleCables = visibleCables.filter(
        (c) =>
          (c.sn_id && visibleNodeIds.has(c.sn_id)) ||
          (c.en_id && visibleNodeIds.has(c.en_id))
      );

      visibleSystems = visibleSystems.filter(
        (s) => s.node_id && visibleNodeIds.has(s.node_id)
      );
    }

    return {
      nodes: visibleNodes,
      ofcCables: transformCableData(visibleCables),
      systems: visibleSystems,
    };
  }, [allNodes, allCables, allSystems, filters, mapBounds, isLocalLoading]);

  return {
    data,
    globalOptions,
    isLoading:
      isLocalLoading || (isSyncing && hasAttemptedAutoSync.current && !allNodes?.length),
    isError: false,
    error: null,
  };
}