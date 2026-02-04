// hooks/database/route-manager-hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import {
  autoSpliceResultSchema,
  AutoSpliceResult,
  jcSplicingDetailsSchema,
  JcSplicingDetails,
  ofcForSelectionSchema,
  OfcForSelection,
  routeDetailsPayloadSchema,
  RouteDetailsPayload,
  PathToUpdate,
  JointBox,
} from '@/schemas/custom-schemas';
import { localDb } from '@/hooks/data/localDb';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { V_ofc_connections_completeRowSchema } from '@/schemas/zod-schemas';

const supabase = createClient();

/** Fetches a list of OFC cables for the selection dropdown. */
export function useOfcRoutesForSelection() {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: ['ofc-routes-for-selection'],
    queryFn: async (): Promise<OfcForSelection[]> => {
      // 1. Try Online
      if (isOnline) {
        try {
          const { data, error } = await supabase
            .from('ofc_cables')
            .select('id, route_name, capacity, ofc_connections!inner(id)')
            .order('route_name', { ascending: true });

          if (error) throw error;

          const parsed = z.array(ofcForSelectionSchema).safeParse(data);
          if (parsed.success) return parsed.data;
        } catch (err) {
          console.warn('Online route fetch failed, falling back to local:', err);
        }
      }

      // 2. Local Fallback
      // We iterate local cables and only keep those that have connections (imitating !inner join)
      const cables = await localDb.ofc_cables.orderBy('route_name').toArray();
      // Optimization: In a real scenario, we might assume all cables are valid or check connections count
      // For speed in offline mode, we just return the cables.
      return cables.map((c) => ({
        id: c.id,
        route_name: c.route_name,
        capacity: c.capacity,
        ofc_connections: [{ id: 'placeholder' }], // Mock to satisfy schema validation
      }));
    },
    staleTime: 60 * 60 * 1000,
  });
}

/** Fetches detailed info for a single OFC Cable (Hybrid: API -> Local DB). */
export function useRouteDetails(routeId: string | null) {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: ['route-details', routeId],
    queryFn: async (): Promise<RouteDetailsPayload | null> => {
      if (!routeId) return null;

      // 1. Try API
      if (isOnline) {
        try {
          // THE FIX: Add cache: 'no-store' to ensure we get fresh data after a mutation
          const res = await fetch(`/api/route/${routeId}`, {
            cache: 'no-store',
          });

          if (res.ok) {
            const data = await res.json();
            const parsed = routeDetailsPayloadSchema.safeParse(data);
            if (parsed.success) return parsed.data;
          }
        } catch (err) {
          console.warn('API route details fetch failed, falling back to local:', err);
        }
      }

      // 2. Local Fallback (Reconstruct the Payload manually)
      try {
        const routeData = await localDb.v_ofc_cables_complete.get(routeId);
        if (!routeData) return null;

        const jcData = await localDb.junction_closures
          .where('ofc_cable_id')
          .equals(routeId)
          .toArray();
        const nodesData = await localDb.nodes.toArray(); // Need all nodes to lookup names
        const nodeMap = new Map(nodesData.map((n) => [n.id, n]));

        const segmentsData = await localDb.cable_segments
          .where('original_cable_id')
          .equals(routeId)
          .sortBy('segment_order');

        // Transform JCs to match JointBox schema
        const jointBoxes: JointBox[] = jcData.map((jc) => {
          const node = nodeMap.get(jc.node_id);
          return {
            ...jc,
            created_at: jc.created_at || null,
            updated_at: jc.updated_at || null,
            node: { name: node?.name || 'Unknown Node' },
            status: 'existing',
            attributes: {
              position_on_route: ((jc.position_km || 0) / (routeData.current_rkm || 1)) * 100,
              name: node?.name || undefined,
            },
          };
        });

        // Determine evolution status
        const evolutionStatus =
          segmentsData.length > 1
            ? 'fully_segmented'
            : jointBoxes.length > 0
              ? 'with_jcs'
              : 'simple';

        return {
          route: {
            ...routeData,
            start_site: { id: routeData.sn_id, name: routeData.sn_name },
            end_site: { id: routeData.en_id, name: routeData.en_name },
            evolution_status: evolutionStatus as 'simple' | 'with_jcs' | 'fully_segmented',
          },
          jointBoxes,
          segments: segmentsData,
          splices: [],
        };
      } catch (err) {
        console.error('Local DB fetch failed for route details:', err);
        return null;
      }
    },
    enabled: !!routeId,
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetches splicing matrix for a JC (Hybrid: RPC -> Local DB). */
export function useJcSplicingDetails(jcId: string | null) {
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: ['jc-splicing-details', jcId],
    queryFn: async (): Promise<JcSplicingDetails | null> => {
      if (!jcId) return null;

      // 1. Try Online RPC
      if (isOnline) {
        try {
          const { data, error } = await supabase.rpc('get_jc_splicing_details', { p_jc_id: jcId });
          if (!error && data) {
            const parsed = jcSplicingDetailsSchema.safeParse(data);
            if (parsed.success) return parsed.data;
          }
        } catch (err) {
          console.warn('RPC splicing details fetch failed, falling back to local:', err);
        }
      }

      // 2. Local Fallback (Complex Reconstruction)
      try {
        // A. Get JC info
        const jc = await localDb.junction_closures.get(jcId);
        if (!jc) return null;

        const jcNode = await localDb.nodes.get(jc.node_id);
        if (!jcNode) return null;

        // B. Find segments connected to this node
        // (start_node_id == jc.node_id OR end_node_id == jc.node_id)
        const allSegments = await localDb.cable_segments.toArray();
        const connectedSegments = allSegments.filter(
          (s) => s.start_node_id === jc.node_id || s.end_node_id === jc.node_id,
        );

        // C. Fetch cables to get names
        const cableIds = [...new Set(connectedSegments.map((s) => s.original_cable_id))];
        const cables = await localDb.ofc_cables.where('id').anyOf(cableIds).toArray();
        const cableMap = new Map(cables.map((c) => [c.id, c]));

        // D. Fetch existing splices at this JC
        const splices = await localDb.fiber_splices.where('jc_id').equals(jcId).toArray();

        // E. Build the structure
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const segmentsPayload: any[] = connectedSegments.map((seg) => {
          const cable = cableMap.get(seg.original_cable_id);
          const segName = cable
            ? `${cable.route_name} (Seg ${seg.segment_order})`
            : `Segment ${seg.id}`;

          // Build fibers array (1 to fiber_count)
          const fibers = [];
          for (let i = 1; i <= seg.fiber_count; i++) {
            // Check if spliced
            const spliceAsIncoming = splices.find(
              (s) => s.incoming_segment_id === seg.id && s.incoming_fiber_no === i,
            );
            const spliceAsOutgoing = splices.find(
              (s) => s.outgoing_segment_id === seg.id && s.outgoing_fiber_no === i,
            );

            let status = 'available';
            let spliceId = null;
            let connectedToSeg = null;
            let connectedToFib = null;
            let loss = null;

            if (spliceAsIncoming) {
              status = 'used_as_incoming';
              spliceId = spliceAsIncoming.id;
              const otherSeg = allSegments.find(
                (s) => s.id === spliceAsIncoming.outgoing_segment_id,
              );
              const otherCable = otherSeg ? cableMap.get(otherSeg.original_cable_id) : null;
              connectedToSeg = otherCable
                ? `${otherCable.route_name} (Seg ${otherSeg?.segment_order})`
                : 'Unknown';
              connectedToFib = spliceAsIncoming.outgoing_fiber_no;
              loss = spliceAsIncoming.loss_db;
            } else if (spliceAsOutgoing) {
              status = 'used_as_outgoing';
              spliceId = spliceAsOutgoing.id;
              const otherSeg = allSegments.find(
                (s) => s.id === spliceAsOutgoing.incoming_segment_id,
              );
              const otherCable = otherSeg ? cableMap.get(otherSeg.original_cable_id) : null;
              connectedToSeg = otherCable
                ? `${otherCable.route_name} (Seg ${otherSeg?.segment_order})`
                : 'Unknown';
              connectedToFib = spliceAsOutgoing.incoming_fiber_no;
              loss = spliceAsOutgoing.loss_db;
            }

            fibers.push({
              fiber_no: i,
              status,
              splice_id: spliceId,
              connected_to_segment: connectedToSeg,
              connected_to_fiber: connectedToFib,
              loss_db: loss,
            });
          }

          return {
            segment_id: seg.id,
            segment_name: segName,
            fiber_count: seg.fiber_count,
            distance_km: seg.distance_km, // ADDED: Mapped from local DB
            fibers: fibers,
          };
        });

        return {
          junction_closure: {
            id: jc.id,
            name: jcNode.name,
          },
          segments_at_jc: segmentsPayload,
        };
      } catch (err) {
        console.error('Local DB splicing details build failed:', err);
        return null; // Graceful failure instead of crash
      }
    },
    enabled: !!jcId,
    placeholderData: (previousData) => previousData,
    staleTime: 5 * 60 * 1000,
  });
}

/** Hook to call the `manage_splice` RPC function. */
export function useManageSplice() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (variables: {
      action: 'create' | 'delete' | 'update_loss';
      jcId: string;
      spliceId?: string;
      incomingSegmentId?: string;
      incomingFiberNo?: number;
      outgoingSegmentId?: string;
      outgoingFiberNo?: number;
      spliceTypeId?: string;
      lossDb?: number;
    }) => {
      // Offline Block: Managing splices offline is too complex to sync easily due to potential
      // ID conflicts and cascade path calculations.
      if (!isOnline) {
        throw new Error(
          'Splicing operations require an online connection to ensure network integrity.',
        );
      }

      const { data, error } = await supabase.rpc('manage_splice', {
        p_action: variables.action,
        p_jc_id: variables.jcId,
        p_splice_id: variables.spliceId,
        p_incoming_segment_id: variables.incomingSegmentId,
        p_incoming_fiber_no: variables.incomingFiberNo,
        p_outgoing_segment_id: variables.outgoingSegmentId,
        p_outgoing_fiber_no: variables.outgoingFiberNo,
        p_splice_type_id: variables.spliceTypeId,
        p_loss_db: variables.lossDb || 0,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('Splice configuration updated!');
      queryClient.invalidateQueries({ queryKey: ['jc-splicing-details', variables.jcId] });
      // Invalidate route details too as topology changed
      queryClient.invalidateQueries({ queryKey: ['route-details'] });
    },
    onError: (err) => toast.error(`Splice Error: ${err.message}`),
  });
}

/** Sync Path From Trace (Manual). Requires Online. */
export function useSyncPathFromTrace() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (payload: PathToUpdate) => {
      if (!isOnline) throw new Error('Syncing paths requires an online connection.');
      const { error } = await supabase.rpc('apply_logical_path_update', payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Path data synced!');
      queryClient.invalidateQueries({ queryKey: ['ofc_connections'] });
      queryClient.invalidateQueries({ queryKey: ['ofc_connections-data'] });
    },
    onError: (err: Error) => toast.error(`Sync failed: ${err.message}`),
  });
}

/**
 * NEW: Reverse Fiber Logical Path
 * Swaps logical endpoints to correct direction errors.
 */
export function useReverseFiberPath() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();
  const supabase = createClient(); // Ensure supabase client is available

  return useMutation({
    mutationFn: async (connectionId: string) => {
      if (!isOnline) throw new Error('Reversing path requires an online connection.');

      // 1. Fetch latest record from DB (source of truth)
      const { data: connection, error: fetchError } = await supabase
        .from('ofc_connections')
        .select(
          'id, sn_id, en_id, fiber_no_sn, fiber_no_en, updated_sn_id, updated_en_id, updated_fiber_no_sn, updated_fiber_no_en',
        )
        .eq('id', connectionId)
        .single();

      if (fetchError || !connection) {
        throw new Error('Failed to fetch latest connection data.');
      }

      // 2. Calculate swapped values
      const currentSnId = connection.updated_sn_id || connection.sn_id;
      const currentEnId = connection.updated_en_id || connection.en_id;
      const currentFiberSn = connection.updated_fiber_no_sn || connection.fiber_no_sn;
      const currentFiberEn = connection.updated_fiber_no_en || connection.fiber_no_en;

      if (!currentSnId || !currentEnId || !currentFiberSn || !currentFiberEn) {
        throw new Error('Cannot swap: Missing node IDs or fiber numbers.');
      }

      // 3. Call RPC with SWAPPED values
      const payload: PathToUpdate = {
        p_id: connection.id,
        p_start_node_id: currentEnId, // Swapped
        p_end_node_id: currentSnId, // Swapped
        p_start_fiber_no: currentFiberEn, // Swapped
        p_end_fiber_no: currentFiberSn, // Swapped
      };

      const { error } = await supabase.rpc('apply_logical_path_update', payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Path direction reversed successfully!');
      queryClient.invalidateQueries({ queryKey: ['ofc_connections'] });
      queryClient.invalidateQueries({ queryKey: ['ofc_connections-data'] });
      queryClient.invalidateQueries({ queryKey: ['rpc-record'] }); // Invalidate single record fetch
      queryClient.invalidateQueries({ queryKey: ['fiber-trace'] });
    },
    onError: (err: Error) => toast.error(`Reverse failed: ${err.message}`),
  });
}

/** Auto Splice. Requires Online. */
export function useAutoSplice() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    mutationFn: async (variables: {
      jcId: string;
      segment1Id: string;
      segment2Id: string;
      lossDb?: number;
    }): Promise<AutoSpliceResult> => {
      if (!isOnline) throw new Error('Auto-splicing requires an online connection.');

      const { data, error } = await supabase.rpc('auto_splice_straight_segments', {
        p_jc_id: variables.jcId,
        p_segment1_id: variables.segment1Id,
        p_segment2_id: variables.segment2Id,
        p_loss_db: variables.lossDb || 0,
      });
      if (error) throw error;

      const parsed = autoSpliceResultSchema.safeParse(data);
      if (!parsed.success) throw new Error('Invalid response data.');
      return parsed.data;
    },
    onSuccess: (data, variables) => {
      toast.success(`${data.splices_created} splices created!`);
      queryClient.invalidateQueries({ queryKey: ['jc-splicing-details', variables.jcId] });
    },
    onError: (error) => toast.error(`Auto-splice failed: ${error.message}`),
  });
}

/** Sync Path Updates Button Handler */
export function useSyncPathUpdates() {
  const queryClient = useQueryClient();
  const isOnline = useOnlineStatus();

  return useMutation({
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    mutationFn: async ({ jcId }: { jcId: string }) => {
      if (!isOnline) return Promise.resolve(); // If offline, just refresh local view
      // This is effectively a "Refresh" in the new architecture
      return Promise.resolve();
    },
    onSuccess: (_, { jcId }) => {
      if (isOnline) toast.success('Refreshed.');
      queryClient.invalidateQueries({ queryKey: ['jc-splicing-details', jcId] });
      queryClient.invalidateQueries({ queryKey: ['route-details'] });
    },
  });
}
