// path: hooks/database/route-manager-hooks.ts

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
  RouteDetailsPayload
} from '@/schemas/custom-schemas'; // CORRECTED IMPORT PATH

const supabase = createClient();

/** Fetches a list of OFC cables for the selection dropdown. */
export function useOfcRoutesForSelection() {
  return useQuery({
    queryKey: ['ofc-routes-for-selection'],
    queryFn: async (): Promise<OfcForSelection[]> => {
      const { data, error } = await supabase
        .from('ofc_cables')
        .select('id, route_name, capacity, ofc_connections!inner(id)')
        .order('route_name');
      if (error) throw error;

      const parsed = z.array(ofcForSelectionSchema).safeParse(data);
      if (!parsed.success) {
        console.error("Zod validation error for OfcForSelection:", parsed.error);
        throw new Error("Received invalid data structure for OFC routes.");
      }
      return parsed.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** Fetches detailed info for a single OFC Cable from our API route. */
export function useRouteDetails(routeId: string | null) {
  return useQuery({
    queryKey: ['route-details', routeId],
    queryFn: async (): Promise<RouteDetailsPayload | null> => {
      if (!routeId) return null;
      const res = await fetch(`/api/route/${routeId}`);
      if (!res.ok) throw new Error('Failed to fetch route details');
      const data = await res.json();
      
      const parsed = routeDetailsPayloadSchema.safeParse(data);
      if (!parsed.success) {
          console.error("Zod validation error for RouteDetailsPayload:", parsed.error);
          throw new Error("Received invalid data structure for route details.");
      }
      return parsed.data;
    },
    enabled: !!routeId,
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
      
      const parsed = jcSplicingDetailsSchema.safeParse(data);
      if (!parsed.success) {
        console.error("Zod validation error for JcSplicingDetails:", parsed.error);
        throw new Error("Received invalid data structure for JC splicing details.");
      }
      return parsed.data;
    },
    enabled: !!jcId,
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
      incomingSegmentId?: string;
      incomingFiberNo?: number;
      outgoingSegmentId?: string;
      outgoingFiberNo?: number;
      spliceType?: 'pass_through' | 'branch' | 'termination';
    }) => {
      const { data, error } = await supabase.rpc('manage_splice', {
        p_action: variables.action,
        p_jc_id: variables.jcId,
        p_splice_id: variables.spliceId,
        p_incoming_segment_id: variables.incomingSegmentId,
        p_incoming_fiber_no: variables.incomingFiberNo,
        p_outgoing_segment_id: variables.outgoingSegmentId,
        p_outgoing_fiber_no: variables.outgoingFiberNo,
        p_splice_type: variables.spliceType,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success("Splice configuration updated!");
      queryClient.invalidateQueries({ queryKey: ['jc-splicing-details', variables.jcId] });
    },
    onError: (err) => toast.error(`Splice Error: ${err.message}`),
  });
}

/** Hook to call the `auto_splice_straight_segments` RPC function. */
export function useAutoSplice() {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async (variables: { jcId: string; segment1Id: string; segment2Id: string }): Promise<AutoSpliceResult> => {
            const { data, error } = await supabase.rpc('auto_splice_straight_segments', {
                p_jc_id: variables.jcId,
                p_segment1_id: variables.segment1Id,
                p_segment2_id: variables.segment2Id,
            });
            if (error) throw error;
      
            const parsed = autoSpliceResultSchema.safeParse(data);
            if (!parsed.success) {
                console.error("Zod validation error for AutoSpliceResult:", parsed.error);
                throw new Error("Received invalid data structure for auto-splice result.");
            }
            return parsed.data;
        },
        onSuccess: (data, variables) => {
            const count = data.splices_created || 0;
            toast.success(`${count} straight splices created successfully!`);
            queryClient.invalidateQueries({ queryKey: ['jc-splicing-details', variables.jcId] });
        },
        onError: (error) => toast.error(`Auto-splice failed: ${error.message}`),
    });
}
