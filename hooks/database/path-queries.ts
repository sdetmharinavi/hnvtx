"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useTableQuery } from "./core-queries";
import { useMemo } from "react";
import { Row } from "./queries-type-helpers";
import { FiberTraceNode } from "@/components/route-manager/types"; // Import the correct type
import { toast } from "sonner";

const supabase = createClient();

/**
 * Fetches the detailed, ordered path segments for a given logical path
 * by calling the secure RPC function.
 */
export function useSystemPath(logicalPathId: string | null) {
  return useQuery({
    queryKey: ['system-path-details', logicalPathId],
    queryFn: async () => {
      if (!logicalPathId) return [];
      const { data, error } = await supabase
        .rpc('get_system_path_details', {
          p_path_id: logicalPathId
        });
      if (error) throw error;
      return data;
    },
    enabled: !!logicalPathId,
  });
}

/**
 * Fetches available OFC cables that can be connected as the next segment in a path.
 */
export interface CableWithNodes {
  id: string;
  route_name: string;
  sn: { name: string } | null;
  en: { name: string } | null;
}

export function useAvailablePathSegments(
  sourceNodeId: string | null,
  pathSegments: Row<'v_system_ring_paths_detailed'>[] = []
) {
  const lastSegment = pathSegments?.[pathSegments.length - 1];

  const lastNodeId = useMemo(() => {
    if (!lastSegment) return sourceNodeId;
    return lastSegment.end_node_id;
  }, [lastSegment, sourceNodeId]);

  const existingCableIds = useMemo(() => pathSegments.map(p => p.ofc_cable_id).filter(Boolean), [pathSegments]);

  return useTableQuery<'ofc_cables', CableWithNodes[]>(supabase, 'ofc_cables', {
    columns: '*, sn:sn_id(name), en:en_id(name)',
    filters: {
      $or: `sn_id.eq.${lastNodeId},en_id.eq.${lastNodeId}`,
      ...(existingCableIds.length > 0 && { id: { operator: 'not.in', value: `(${existingCableIds.join(',')})` } }),
    },
    enabled: !!lastNodeId,
  });
}

/**
 * Fetches the list of continuously available fiber numbers for a given path.
 */
export function useAvailableFibers(pathId: string | null) {
  return useQuery({
    queryKey: ['available-fibers', pathId],
    queryFn: async () => {
      if (!pathId) return [];

      const { data, error } = await supabase.rpc('get_continuous_available_fibers', {
        p_path_id: pathId
      });

      if (error) throw error;
      return data || [];
    },
    enabled: !!pathId,
  });
}

/**
 * NEW: Hook to trace a fiber's complete path using the recursive RPC function.
 */
export function useFiberTrace(cableId: string | null, fiberNo: number | null) {
  return useQuery({
    queryKey: ['fiber-trace', cableId, fiberNo],
    queryFn: async (): Promise<FiberTraceNode | null> => {
      if (!cableId || !fiberNo) return null;

      const { data, error } = await supabase.rpc('trace_fiber_path', {
        p_start_cable_id: cableId,
        p_start_fiber_no: fiberNo
      });

      if (error) {
        toast.error(`Trace failed: ${error.message}`);
        throw error;
      }

      // The RPC returns a flat list; we need to build the tree structure.
      if (!data || data.length === 0) return null;

      const nodesMap = new Map<string, FiberTraceNode>();
      let rootNode: FiberTraceNode | null = null;

      // First pass: create all nodes
      data.forEach(item => {
        if (item.path_type === 'NODE' || item.path_type === 'JC') {
            const node: FiberTraceNode = {
                type: item.path_type as 'NODE' | 'JC',
                id: item.element_id,
                name: item.element_name,
                children: []
            };
            nodesMap.set(item.element_id, node);
            if (item.segment_order === 1) {
                rootNode = node;
            }
        }
      });

      // Second pass: link children
      let currentParent: FiberTraceNode | undefined;
      for (let i = 0; i < data.length; i++) {
        const item = data[i];

        if (item.path_type === 'NODE' || item.path_type === 'JC') {
            currentParent = nodesMap.get(item.element_id);
        } else if (item.path_type === 'CABLE' && currentParent) {
            const nextItem = data[i + 1];
            const downstreamNode = nextItem ? nodesMap.get(nextItem.element_id) : null;
            
            currentParent.children.push({
                cable: {
                    id: item.element_id,
                    name: item.element_name,
                    distance_km: item.distance_km,
                    is_otdr: false, // You can enhance the RPC to return this if needed
                    fiber_no: item.fiber_no,
                },
                downstreamNode: downstreamNode || null
            });
        }
      }
      
      return rootNode;
    },
    enabled: !!cableId && !!fiberNo,
  });
}