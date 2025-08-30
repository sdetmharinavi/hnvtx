"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useTableQuery } from "./core-queries";
import { useMemo } from "react";
import { Row } from "./queries-type-helpers";

const supabase = createClient();

/**
 * Fetches the detailed, ordered path segments for a given logical path.
 * Uses the pre-built view for efficiency.
 */
export function useSystemPath(logicalPathId: string | null) {
  return useQuery({
    queryKey: ['system-path', logicalPathId],
    queryFn: async () => {
      if (!logicalPathId) return [];
      const { data, error } = await supabase
        .from('v_system_ring_paths_detailed')
        .select('*')
        .eq('logical_path_id', logicalPathId)
        .order('path_order', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: !!logicalPathId,
  });
}

/**
 * Fetches available OFC cables that can be connected as the next segment in a path.
 * This is the "smart" logic for the "Add Segment" modal.
 */
export function useAvailablePathSegments(sourceNodeId: string | null, pathSegments: Row<'v_system_ring_paths_detailed'>[] = []) {
  const lastSegment = pathSegments?.[pathSegments.length - 1];
  
  // Determine the last node in the current path
  const lastNodeId = useMemo(() => {
    if (!lastSegment) return sourceNodeId; // If no segments, start from the system's own node
    // The next connection must start from the end node of the last cable segment
    return lastSegment.end_node_id;
  }, [lastSegment, sourceNodeId]);

  // Get a list of cable IDs already used in the path to prevent adding them again
  const existingCableIds = useMemo(() => pathSegments.map(p => p.ofc_cable_id).filter(Boolean), [pathSegments]);

  return useTableQuery(supabase, 'ofc_cables', {
    columns: '*, sn:sn_id(name), en:en_id(name)',
    filters: {
      // Find cables where either the start or end node matches our last node
      or: `(sn_id.eq.${lastNodeId},en_id.eq.${lastNodeId})`,
      // Exclude cables already in the path
      ...(existingCableIds.length > 0 && { id: { operator: 'not.in', value: `(${existingCableIds.join(',')})` } }),
    },
    enabled: !!lastNodeId, // Only run this query if we have a node to start from
  });
}