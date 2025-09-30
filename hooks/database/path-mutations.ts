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

// ... (keep existing hooks)

/**
 * Hook to call the RPC function for provisioning a fiber onto a path.
 */
export function useProvisionFiber() {
  const queryClient = useQueryClient();
  return useMutation({
      mutationFn: async ({ pathId, fiberNo }: { pathId: string, fiberNo: number }) => {
          const { error } = await supabase.rpc('provision_fiber_on_path', {
              p_path_id: pathId,
              p_fiber_no: fiberNo
          });
          if (error) throw error;
      },
      onSuccess: (_, { pathId }) => {
          toast.success("Fiber provisioned successfully!");
          // Refetch everything related to paths and connections to update the UI state
          queryClient.invalidateQueries({ queryKey: ['system-path', pathId] });
          queryClient.invalidateQueries({ queryKey: ['available-fibers', pathId] }); 
          queryClient.invalidateQueries({ queryKey: ['ofc_connections'] });
      },
      onError: (err) => toast.error(`Provisioning failed: ${err.message}`),
  });
}

export function useProvisionRingPath() {
  const queryClient = useQueryClient();
  return useMutation({
      mutationFn: async (variables: { 
          systemId: string;
          pathName: string;
          workingFiber: number;
          protectionFiber: number;
          physicalPathId: string; 
      }) => {
          const { error } = await supabase.rpc('provision_ring_path', {
              p_system_id: variables.systemId,
              p_path_name: variables.pathName,
              p_working_fiber_no: variables.workingFiber,
              p_protection_fiber_no: variables.protectionFiber,
              p_physical_path_id: variables.physicalPathId
          });
          if (error) throw error;
      },
      onSuccess: (_, variables) => {
          toast.success("Ring path provisioned successfully!");
          // Invalidate all related queries to refresh the UI state completely
          queryClient.invalidateQueries({ queryKey: ['system-path', variables.physicalPathId] });
          queryClient.invalidateQueries({ queryKey: ['available-fibers', variables.physicalPathId] }); 
          queryClient.invalidateQueries({ queryKey: ['logical_fiber_paths'] });
          queryClient.invalidateQueries({ queryKey: ['ofc_connections'] });
          queryClient.invalidateQueries({ queryKey: ['v_cable_utilization'] });
      },
      onError: (err) => toast.error(`Provisioning failed: ${err.message}`),
  });
}

export function useDeprovisionPath() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pathId }: { pathId: string }) => {
      const { error } = await supabase.rpc('deprovision_logical_path', {
        p_path_id: pathId
      });
      if (error) throw error;
    },
    onSuccess: (_, { pathId }) => {
      toast.success("Path de-provisioned successfully!");
      // Invalidate all related queries to reflect the change
      queryClient.invalidateQueries({ queryKey: ['system-path', pathId] });
      queryClient.invalidateQueries({ queryKey: ['available-fibers', pathId] });
      queryClient.invalidateQueries({ queryKey: ['logical_fiber_paths'] });
      queryClient.invalidateQueries({ queryKey: ['ofc_connections'] });
      queryClient.invalidateQueries({ queryKey: ['v_cable_utilization'] });
    },
    onError: (err) => toast.error(`De-provisioning failed: ${err.message}`),
  });
}