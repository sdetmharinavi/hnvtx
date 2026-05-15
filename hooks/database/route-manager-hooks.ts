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
} from '@/schemas/custom-schemas';
// THE FIX: Import our master invalidator
import { invalidateRelatedCaches } from './cache-performance';

const supabase = createClient();

/** Fetches a list of OFC cables for the selection dropdown. */
export function useOfcRoutesForSelection() {
  return useQuery({
    queryKey: ['ofc-routes-for-selection'],
    queryFn: async (): Promise<OfcForSelection[]> => {
      const { data, error } = await supabase
        .from('ofc_cables')
        .select('id, route_name, capacity, ofc_connections(id)')
        .order('route_name', { ascending: true })
        .limit(5000);
      if (error) throw error;
      const parsed = z.array(ofcForSelectionSchema).safeParse(data);
      if (parsed.success) return parsed.data;
      return [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRouteDetails(routeId: string | null) {
  return useQuery({
    queryKey: ['route-details', routeId],
    queryFn: async (): Promise<RouteDetailsPayload | null> => {
      if (!routeId) return null;
      const res = await fetch(`/api/route/${routeId}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`API Error: ${await res.text()}`);
      const data = await res.json();
      const parsed = routeDetailsPayloadSchema.safeParse(data);
      if (!parsed.success) throw new Error('Invalid route data structure received.');
      return parsed.data;
    },
    enabled: !!routeId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useJcSplicingDetails(jcId: string | null) {
  return useQuery({
    queryKey: ['jc-splicing-details', jcId],
    queryFn: async (): Promise<JcSplicingDetails | null> => {
      if (!jcId) return null;
      const { data, error } = await supabase.rpc('get_jc_splicing_details', { p_jc_id: jcId });
      if (error) throw error;
      if (!data) return null;
      const parsed = jcSplicingDetailsSchema.safeParse(data);
      if (!parsed.success) throw new Error('Invalid splicing data received.');
      return parsed.data;
    },
    enabled: !!jcId,
    staleTime: 5 * 60 * 1000,
  });
}

/** Hook to call the `manage_splice` RPC function. */
export function useManageSplice() {
  const queryClient = useQueryClient();
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
    onSuccess: () => {
      toast.success('Splice configuration updated!');
      // THE FIX: Use master invalidator
      invalidateRelatedCaches(queryClient, 'fiber_splices');
    },
    onError: (err) => toast.error(`Splice Error: ${err.message}`),
  });
}

/** Sync Path From Trace (Manual). */
export function useSyncPathFromTrace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: PathToUpdate) => {
      const { error } = await supabase.rpc('apply_logical_path_update', payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Path data synced!');
      invalidateRelatedCaches(queryClient, 'ofc_connections');
    },
    onError: (err: Error) => toast.error(`Sync failed: ${err.message}`),
  });
}

export function useReverseFiberPath() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { data: connection, error: fetchError } = await supabase
        .from('ofc_connections')
        .select(
          `id, fiber_no_sn, fiber_no_en, updated_sn_id, updated_en_id, updated_fiber_no_sn, updated_fiber_no_en, ofc_cables(sn_id, en_id)`,
        )
        .eq('id', connectionId)
        .single();
      if (fetchError || !connection) throw new Error('Failed to fetch data');

      const cable = connection.ofc_cables as any;
      const payload: PathToUpdate = {
        p_id: connection.id,
        p_start_node_id: connection.updated_en_id || cable?.en_id,
        p_end_node_id: connection.updated_sn_id || cable?.sn_id,
        p_start_fiber_no: connection.updated_fiber_no_en || connection.fiber_no_en,
        p_end_fiber_no: connection.updated_fiber_no_sn || connection.fiber_no_sn,
      };
      const { error } = await supabase.rpc('apply_logical_path_update', payload);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Path direction reversed successfully!');
      invalidateRelatedCaches(queryClient, 'ofc_connections');
    },
    onError: (err: Error) => toast.error(`Reverse failed: ${err.message}`),
  });
}

export function useAutoSplice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: {
      jcId: string;
      segment1Id: string;
      segment2Id: string;
      lossDb?: number;
    }): Promise<AutoSpliceResult> => {
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
    onSuccess: (data) => {
      toast.success(`${data.splices_created} splices created!`);
      invalidateRelatedCaches(queryClient, 'fiber_splices');
    },
    onError: (error) => toast.error(`Auto-splice failed: ${error.message}`),
  });
}

export function useSyncPathUpdates() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ jcId }: { jcId: string }) => Promise.resolve(),
    onSuccess: () => {
      toast.success('Refreshed.');
      invalidateRelatedCaches(queryClient, 'fiber_splices');
    },
  });
}
