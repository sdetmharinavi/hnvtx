// hooks/database/fiber-assignment-hooks.ts
'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { invalidateRelatedCaches } from './cache-performance';

const AssignFiberSchema = z.object({
  fiber_id: z.uuid(),
  connection_id: z.uuid('Please select a valid connection'),
  role: z.enum(['working', 'protection']),
  direction: z.enum(['tx', 'rx']),
});

export type AssignFiberPayload = z.infer<typeof AssignFiberSchema>;

export function useAssignFiberToConnection() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AssignFiberPayload) => {
      const { error } = await supabase.rpc('assign_fiber_to_connection', {
        p_fiber_id: payload.fiber_id,
        p_connection_id: payload.connection_id,
        p_role: payload.role,
        p_direction: payload.direction,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Fiber assigned successfully!');
      invalidateRelatedCaches(queryClient, 'ofc_connections');
      invalidateRelatedCaches(queryClient, 'system_connections');
    },
    onError: (err) => toast.error(`Assignment failed: ${err.message}`),
  });
}

export function useReleaseFiber() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (fiberId: string) => {
      const { error } = await supabase.rpc('release_fiber_from_connection', {
        p_fiber_id: fiberId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Fiber unlinked successfully!');
      invalidateRelatedCaches(queryClient, 'ofc_connections');
      invalidateRelatedCaches(queryClient, 'system_connections');
    },
    onError: (err) => toast.error(`Unlink failed: ${err.message}`),
  });
}
