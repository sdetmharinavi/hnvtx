// path: hooks/database/path-queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { useRpcQuery } from "@/hooks/database/rpc-queries";
import { z } from 'zod';
import { fiberTraceSegmentSchema, FiberTraceSegment } from "@/schemas/custom-schemas";

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
 * The new RPC returns a pre-ordered, structured list, so no client-side tree building is needed.
 */
export function useFiberTrace(startSegmentId: string | null, fiberNo: number | null) {
  return useQuery({
    queryKey: ['fiber-trace', startSegmentId, fiberNo],
    queryFn: async (): Promise<FiberTraceSegment[]> => { // FIX: Return type is now non-nullable
      if (!startSegmentId || fiberNo === null) return []; // FIX: Return empty array instead of null

      const { data, error } = await supabase.rpc('trace_fiber_path', {
        p_start_segment_id: startSegmentId,
        p_start_fiber_no: fiberNo
      });

      if (error) {
        toast.error(`Trace failed: ${error.message}`);
        throw error;
      }

      if (!data || data.length === 0) {
        return []; // FIX: Return empty array for valid but empty traces
      }

      const parsed = z.array(fiberTraceSegmentSchema).safeParse(data);

      if (!parsed.success) {
        console.error("Zod validation error for Fiber Trace:", parsed.error);
        toast.error("Trace data from server was malformed.");
        throw new Error("Received invalid data structure for fiber trace.");
      }

      return parsed.data;
    },
    enabled: !!startSegmentId && fiberNo !== null,
  });
}