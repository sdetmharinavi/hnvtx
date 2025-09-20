// path: hooks/database/route-manager-hooks.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { JunctionClosure, RouteDetailsPayload } from '@/components/route-manager/types';
import { toast } from 'sonner';

const supabase = createClient();

/**
 * Fetches a list of all OFC cables for the selection dropdown.
 */
export function useOfcRoutesForSelection() {
  return useQuery({
    queryKey: ['ofc-routes-for-selection'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ofc_cables')
        .select('id, route_name')
        .order('route_name');

      if (error) throw error;
      return data;
    },
  });
}

/**
 * Fetches the detailed information for a single selected OFC Cable,
 * including its start/end nodes and all associated junction closures.
 */
export function useRouteDetails(routeId: string | null) {
  return useQuery({
    queryKey: ['route-details', routeId],
    queryFn: async (): Promise<RouteDetailsPayload | null> => {
      if (!routeId) return null;

      // Fetch the main route details with related node names
      const { data: routeData, error: routeError } = await supabase
        .from('ofc_cables')
        .select(`
          id,
          route_name,
          capacity,
          current_rkm,
          start_node:sn_id(id, name),
          end_node:en_id(id, name)
        `)
        .eq('id', routeId)
        .single();

      if (routeError) throw routeError;
      if (!routeData) return null;

      // Fetch all junction closures associated with this route
      const { data: jcData, error: jcError } = await supabase
        .from('junction_closures')
        .select('id, name, position_km')
        .eq('ofc_cable_id', routeId)
        .order('position_km');

      if (jcError) throw jcError;

      // Type assertion to match our component's expectations
      const route = routeData as unknown as RouteDetailsPayload['route'];

      return {
        route,
        junction_closures: jcData as JunctionClosure[],
      };
    },
    enabled: !!routeId, // The query will only run when a routeId is provided
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
}

/**
 * Fetches all data needed for the splice matrix editor for a single JC.
 * Calls the `get_jc_splicing_details` RPC function.
 */
export function useJcSplicingDetails(jcId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['jc-splicing-details', jcId],
    queryFn: async () => {
      if (!jcId) return null;
      const { data, error } = await supabase.rpc('get_jc_splicing_details', { p_jc_id: jcId });
      if (error) throw error;
      return data;
    },
    enabled: !!jcId,
    staleTime: 1 * 60 * 1000, // 1 minute cache
  });
}

/**
 * Hook to delete a Junction Closure.
 */
export function useDeleteJc() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (jcId: string) => {
      const { error } = await supabase
        .from('junction_closures')
        .delete()
        .eq('id', jcId);

      if (error) throw error;
    },
    onSuccess: (_, jcId) => {
      toast.success("Junction Closure deleted successfully.");
      // Invalidate all queries related to route details to force a refresh
      queryClient.invalidateQueries({ queryKey: ['route-details'] });
    },
    onError: (error) => {
      toast.error(`Failed to delete JC: ${error.message}`);
    },
  });
}

/**
 * Hook to call the `manage_splice` RPC function for creating or deleting splices.
 */
export function useManageSplice() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (variables: {
      action: 'create' | 'delete';
      jcId: string;
      spliceId?: string;
      incomingCableId?: string;
      incomingFiberNo?: number;
      outgoingCableId?: string;
      outgoingFiberNo?: number;
      spliceType?: 'pass_through' | 'branch' | 'termination';
    }) => {
      const {
        action,
        jcId,
        spliceId,
        incomingCableId,
        incomingFiberNo,
        outgoingCableId,
        outgoingFiberNo,
        spliceType,
      } = variables;

      const { data, error } = await supabase.rpc('manage_splice', {
        p_action: action,
        p_jc_id: jcId,
        p_splice_id: spliceId,
        p_incoming_cable_id: incomingCableId,
        p_incoming_fiber_no: incomingFiberNo,
        p_outgoing_cable_id: outgoingCableId,
        p_outgoing_fiber_no: outgoingFiberNo,
        p_splice_type: spliceType,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      // Invalidate the query for this specific JC's details to force a refresh
      queryClient.invalidateQueries({ queryKey: ['jc-splicing-details', variables.jcId] });
    },
    // We don't need a generic onError here, as we'll handle it with specific toasts in the component
  });
}

/**
 * Hook to call the `auto_splice_straight` RPC function.
 */
export function useAutoSplice() {
  const queryClient = useQueryClient();
  const supabase = createClient();

  return useMutation({
    mutationFn: async (variables: {
      jcId: string;
      cable1Id: string;
      cable2Id: string;
    }) => {
      const { data, error } = await supabase.rpc('auto_splice_straight', {
        p_jc_id: variables.jcId,
        p_cable1_id: variables.cable1Id,
        p_cable2_id: variables.cable2Id,
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data, variables) => {
      const count = (data as any)?.splices_created || 0;
      toast.success(`${count} straight splices created successfully!`);
      // Invalidate the query for this specific JC's details to force a refresh
      queryClient.invalidateQueries({ queryKey: ['jc-splicing-details', variables.jcId] });
    },
    onError: (error) => {
      toast.error(`Auto-splice failed: ${error.message}`);
    },
  });
}
