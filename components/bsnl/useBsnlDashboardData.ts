// path: components/bsnl/useBsnlDashboardData.ts
"use client";

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { LatLngBounds } from 'leaflet';
import { BsnlSearchFilters } from '@/schemas/custom-schemas';
import { localDb } from '@/hooks/data/localDb';
import { BsnlNode, BsnlCable, BsnlSystem } from './types';

interface BsnlDashboardData {
  nodes: BsnlNode[];
  ofcCables: BsnlCable[];
  systems: BsnlSystem[];
}

export function useBsnlDashboardData(filters: BsnlSearchFilters, mapBounds: LatLngBounds | null) {
  const allNodes = useLiveQuery(() => localDb.v_nodes_complete.toArray(), []);
  const allCables = useLiveQuery(() => localDb.v_ofc_cables_complete.toArray(), []);
  const allSystems = useLiveQuery(() => localDb.v_systems_complete.toArray(), []);

  const isLoading = !allNodes || !allCables || !allSystems;

  const data = useMemo((): BsnlDashboardData => {
    if (isLoading) return { nodes: [], ofcCables: [], systems: [] };

    let visibleNodes = allNodes!;
    let visibleCables = allCables!;
    let visibleSystems = allSystems!;

    if (filters.query) {
      const lowerQuery = filters.query.toLowerCase();
      const nodeIds = new Set<string>();
      const cableIds = new Set<string>();
      const systemIds = new Set<string>();

      allNodes!.forEach(n => { if (n.name?.toLowerCase().includes(lowerQuery) || n.remark?.toLowerCase().includes(lowerQuery)) nodeIds.add(n.id!); });
      allCables!.forEach(c => { if (c.route_name?.toLowerCase().includes(lowerQuery) || c.asset_no?.toLowerCase().includes(lowerQuery)) cableIds.add(c.id!); });
      allSystems!.forEach(s => { if (s.system_name?.toLowerCase().includes(lowerQuery) || s.ip_address?.toString().toLowerCase().includes(lowerQuery)) systemIds.add(s.id!); });

      visibleNodes = allNodes!.filter(n => nodeIds.has(n.id!));
      visibleCables = allCables!.filter(c => cableIds.has(c.id!));
      visibleSystems = allSystems!.filter(s => systemIds.has(s.id!));
    }

    if (filters.status) {
      const isActive = filters.status === 'active';
      visibleNodes = visibleNodes.filter(n => n.status === isActive);
      visibleCables = visibleCables.filter(c => c.status === isActive);
      visibleSystems = visibleSystems.filter(s => s.status === isActive);
    }
    
    if (filters.region) visibleNodes = visibleNodes.filter(n => n.maintenance_area_name === filters.region);
    if (filters.nodeType) visibleNodes = visibleNodes.filter(n => n.node_type_name === filters.nodeType);
    if (filters.type) {
      visibleCables = visibleCables.filter(c => c.ofc_type_name === filters.type);
      visibleSystems = visibleSystems.filter(s => s.system_type_name === filters.type);
    }

    // THE FIX: Instead of filtering strictly by mapBounds, create a larger "buffered" bounds.
    if (mapBounds) {
      // Expand the bounds by 50% to fetch a wider area of data.
      const bufferedBounds = mapBounds.pad(0.5); 
      visibleNodes = visibleNodes.filter(n => 
        n.latitude && n.longitude &&
        bufferedBounds.contains([n.latitude, n.longitude])
      );
    }

    const visibleNodeIds = new Set(visibleNodes.map(n => n.id));
    visibleCables = visibleCables.filter(c => visibleNodeIds.has(c.sn_id!) || visibleNodeIds.has(c.en_id!));
    visibleSystems = visibleSystems.filter(s => visibleNodeIds.has(s.node_id!));
    
    return {
      nodes: visibleNodes,
      ofcCables: visibleCables,
      systems: visibleSystems,
    };
  }, [allNodes, allCables, allSystems, filters, mapBounds, isLoading]);
  
  return {
    data,
    isLoading,
    isError: false,
    error: null,
  };
}