"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { useTableQuery } from "./core-queries";
import { useMemo } from "react";
import { Row } from "./queries-type-helpers";

const supabase = createClient();

/**
 * Fetches the detailed, ordered path segments for a given logical path
 * by calling the secure RPC function.
 */
export function useSystemPath(logicalPathId: string | null) {
  return useQuery({
    queryKey: ['system-path-details', logicalPathId], // Use a distinct query key
    queryFn: async () => {
      if (!logicalPathId) return [];
      
      // *** THE FIX IS HERE: Call the RPC function ***
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
 * This hook remains unchanged and is correct.
 */
export interface CableWithNodes {
  id: string;
  route_name: string;
  sn: { name: string } | null;
  en: { name: string } | null;
  sn_id: string | null;
  en_id: string | null;
  asset_no: string | null;
  capacity: number;
  commissioned_on: string | null;
  created_at: string | null;
  current_rkm: number | null;
  maintenance_terminal_id: string | null;
  name: string;
  status: string | null;
  system_id: string;
  updated_at: string | null;
}

export function useAvailablePathSegments(
  sourceNodeId: string | null, 
  pathSegments: Row<'v_system_ring_paths_detailed'>[] = []
) {
  // ... (this hook's code remains the same as the last correct version)
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
  // Add a console log here to see what ID the hook is receiving.
  console.log(`[useAvailableFibers] Hook called with pathId: ${pathId}`);
  return useQuery({
    queryKey: ['available-fibers', pathId],
    queryFn: async () => {
      console.log(`[useAvailableFibers] Executing queryFn for pathId: ${pathId}`);
      if (!pathId) {
        console.log("[useAvailableFibers] No pathId, returning empty array.");
        return [];
      }
      
      const { data, error } = await supabase.rpc('get_continuous_available_fibers', {
        p_path_id: pathId
      });

      if (error) {
        console.error("[useAvailableFibers] RPC Error:", error);
        throw error;
      }
      
      console.log(`[useAvailableFibers] RPC Success for pathId: ${pathId}, Data received:`, data);
      return data || [];
    },
    enabled: !!pathId,
  });
}