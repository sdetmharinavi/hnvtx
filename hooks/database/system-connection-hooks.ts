// hooks/database/system-connection-hooks.ts
'use client';
import { useRpcMutation } from '@/hooks/database/rpc-queries';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { RpcFunctionArgs } from './queries-type-helpers';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';

const pathDisplaySchema = z.record(z.string(), z.string()).nullable();
export type PathDisplayData = z.infer<typeof pathDisplaySchema>;

export function useUpsertSystemConnection() {
  const supabase = createClient();
  const queryClient = useQueryClient(); // Need access to queryClient here

  return useRpcMutation(supabase, 'upsert_system_connection_with_details', {
    onSuccess: (_, variables) => {
      const action = variables.p_id ? 'updated' : 'created';
      toast.success(`System connection ${action} successfully.`);

      // 1. Invalidate Source System Data
      if (variables.p_system_id) {
        queryClient.invalidateQueries({
          queryKey: ['system_connections-data', variables.p_system_id],
        });
        queryClient.invalidateQueries({
          queryKey: ['ports_management-data', variables.p_system_id],
        });
      }

      // 2. Invalidate Destination System Data (Bidirectional Fix)
      // If an End Node ID was provided, refresh that system's data too so the connection appears instantly.
      if (variables.p_en_id) {
        queryClient.invalidateQueries({ queryKey: ['system_connections-data', variables.p_en_id] });
        queryClient.invalidateQueries({ queryKey: ['ports_management-data', variables.p_en_id] });
      }

      // 3. General invalidation to be safe (e.g. for global views)
      queryClient.invalidateQueries({ queryKey: ['table', 'system_connections'] });
      queryClient.invalidateQueries({ queryKey: ['table', 'v_system_connections_complete'] });
    },
    onError: (err) => {
      toast.error(`Failed to save connection: ${err.message}`);
    },
    invalidateQueries: false, // We handle specific invalidation manually above
  });
}

export function useProvisionServicePath() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (variables: RpcFunctionArgs<'provision_service_path'>) => {
      const { data, error } = await supabase.rpc('provision_service_path', variables);
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      toast.success('Service path provisioned successfully!');
      // Invalidate all related queries to refresh UI state
      // Note: We use the broad 'system_connections-data' key to catch the specific system ID queries
      queryClient.invalidateQueries({ queryKey: ['system_connections-data'] });
      queryClient.invalidateQueries({ queryKey: ['table', 'ofc_connections'] });
      queryClient.invalidateQueries({ queryKey: ['table', 'logical_fiber_paths'] });
      queryClient.invalidateQueries({
        queryKey: ['service-path-display', variables.p_system_connection_id],
      });
    },
    onError: (err: Error) => {
      toast.error(`Provisioning failed: ${err.message}`);
    },
  });
}

export function useDeprovisionServicePath() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase.rpc('deprovision_service_path', {
        p_system_connection_id: connectionId,
      });
      if (error) throw error;
    },
    onSuccess: (_, connectionId) => {
      toast.success('Service path deprovisioned successfully.');
      queryClient.invalidateQueries({ queryKey: ['system_connections-data'] });
      queryClient.invalidateQueries({ queryKey: ['table', 'ofc_connections'] });
      queryClient.invalidateQueries({ queryKey: ['table', 'logical_fiber_paths'] });
      queryClient.invalidateQueries({ queryKey: ['service-path-display', connectionId] });
    },
    onError: (err: Error) => {
      toast.error(`Deprovisioning failed: ${err.message}`);
    },
  });
}

export function useServicePathDisplay(systemConnectionId: string | null) {
  const supabase = createClient();
  return useQuery({
    queryKey: ['service-path-display', systemConnectionId],
    queryFn: async () => {
      if (!systemConnectionId) return null;
      const { data, error } = await supabase.rpc('get_service_path_display', {
        p_system_connection_id: systemConnectionId,
      });
      if (error) throw error;

      const parsed = pathDisplaySchema.safeParse(data);
      if (!parsed.success) {
        console.error('Zod validation error for path display:', parsed.error);
        return null;
      }
      return parsed.data;
    },
    enabled: !!systemConnectionId,
  });
}

export type SystemConnectionFormData = RpcFunctionArgs<'upsert_system_connection_with_details'>;
