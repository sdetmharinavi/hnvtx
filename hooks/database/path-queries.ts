// path: hooks/database/path-queries.ts
"use client";

import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { FiberTrace, FiberTraceNode } from "@/components/route-manager/types"; // Import updated types
import { toast } from "sonner";
import { useRpcQuery } from "./rpc-queries"; // Use our generic RPC hook

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
 */
export function useFiberTrace(cableId: string | null, fiberNo: number | null) {
  return useQuery({
    queryKey: ['fiber-trace', cableId, fiberNo],
    queryFn: async (): Promise<FiberTrace[] | null> => {
      if (!cableId || fiberNo === null) return null;

      const { data, error } = await supabase.rpc('trace_fiber_path', {
        p_start_cable_id: cableId,
        p_start_fiber_no: fiberNo
      });

      if (error) {
        toast.error(`Trace failed: ${error.message}`);
        throw error;
      }

      return data as FiberTrace[] || [];
    },
    enabled: !!cableId && fiberNo !== null,
  });
}