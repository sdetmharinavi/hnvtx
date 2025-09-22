// path: hooks/database/route-manager-hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { JunctionClosure, RouteDetailsPayload, OfcForSelection, JcSplicingDetails, AutoSpliceResult } from '@/components/route-manager/types';
import { toast } from 'sonner';

const supabase = createClient();

/** Fetches a list of all OFC cables for the selection dropdown. */
export function useOfcRoutesForSelection() {
  return useQuery({
    queryKey: ['ofc-routes-for-selection'],
    queryFn: async (): Promise<OfcForSelection[]> => {
      const { data, error } = await supabase
        .from('ofc_cables')
        .select('id, route_name, capacity')
        .order('route_name');
      if (error) throw error;
      return data || [];
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
      // Fetch from the complete view which already has the node names
      const { data: routeData, error: routeError } = await supabase.from('v_ofc_cables_complete').select('*').eq('id', routeId).single();
      if (routeError) throw routeError;
      if (!routeData) return null;

      const { data: jcData, error: jcError } = await supabase.from('junction_closures').select('*').eq('ofc_cable_id', routeId).order('position_km');
      if (jcError) throw jcError;

      // Type-safe mapping from the view row to the payload structure
      const route: RouteDetailsPayload['route'] = {
          id: routeData.id!,
          route_name: routeData.route_name!,
          start_node: { id: routeData.sn_id!, name: routeData.sn_name || 'Unknown SN' },
          end_node: { id: routeData.en_id!, name: routeData.en_name || 'Unknown EN' },
          capacity: routeData.capacity!,
          current_rkm: routeData.current_rkm,
      };

      return { route, junction_closures: jcData as JunctionClosure[] };
    },
    enabled: !!routeId,
    staleTime: 5 * 60 * 1000,
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
      toast.success("Junction Closure deleted successfully.");
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
      action: 'create' | 'delete' | 'update_otdr';
      jcId: string;
      spliceId?: string;
      incomingCableId?: string;
      incomingFiberNo?: number;
      outgoingCableId?: string;
      outgoingFiberNo?: number;
      spliceType?: 'pass_through' | 'branch' | 'termination';
      otdrLengthKm?: number;
    }) => {
      const { data, error } = await supabase.rpc('manage_splice', {
        p_action: variables.action, p_jc_id: variables.jcId, p_splice_id: variables.spliceId,
        p_incoming_cable_id: variables.incomingCableId, p_incoming_fiber_no: variables.incomingFiberNo,
        p_outgoing_cable_id: variables.outgoingCableId, p_outgoing_fiber_no: variables.outgoingFiberNo,
        p_splice_type: variables.spliceType, p_otdr_length_km: variables.otdrLengthKm
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => queryClient.invalidateQueries({ queryKey: ['jc-splicing-details', variables.jcId] }),
  });
}

/** Hook to call the `auto_splice_straight` RPC function. */
export function useAutoSplice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: { jcId: string; cable1Id: string; cable2Id: string; }) => {
      const { data, error } = await supabase.rpc('auto_splice_straight', { p_jc_id: variables.jcId, p_cable1_id: variables.cable1Id, p_cable2_id: variables.cable2Id });
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