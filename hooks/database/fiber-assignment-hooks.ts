// path: hooks/database/fiber-assignment-hooks.ts
"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const assignFiberSchema = z.object({
  fiber_id: z.string().uuid(),
  connection_id: z.string().uuid("Please select a valid connection"),
  role: z.enum(['working', 'protection']),
  direction: z.enum(['tx', 'rx']),
});

export type AssignFiberPayload = z.infer<typeof assignFiberSchema>;

export function useAssignFiberToConnection() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: AssignFiberPayload) => {
      const { error } = await supabase.rpc('assign_fiber_to_connection', {
        p_fiber_id: payload.fiber_id,
        p_connection_id: payload.connection_id,
        p_role: payload.role,
        p_direction: payload.direction
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Fiber assigned successfully!");
      // Invalidate relevant queries to refresh UI
      queryClient.invalidateQueries({ queryKey: ['ofc_connections-data'] });
      queryClient.invalidateQueries({ queryKey: ['all-ofc-connections'] });
      queryClient.invalidateQueries({ queryKey: ['v_cable_utilization'] });
      queryClient.invalidateQueries({ queryKey: ['system_connections-data'] });
    },
    onError: (err) => {
      toast.error(`Assignment failed: ${err.message}`);
    }
  });
}