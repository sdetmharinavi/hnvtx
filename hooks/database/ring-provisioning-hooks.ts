// hooks/database/ring-provisioning-hooks.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { ofc_cablesRowSchema } from '@/schemas/zod-schemas';
import { z } from 'zod';
import { useLocalFirstQuery } from '@/hooks/data/useLocalFirstQuery';
import { localDb } from '@/hooks/data/localDb';
import { syncEntity } from '@/hooks/data/useDataSync'; // Added syncEntity import

const supabase = createClient();

// Hook to fetch all rings for the selection dropdown
export function useRingsForSelection() {
  const onlineQueryFn = async () => {
    // Select * to match localDb schema expectations
    const { data, error } = await supabase.from('rings').select('*').order('name');
    if (error) throw error;
    return data || [];
  };

  const localQueryFn = () => localDb.rings.orderBy('name').toArray();

  return useLocalFirstQuery<'rings'>({
    queryKey: ['rings-for-selection'],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.rings,
  });
}

// Hook to fetch the logical connection paths for a selected ring
export function useRingConnectionPaths(ringId: string | null) {
  // 1. Online Fetcher: Uses the efficient join query
  const onlineQueryFn = async () => {
    if (!ringId) return [];
    const { data, error } = await supabase
      .from('logical_paths')
      .select(
        `
            *,
            start_node:start_node_id(name),
            end_node:end_node_id(name),
            source_system:source_system_id(system_name),
            destination_system:destination_system_id(system_name)
        `
      )
      .eq('ring_id', ringId)
      .order('name');
    if (error) throw error;

    // Flatten the structure slightly to match our expected interface
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data || []).map((row: any) => ({
      ...row,
      start_node: row.start_node,
      end_node: row.end_node,
      source_system: row.source_system,
      destination_system: row.destination_system,
    }));
  };

  // 2. Local Fetcher with JOIN logic
  const localQueryFn = async () => {
    if (!ringId) return [];

    // Fetch raw paths
    const paths = await localDb.logical_paths.where('ring_id').equals(ringId).toArray();

    // Fetch related data for joins
    const nodeIds = new Set<string>();
    const systemIds = new Set<string>();

    paths.forEach((p) => {
      if (p.start_node_id) nodeIds.add(p.start_node_id);
      if (p.end_node_id) nodeIds.add(p.end_node_id);
      if (p.source_system_id) systemIds.add(p.source_system_id);
      if (p.destination_system_id) systemIds.add(p.destination_system_id);
    });

    const nodes = await localDb.nodes.where('id').anyOf(Array.from(nodeIds)).toArray();
    const systems = await localDb.systems.where('id').anyOf(Array.from(systemIds)).toArray();

    const nodeMap = new Map(nodes.map((n) => [n.id, n]));
    const systemMap = new Map(systems.map((s) => [s.id, s]));

    // Reconstruct the joined object structure expected by the UI
    return paths.map((p) => ({
      ...p,
      start_node: p.start_node_id
        ? { name: nodeMap.get(p.start_node_id)?.name || 'Unknown' }
        : null,
      end_node: p.end_node_id ? { name: nodeMap.get(p.end_node_id)?.name || 'Unknown' } : null,
      source_system: p.source_system_id
        ? { system_name: systemMap.get(p.source_system_id)?.system_name || 'Unknown' }
        : null,
      destination_system: p.destination_system_id
        ? { system_name: systemMap.get(p.destination_system_id)?.system_name || 'Unknown' }
        : null,
    }));
  };

  return useLocalFirstQuery({
    queryKey: ['ring-connection-paths', ringId],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.logical_paths,
    enabled: !!ringId,
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
  const onlineQueryFn = async () => {
    const { data, error } = await supabase.rpc('get_available_cables_for_node', {
      p_node_id: nodeId!,
    });
    if (error) throw error;
    const parsed = z.array(lenientCableSchema).safeParse(data);
    if (!parsed.success) throw new Error('Invalid data for available cables');
    return parsed.data;
  };

  const localQueryFn = async () => {
    return localDb.ofc_cables.where('sn_id').equals(nodeId!).or('en_id').equals(nodeId!).toArray();
  };

  return useLocalFirstQuery<'ofc_cables'>({
    queryKey: ['available-cables', nodeId],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.ofc_cables,
    enabled: !!nodeId,
  });
}

export function useAvailableFibers(cableId: string | null) {
  const onlineQueryFn = async () => {
    const { data, error } = await supabase.rpc('get_available_fibers_for_cable', {
      p_cable_id: cableId!,
    });
    if (error) throw error;
    return data as { fiber_no: number }[];
  };

  const localQueryFn = async () => {
    const fibers = await localDb.ofc_connections
      .where('ofc_id')
      .equals(cableId!)
      .filter((f) => f.system_id === null && f.status === true)
      .toArray();
    return fibers.map((f) => ({ fiber_no: f.fiber_no_sn }));
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return useLocalFirstQuery<any, { fiber_no: number }, any>({
    queryKey: ['available-fibers', cableId],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.ofc_connections,
    enabled: !!cableId,
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
    onSuccess: (_, variables) => {
      toast.success(`Fibers provisioned successfully!`);
      queryClient.invalidateQueries({ queryKey: ['available-fibers', variables.cableId] });
      queryClient.invalidateQueries({ queryKey: ['ring-connection-paths'] });
    },
    onError: (err) => {
      toast.error(`Provisioning failed: ${err.message}`);
    },
  });
}

// Enhanced mutation hook to handle all necessary invalidations AND sync
export function useGenerateRingPaths() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ringId: string) => {
      const { error } = await supabase.rpc('generate_ring_connection_paths', { p_ring_id: ringId });
      if (error) throw error;
    },
    onSuccess: async (_, ringId) => {
      toast.success('Logical paths generated successfully!');

      // 1. Force Sync the logical_paths table so localDb is updated immediately
      await syncEntity(supabase, localDb, 'logical_paths');

      // 2. Invalidate the paths list for this ring (Updates the Table via localQueryFn)
      queryClient.invalidateQueries({ queryKey: ['ring-connection-paths', ringId] });

      // 3. Invalidate the global ring manager stats
      queryClient.invalidateQueries({ queryKey: ['rings-manager-data'] });
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
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
    onSuccess: async () => {
      toast.success('Path deprovisioned.');
      // Sync to update local state
      await syncEntity(supabase, localDb, 'logical_paths');

      queryClient.invalidateQueries({ queryKey: ['ring-connection-paths'] });
      queryClient.invalidateQueries({ queryKey: ['available-fibers'] });
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });
}

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
          status: 'configured',
        })
        .eq('id', variables.pathId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success('Path configuration saved.');
      // Sync to update local state
      await syncEntity(supabase, localDb, 'logical_paths');

      queryClient.invalidateQueries({ queryKey: ['ring-connection-paths'] });
      queryClient.invalidateQueries({ queryKey: ['ring-path-config'] });
    },
    onError: (err) => toast.error(`Failed: ${err.message}`),
  });
}
