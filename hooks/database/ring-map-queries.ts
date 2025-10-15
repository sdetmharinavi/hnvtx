// path: hooks/database/ring-map-queries.ts
"use client";

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';
import { V_ring_nodesRowSchema } from '@/schemas/zod-schemas';

export function useRingNodes(ringId: string | null) {
  const supabase = createClient();

  return useQuery({
    queryKey: ['ring-nodes', ringId],
    queryFn: async (): Promise<V_ring_nodesRowSchema[]> => {
      if (!ringId) return [];

      const { data, error } = await supabase
        .from('v_ring_nodes')
        .select('*')
        .eq('ring_id', ringId)
        // Added ordering by the 'order_in_ring' column.
        .order('order_in_ring', { ascending: true });

      console.log(data);

      if (error) {
        console.error("Error fetching ring nodes:", error);
        throw new Error(error.message);
      }
      return data || [];
    },
    enabled: !!ringId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}