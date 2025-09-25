// path: hooks/database/path-queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { FiberTraceSegment, FiberTraceNode } from "@/components/route-manager/types";
import { toast } from "sonner";
import { useRpcQuery } from "./rpc-queries";
import { buildTraceTree } from "@/components/ofc-details/trace-helper";

const supabase = createClient();

/**
 * Fetches the detailed, ordered path segments for a given logical path.
 */
export function useSystemPath(logicalPathId: string | null) {
  return useRpcQuery(
    supabase,
    'get_system_path_details',
    { p_path_id: logicalPathId },
    { enabled: !!logicalPathId }
  );
}

/**
 * Fetches the list of continuously available fiber numbers for a given path.
 */
export function useAvailableFibers(pathId: string | null) {
  return useRpcQuery(
    supabase,
    'get_continuous_available_fibers',
    { p_path_id: pathId },
    { enabled: !!pathId }
  );
}

/**
 * Hook to trace a fiber's complete path using the recursive RPC function.
 * This now transforms the flat data into a nested tree structure.
 * FIX: Updated to use the correct RPC parameter names (p_start_segment_id).
 */
export function useFiberTrace(startSegmentId: string | null, fiberNo: number | null) {
  return useQuery({
    queryKey: ['fiber-trace', startSegmentId, fiberNo],
    queryFn: async (): Promise<FiberTraceNode | null> => {
      if (!startSegmentId || fiberNo === null) return null;

      const { data, error } = await supabase.rpc('trace_fiber_path', {
        // FIX: The parameter names now match the corrected SQL function signature.
        p_start_segment_id: startSegmentId,
        p_start_fiber_no: fiberNo
      });

      if (error) {
        toast.error(`Trace failed: ${error.message}`);
        throw error;
      }

      return buildTraceTree(data as FiberTraceSegment[] || []);
    },
    enabled: !!startSegmentId && fiberNo !== null,
  });
}