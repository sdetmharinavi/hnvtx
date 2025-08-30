"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

const supabase = createClient();

/**
 * Hook to call the RPC function for deleting a path segment and reordering the rest.
 */
export function useDeletePathSegment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ segmentId, pathId }: { segmentId: string, pathId: string }) => {
      const { error } = await supabase.rpc('delete_path_segment_and_reorder', {
        p_segment_id: segmentId,
        p_path_id: pathId,
      });
      if (error) throw error;
    },
    onSuccess: (_, { pathId }) => {
      toast.success("Path segment deleted.");
      queryClient.invalidateQueries({ queryKey: ['system-path', pathId] });
    },
    onError: (err) => toast.error(`Failed to delete segment: ${err.message}`),
  });
}

/**
 * Hook to call the RPC function for reordering path segments via drag-and-drop.
 */
export function useReorderPathSegments() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pathId, segmentIds }: { pathId: string, segmentIds: string[] }) => {
      const { error } = await supabase.rpc('reorder_path_segments', {
        p_path_id: pathId,
        p_segment_ids: segmentIds,
      });
      if (error) throw error;
    },
    onSuccess: (_, { pathId }) => {
      toast.success("Path reordered successfully.");
      queryClient.invalidateQueries({ queryKey: ['system-path', pathId] });
    },
    onError: (err) => toast.error(`Failed to reorder path: ${err.message}`),
  });
}