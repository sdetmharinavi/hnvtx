'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

const supabase = createClient();

export function useUpdatePathStatus() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ pathId, status }: { pathId: string; status: 'Active' | 'Provisioned' | 'Faulty' }) => {
      const { error } = await supabase.rpc('update_path_operational_status', {
        p_path_id: pathId,
        p_status_name: status,
      });
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      toast.success(`Path marked as ${variables.status}`);
      // Refresh the list and stats
      queryClient.invalidateQueries({ queryKey: ['v_end_to_end_paths'] }); // Main Table
      queryClient.invalidateQueries({ queryKey: ['logical-path-stats'] }); // The Stats Cards
    },
    onError: (err: Error) => {
      toast.error(`Update failed: ${err.message}`);
    },
  });
}

export function useDeprovisionPath() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ pathId }: { pathId: string }) => {
      const { error } = await supabase.rpc('deprovision_logical_path', {
        p_path_id: pathId,
      });
      if (error) throw error;
    },
    onSuccess: (_, { pathId }) => {
      toast.success('Path de-provisioned successfully!');
      // Invalidate all related queries to reflect the change
      queryClient.invalidateQueries({ queryKey: ['system-path', pathId] });
      queryClient.invalidateQueries({ queryKey: ['available-fibers', pathId] });
      queryClient.invalidateQueries({ queryKey: ['logical_fiber_paths'] });
      queryClient.invalidateQueries({ queryKey: ['ofc_connections'] });
      queryClient.invalidateQueries({ queryKey: ['v_cable_utilization'] });
    },
    onError: (err) => toast.error(`De-provisioning failed: ${err.message}`),
  });
}
