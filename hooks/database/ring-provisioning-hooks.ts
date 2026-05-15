// hooks/database/ring-provisioning-hooks.ts
'use client';

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { ofc_cablesRowSchema } from '@/schemas/zod-schemas';
import { z } from 'zod';
import { invalidateRelatedCaches } from './cache-performance';

const supabase = createClient();

// Queries remain the same...
export function useRingConnectionPaths(ringId: string | null) {
  return useQuery({
    queryKey: ['ring-connection-paths', ringId],
    queryFn: async () => {
      if (!ringId) return [];
      const { data, error } = await supabase
        .from('logical_paths')
        .select(
          `*, start_node:start_node_id(name), end_node:end_node_id(name), source_system:source_system_id(system_name), destination_system:destination_system_id(system_name)`,
        )
        .eq('ring_id', ringId)
        .order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: !!ringId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAllRingLogicalPaths(ringId: string | null) {
  return useQuery({
    queryKey: ['ring-all-logical-paths', ringId],
    queryFn: async () => {
      if (!ringId) return [];
      const { data: systems, error: sysError } = await supabase
        .from('ring_based_systems')
        .select('system_id')
        .eq('ring_id', ringId);
      if (sysError) throw sysError;
      if (!systems || systems.length === 0) return [];
      const systemIds = systems.map((s) => s.system_id);
      const { data, error } = await supabase
        .from('logical_fiber_paths')
        .select(
          'id, path_name, path_role, system_connection_id, bandwidth_gbps, remark, source_system_id, destination_system_id, source_port, destination_port, system_connections(bandwidth)',
        )
        .or(
          `source_system_id.in.(${systemIds.join(',')}),destination_system_id.in.(${systemIds.join(',')})`,
        );
      if (error) throw error;
      return data || [];
    },
    enabled: !!ringId,
    staleTime: 1000 * 60 * 5,
  });
}

const lenientCableSchema = ofc_cablesRowSchema.extend({
  created_at: z
    .string()
    .nullable()
    .transform((val) => (val ? new Date(val).toISOString() : null)),
  updated_at: z
    .string()
    .nullable()
    .transform((val) => (val ? new Date(val).toISOString() : null)),
});

export function useAvailableCables(nodeId: string | null) {
  return useQuery({
    queryKey: ['available-cables', nodeId],
    queryFn: async () => {
      if (!nodeId) return [];
      const { data, error } = await supabase.rpc('get_available_cables_for_node', {
        p_node_id: nodeId,
      });
      if (error) throw error;
      const parsed = z.array(lenientCableSchema).safeParse(data);
      if (!parsed.success) throw new Error('Invalid data for available cables');
      return parsed.data;
    },
    enabled: !!nodeId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAvailableFibers(cableId: string | null) {
  return useQuery({
    queryKey: ['available-fibers', cableId],
    queryFn: async () => {
      if (!cableId) return [];
      const { data, error } = await supabase.rpc('get_available_fibers_for_cable', {
        p_cable_id: cableId,
      });
      if (error) throw error;
      return data as { fiber_no: number }[];
    },
    enabled: !!cableId,
    staleTime: 1000 * 60 * 5,
  });
}

export function useAssignSystemToFibers() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: {
      systemId: string;
      cableId: string;
      fiberTx: number;
      fiberRx: number;
      logicalPathId: string;
    }) => {
      const { error } = await supabase.rpc('assign_system_to_fibers', {
        p_system_id: variables.systemId,
        p_cable_id: variables.cableId,
        p_fiber_tx: variables.fiberTx,
        p_fiber_rx: variables.fiberRx,
        p_logical_path_id: variables.logicalPathId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success(`Fibers provisioned successfully!`);
      invalidateRelatedCaches(queryClient, 'ofc_connections');
      invalidateRelatedCaches(queryClient, 'logical_paths');
    },
    onError: (err) => {
      toast.error(`Provisioning failed: ${err.message}`);
    },
  });
}

export function useGenerateRingPaths() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ringId: string) => {
      const { error } = await supabase.rpc('generate_ring_connection_paths', { p_ring_id: ringId });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Logical paths generated successfully!');
      invalidateRelatedCaches(queryClient, 'logical_paths');
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });
}

export function useDeleteRingLogicalPath() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('logical_paths').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Path deleted.');
      invalidateRelatedCaches(queryClient, 'logical_paths');
    },
    onError: (err) => toast.error(`Delete failed: ${err.message}`),
  });
}

export function useDeprovisionRingLogicalPath() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('logical_paths')
        .update({
          source_system_id: null,
          source_port: null,
          destination_system_id: null,
          destination_port: null,
          status: 'unprovisioned',
        })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Path configuration cleared.');
      invalidateRelatedCaches(queryClient, 'logical_paths');
    },
    onError: (err) => toast.error(`Deprovision failed: ${err.message}`),
  });
}

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
      toast.success('Path deprovisioned.');
      invalidateRelatedCaches(queryClient, 'logical_fiber_paths');
      invalidateRelatedCaches(queryClient, 'ofc_connections');
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });
}

export function useUpdateLogicalPathDetails() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (variables: {
      pathId: string;
      name: string;
      sourceSystemId: string;
      sourcePort: string;
      destinationSystemId: string | null;
      destinationPort: string | null;
      linkTypeId?: string | null;
      bandwidth?: string | null;
      startNodeId?: string;
      endNodeId?: string;
    }) => {
      const { error } = await supabase.rpc('update_ring_path_configuration', {
        p_path_id: variables.pathId,
        p_new_name: variables.name.trim(),
        p_source_system_id: variables.sourceSystemId,
        p_source_port: variables.sourcePort,
        p_dest_system_id: variables.destinationSystemId,
        p_dest_port: variables.destinationPort,
        p_link_type_id: variables.linkTypeId || null,
        p_bandwidth: variables.bandwidth || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Path configuration saved and propagated!');
      invalidateRelatedCaches(queryClient, 'logical_paths');
      invalidateRelatedCaches(queryClient, 'logical_fiber_paths');
      invalidateRelatedCaches(queryClient, 'services');
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });
}
