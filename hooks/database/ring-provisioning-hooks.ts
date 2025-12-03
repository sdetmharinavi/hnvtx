// path: hooks/database/ring-provisioning-hooks.ts
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { ofc_cablesRowSchema } from "@/schemas/zod-schemas";
import { z } from "zod";

const supabase = createClient();

// Hook to fetch all rings for the selection dropdown
export function useRingsForSelection() {
  return useQuery({
    queryKey: ['rings-for-selection'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rings')
        .select('id, name')
        .order('name');
      if (error) throw error;
      return data || [];
    }
  });
}

// Hook to fetch the logical connection paths for a selected ring
export function useRingConnectionPaths(ringId: string | null) {
  return useQuery({
    queryKey: ['ring-connection-paths', ringId],
    queryFn: async () => {
      if (!ringId) return [];
      const { data, error } = await supabase
        .from('logical_paths')
        .select(`
            *,
            start_node:start_node_id(name),
            end_node:end_node_id(name),
            source_system:source_system_id(system_name),
            destination_system:destination_system_id(system_name)
        `)
        .eq('ring_id', ringId)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!ringId
  });
}

// ** THE DEFINITIVE FIX **
// Create a local, more lenient schema that accepts the non-ISO date format
// and transforms it into a valid one for the main schema.
const lenientCableSchema = ofc_cablesRowSchema.extend({
    created_at: z.string().nullable().transform(val => val ? new Date(val).toISOString() : null),
    updated_at: z.string().nullable().transform(val => val ? new Date(val).toISOString() : null),
});

// Hook to fetch available physical cables connected to a node
export function useAvailableCables(nodeId: string | null) {
  return useQuery({
    queryKey: ['available-cables', nodeId],
    queryFn: async () => {
      if (!nodeId) return [];
      const { data, error } = await supabase.rpc('get_available_cables_for_node', { p_node_id: nodeId });
      if (error) throw error;

      // **THE DEFINITIVE FIX: Use the lenient schema for parsing.**
      // This accepts the database's format and transforms it into the strict format
      // that the rest of the application expects.
      const parsed = z.array(lenientCableSchema).safeParse(data);

      if (!parsed.success) {
        console.error("Zod validation error for available cables:", parsed.error);
        throw new Error("Invalid data for available cables");
      }
      return parsed.data;
    },
    enabled: !!nodeId
  });
}


// Hook to fetch available fibers on a specific cable
export function useAvailableFibers(cableId: string | null) {
  return useQuery({
    queryKey: ['available-fibers', cableId],
    queryFn: async () => {
      if (!cableId) return [];
      const { data, error } = await supabase.rpc('get_available_fibers_for_cable', { p_cable_id: cableId });
      if (error) throw error;
      return data as { fiber_no: number }[] || [];
    },
    enabled: !!cableId
  });
}

// Hook to call the mutation that assigns a system to fibers
export function useAssignSystemToFibers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { systemId: string; cableId: string; fiberTx: number; fiberRx: number; logicalPathId: string }) => {
      const { systemId, cableId, fiberTx, fiberRx, logicalPathId } = variables;
      const { error } = await supabase.rpc('assign_system_to_fibers', {
        p_system_id: systemId,
        p_cable_id: cableId,
        p_fiber_tx: fiberTx,
        p_fiber_rx: fiberRx,
        p_logical_path_id: logicalPathId
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Fibers ${variables.fiberTx} & ${variables.fiberRx} provisioned successfully!`);
      // Invalidate related queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['available-fibers', variables.cableId] });
      queryClient.invalidateQueries({ queryKey: ['ring-connection-paths'] });
    },
    onError: (err) => {
      toast.error(`Provisioning failed: ${err.message}`);
    }
  });
}

// Hook to generate the logical paths for a ring
export function useGenerateRingPaths() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (ringId: string) => {
            const { error } = await supabase.rpc('generate_ring_connection_paths', { p_ring_id: ringId });
            if (error) throw error;
        },
        onSuccess: (_, ringId) => {
            toast.success("Logical paths generated successfully!");
            queryClient.invalidateQueries({ queryKey: ['ring-connection-paths', ringId] });
        },
        onError: (err) => {
            toast.error(`Failed to generate paths: ${err.message}`);
        }
    });
}

// NEW HOOK: To deprovision a system from a logical path
export function useDeprovisionPath() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { logicalPathId: string }) => {
      const { error } = await supabase.rpc('deprovision_logical_path', {
        p_path_id: variables.logicalPathId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Path deprovisioned successfully.");
      queryClient.invalidateQueries({ queryKey: ['ring-connection-paths'] });
      queryClient.invalidateQueries({ queryKey: ['available-fibers'] });
    },
    onError: (err) => {
      toast.error(`Deprovisioning failed: ${err.message}`);
    }
  });
}

// --- NEW HOOK: Update Logical Path Provisioning Details ---
export function useUpdateLogicalPathDetails() {
    const queryClient = useQueryClient();
    return useMutation({
      mutationFn: async (variables: {
        pathId: string;
        sourceSystemId: string;
        sourcePort: string;
        destinationSystemId: string;
        destinationPort: string;
      }) => {
        const { error } = await supabase
          .from('logical_paths')
          .update({
            source_system_id: variables.sourceSystemId,
            source_port: variables.sourcePort,
            destination_system_id: variables.destinationSystemId,
            destination_port: variables.destinationPort,
            status: 'configured'
          })
          .eq('id', variables.pathId);
        if (error) throw error;
      },
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      onSuccess: (_, variables) => {
        toast.success("Path configuration saved.");
        queryClient.invalidateQueries({ queryKey: ['ring-connection-paths'] });
        // Also invalidate the ring map data so the map updates immediately
        queryClient.invalidateQueries({ queryKey: ['ring-path-config'] }); 
      },
      onError: (err) => {
        toast.error(`Failed to save configuration: ${err.message}`);
      }
    });
}