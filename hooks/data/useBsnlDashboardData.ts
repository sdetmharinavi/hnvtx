// path: hooks/data/useBsnlDashboardData.ts
'use client';

import { useMemo, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { LatLngBounds } from 'leaflet';
import { BsnlSearchFilters } from '@/schemas/custom-schemas';
import { localDb } from '@/hooks/data/localDb';
import { BsnlNode, BsnlCable, BsnlSystem } from '@/components/bsnl/types';
import { useDataSync } from '@/hooks/data/useDataSync';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

interface BsnlDashboardData {
  nodes: BsnlNode[];
  ofcCables: BsnlCable[];
  systems: BsnlSystem[];
}

export function useBsnlDashboardData(filters: BsnlSearchFilters, mapBounds: LatLngBounds | null) {
  const { sync, isSyncing } = useDataSync();
  const isOnline = useOnlineStatus();

  // Ref to prevent double-triggering sync in strict mode
  const hasAttemptedAutoSync = useRef(false);

  // Fetch data from local Dexie DB
  // THE FIX: Use 'undefined' as default to distinguish "loading" from "empty"
  const allNodes = useLiveQuery(() => localDb.v_nodes_complete.toArray(), [], undefined);
  const allCables = useLiveQuery(() => localDb.v_ofc_cables_complete.toArray(), [], undefined);
  const allSystems = useLiveQuery(() => localDb.v_systems_complete.toArray(), [], undefined);

  // Determine actual loading state (Dexie initial load)
  // If any are undefined, we are still reading from IndexDB
  const isLocalLoading =
    allNodes === undefined || allCables === undefined || allSystems === undefined;

  // --- AUTO-HYDRATION LOGIC ---
  useEffect(() => {
    // Only run if we are online, not currently loading local data, and haven't tried yet
    if (isOnline && !isLocalLoading && !hasAttemptedAutoSync.current) {
      // THE FIX: Set the ref IMMEDIATELY to prevent double-firing in Strict Mode
      hasAttemptedAutoSync.current = true;

      const checkAndSync = async () => {
        // Check counts to see if we have an empty DB
        // We check all 3 main entities to be safe
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
              'v_cable_utilization', // Needed for stats
              'lookup_types', // Needed for filters
            ]);
            // toast is handled by useDataSync
          } catch (error) {
            console.error('Auto-sync failed', error);
            // Optional: toast.error("Failed to load initial data.");
          }
        } else {
          // Data exists, we don't need to do anything.
          // console.log("[Dashboard] Local data found. Skipping initial sync.");
        }
      };

      checkAndSync();
    }
  }, [isOnline, isLocalLoading, allNodes, allCables, allSystems, sync]);

  const data = useMemo((): BsnlDashboardData => {
    // Return empty if still loading local data
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
          (s.ip_address && s.ip_address.split('/')[0].toString().toLowerCase().includes(lowerQuery))
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
    if (filters.region)
      visibleNodes = visibleNodes.filter((n) => n.maintenance_area_name === filters.region);

    if (filters.nodeType)
      visibleNodes = visibleNodes.filter((n) => n.node_type_name === filters.nodeType);

    if (filters.type) {
      // "Type" applies to both Cables and Systems in the dashboard search bar
      visibleCables = visibleCables.filter((c) => c.ofc_type_name === filters.type);
      visibleSystems = visibleSystems.filter((s) => s.system_type_name === filters.type);
    }

    // --- 4. GEOGRAPHIC BOUNDS FILTER ---
    // Expanded bounds buffer (50%) to ensure smooth panning
    if (mapBounds) {
      const bufferedBounds = mapBounds.pad(0.5);
      visibleNodes = visibleNodes.filter(
        (n) => n.latitude && n.longitude && bufferedBounds.contains([n.latitude, n.longitude]),
      );
    }

    // --- 5. RELATIONAL INTEGRITY ---
    // Only show cables/systems connected to the visible nodes (if bounds or region filter is active)
    // This creates a "What you see is what you get" experience on the map
    if (mapBounds || filters.region || filters.nodeType || filters.query) {
      const visibleNodeIds = new Set(visibleNodes.map((n) => n.id));

      visibleCables = visibleCables.filter(
        (c) => (c.sn_id && visibleNodeIds.has(c.sn_id)) || (c.en_id && visibleNodeIds.has(c.en_id)),
      );

      visibleSystems = visibleSystems.filter((s) => s.node_id && visibleNodeIds.has(s.node_id));
    }

    return {
      nodes: visibleNodes,
      ofcCables: visibleCables,
      systems: visibleSystems,
    };
  }, [allNodes, allCables, allSystems, filters, mapBounds, isLocalLoading]);

  return {
    data,
    // It is loading if Dexie is reading OR if we triggered an auto-sync and it's running
    // We check hasAttemptedAutoSync to show spinner only during the initial hydration sync,
    // not during manual background refreshes later.
    isLoading: isLocalLoading || (isSyncing && hasAttemptedAutoSync.current && !allNodes?.length),
    isError: false,
    error: null,
  };
}
