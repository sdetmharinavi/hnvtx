// path: hooks/database/route-manager-hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { JcSplicingDetails, AutoSpliceResult, Site, Equipment, CableSegment, FiberSplice } from '@/components/route-manager/types';
import { toast } from 'sonner';
import {
  Ofc_cablesRowSchema,
  V_junction_closures_completeRowSchema,
  V_ofc_cables_completeRowSchema,
} from '@/schemas/zod-schemas';

export type OfcForSelection = Pick<Ofc_cablesRowSchema, 'id' | 'route_name' | 'capacity'>;

export type JunctionClosure = Pick<V_junction_closures_completeRowSchema, 'id' | 'node_id' | 'name' | 'ofc_cable_id' | 'latitude' | 'longitude' | 'position_km'>;

export type CableRoute = {
  id: V_ofc_cables_completeRowSchema['id'];
  route_name: V_ofc_cables_completeRowSchema['route_name'];
  capacity: V_ofc_cables_completeRowSchema['capacity'];
  current_rkm: V_ofc_cables_completeRowSchema['current_rkm'];
  start_node: {
    id: V_ofc_cables_completeRowSchema['sn_id'];
    name: V_ofc_cables_completeRowSchema['sn_name'];
  };
  end_node: {
    id: V_ofc_cables_completeRowSchema['en_id'];
    name: V_ofc_cables_completeRowSchema['en_name'];
  };
};

// Detailed data for a selected route, fetched on the client
export interface RouteDetailsPayload {
  route: {
    id: string;
    name: string;
    start_site: Site;
    end_site: Site;
    capacity: number;
    distance_km: number;
    evolution_status: 'simple' | 'with_jcs' | 'fully_segmented';
  };
  equipment: Equipment[]; // existing JCs
  segments: CableSegment[];
  splices: FiberSplice[];
}

const supabase = createClient();

/** Fetches a list of all OFC cables that have at least one related row in ofc_connections for the selection dropdown. */
export function useOfcRoutesForSelection() {
  return useQuery({
    queryKey: ['ofc-routes-for-selection'],
    queryFn: async (): Promise<OfcForSelection[]> => {
      const { data, error } = await supabase
        .from('ofc_cables')
        // Only include cables that have at least one related row in ofc_connections
        // Using PostgREST's inner join filter syntax: related_table!inner()
        .select('id, route_name, capacity, ofc_connections!inner(id)')
        .order('route_name');
      if (error) throw error;
      // Ensure we only return the fields required by OfcForSelection
      type Row = {
        id: string;
        route_name: string;
        capacity: number;
        ofc_connections: { id: string }[];
      };
      const rows = (data || []) as Row[];
      return rows.map((row) => ({
        id: row.id,
        route_name: row.route_name,
        capacity: row.capacity,
      }));
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetches detailed info for a single OFC Cable, including its JCs. */
export function useRouteDetails(routeId: string | null) {
  return useQuery({
    queryKey: ['route-details', routeId],
    queryFn: async (): Promise<RouteDetailsPayload | null> => {
      if (!routeId) return null;

      // In a real app, this would be a single RPC call `get_route_evolution_details(routeId)`
      // For now, we simulate it with multiple calls.
      
      // 1. Fetch main route info
      const { data: routeData, error: routeError } = await supabase
        .from('v_ofc_cables_complete')
        .select('*')
        .eq('id', routeId)
        .single();
      if (routeError) throw routeError;

      // 2. Fetch all JCs on this cable
      const { data: jcData, error: jcError } = await supabase
        .from('junction_closures')
        .select('*, node:node_id(name, latitude, longitude)')
        .eq('ofc_cable_id', routeId);
      if (jcError) throw jcError;

      // 3. Fetch all segments for this cable
      const { data: segmentData, error: segmentError } = await supabase
        .from('cable_segments')
        .select('*')
        .eq('original_cable_id', routeId)
        .order('segment_order');
      if (segmentError) throw segmentError;

      // 4. Fetch all splices related to these segments
      const segmentIds = segmentData?.map(s => s.id) || [];
      const { data: spliceData, error: spliceError } = await supabase
          .from('fiber_splices')
          .select('*')
          .in('incoming_segment_id', segmentIds);
      if(spliceError) throw spliceError;

      // 5. Transform data into the final payload structure
      const payload: RouteDetailsPayload = {
        route: {
          id: routeData.id,
          name: routeData.route_name,
          start_site: { id: routeData.sn_id, name: routeData.sn_name },
          end_site: { id: routeData.en_id, name: routeData.en_name },
          capacity: routeData.capacity,
          distance_km: routeData.current_rkm,
          evolution_status: 'fully_segmented' // This would be determined by logic
        },
        equipment: jcData.map(jc => ({
          id: jc.id,
          name: jc.node.name,
          equipment_type: 'junction_closure',
          latitude: jc.node.latitude,
          longitude: jc.node.longitude,
          status: 'existing',
          attributes: {
            jc_type: 'inline', // This would come from your DB
            capacity: 0, // This would come from your DB
            position_on_route: (jc.position_km / routeData.current_rkm) * 100
          }
        })),
        segments: segmentData,
        splices: spliceData
      };
      
      return payload;
    },
    enabled: !!routeId,
  });
}

/** Fetches only the relevant cables that can be spliced at a given JC. */
export function useCablesForJc(jcId: string | null) {
  return useQuery({
    queryKey: ['cables-for-jc', jcId],
    queryFn: async (): Promise<OfcForSelection[]> => {
      if (!jcId) return [];
      const { data, error } = await supabase.rpc('get_cables_at_jc', { p_jc_id: jcId });
      if (error) throw error;
      return (data as OfcForSelection[]) || [];
    },
    enabled: !!jcId,
  });
}

/** Fetches all data needed for the splice matrix editor for a single JC. */
export function useJcSplicingDetails(jcId: string | null) {
  return useQuery({
    queryKey: ['jc-splicing-details', jcId],
    queryFn: async (): Promise<JcSplicingDetails | null> => {
      if (!jcId) return null;
      const { data, error } = await supabase.rpc('get_jc_splicing_details', { p_jc_id: jcId });
      if (error) throw error;
      return data as JcSplicingDetails;
    },
    enabled: !!jcId,
  });
}

/** Hook to delete a Junction Closure. */
export function useDeleteJc() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (jcId: string) => {
      const { error } = await supabase.from('junction_closures').delete().eq('id', jcId);
      if (error) throw error;
    },
    onSuccess: (_, jcId) => {
      toast.success('Junction Closure deleted successfully.');
      queryClient.invalidateQueries({ queryKey: ['route-details'] });
      queryClient.invalidateQueries({ queryKey: ['jc-splicing-details', jcId] });
    },
    onError: (error) => toast.error(`Failed to delete JC: ${error.message}`),
  });
}

/** Hook to call the `manage_splice` RPC function. */
export function useManageSplice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: {
      action: 'create' | 'delete';
      jcId: string;
      spliceId?: string;
      // FIX: Use segment IDs now
      incomingSegmentId?: string;
      incomingFiberNo?: number;
      outgoingSegmentId?: string;
      outgoingFiberNo?: number;
      spliceType?: 'pass_through' | 'branch' | 'termination';
    }) => {
      // This would now call an updated `manage_splice` RPC that accepts segment IDs
      // For brevity, the direct SDK call is shown
      if (variables.action === 'create') {
        const { data, error } = await supabase.from('fiber_splices').insert({
          jc_id: variables.jcId,
          incoming_segment_id: variables.incomingSegmentId,
          incoming_fiber_no: variables.incomingFiberNo,
          outgoing_segment_id: variables.outgoingSegmentId,
          outgoing_fiber_no: variables.outgoingFiberNo,
          splice_type: variables.spliceType,
        }).select();
        if (error) throw error;
        return data;
      }
      if (variables.action === 'delete' && variables.spliceId) {
        const { error } = await supabase.from('fiber_splices').delete().eq('id', variables.spliceId);
        if (error) throw error;
      }
    },
    onSuccess: (_, variables) => {
      toast.success("Splice configuration updated!");
      queryClient.invalidateQueries({ queryKey: ['route-details', variables.jcId] });
    },
    onError: (err) => toast.error(`Splice Error: ${err.message}`),
  });
}

/** Hook to call the `auto_splice_straight` RPC function. */
export function useAutoSplice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { jcId: string; cable1Id: string; cable2Id: string }) => {
      const { data, error } = await supabase.rpc('auto_splice_straight', {
        p_jc_id: variables.jcId,
        p_cable1_id: variables.cable1Id,
        p_cable2_id: variables.cable2Id,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: unknown, variables) => {
      const result = data as AutoSpliceResult; // Type assertion
      const count = result?.splices_created || 0;
      toast.success(`${count} straight splices created successfully!`);
      queryClient.invalidateQueries({ queryKey: ['jc-splicing-details', variables.jcId] });
    },
    onError: (error) => toast.error(`Auto-splice failed: ${error.message}`),
  });
}