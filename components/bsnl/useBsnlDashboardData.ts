// components/bsnl/useBsnlDashboardData.ts
"use client";

import { useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { LatLngBounds } from 'leaflet';
import { BsnlSearchFilters } from '@/schemas/custom-schemas';
import { localDb } from '@/data/localDb';
import { BsnlNode, BsnlCable, BsnlSystem } from './types';

interface BsnlDashboardData {
  nodes: BsnlNode[];
  ofcCables: BsnlCable[];
  systems: BsnlSystem[];
}

export function useBsnlDashboardData(filters: BsnlSearchFilters, mapBounds: LatLngBounds | null) {
  // Use Dexie's live queries to get realtime data from IndexedDB
  const allNodes = useLiveQuery(() => localDb.v_nodes_complete.toArray(), []);
  const allCables = useLiveQuery(() => localDb.v_ofc_cables_complete.toArray(), []);
  const allSystems = useLiveQuery(() => localDb.v_systems_complete.toArray(), []);

  const isLoading = !allNodes || !allCables || !allSystems;

  // Perform all filtering on the client side
  const data = useMemo((): BsnlDashboardData => {
    if (isLoading) return { nodes: [], ofcCables: [], systems: [] };

    let visibleNodes = allNodes!;
    let visibleCables = allCables!;
    let visibleSystems = allSystems!;

    // Apply text query filter
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

    // Apply status filter
    if (filters.status) {
      const isActive = filters.status === 'active';
      visibleNodes = visibleNodes.filter(n => n.status === isActive);
      visibleCables = visibleCables.filter(c => c.status === isActive);
      visibleSystems = visibleSystems.filter(s => s.status === isActive);
    }
    
    // Apply structured filters
    if (filters.region) visibleNodes = visibleNodes.filter(n => n.maintenance_area_name === filters.region);
    if (filters.nodeType) visibleNodes = visibleNodes.filter(n => n.node_type_name === filters.nodeType);
    if (filters.type) {
      visibleCables = visibleCables.filter(c => c.ofc_type_name === filters.type);
      visibleSystems = visibleSystems.filter(s => s.system_type_name === filters.type);
    }

    // Apply map bounds filter
    if (mapBounds) {
      visibleNodes = visibleNodes.filter(n => 
        n.latitude && n.longitude &&
        n.latitude >= mapBounds.getSouth() && n.latitude <= mapBounds.getNorth() &&
        n.longitude >= mapBounds.getWest() && n.longitude <= mapBounds.getEast()
      );
    }

    // After filtering nodes, filter cables and systems to only those connected to visible nodes
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
    isError: false, // Errors are handled by the sync process, Dexie reads are not expected to fail
    error: null,
  };
}