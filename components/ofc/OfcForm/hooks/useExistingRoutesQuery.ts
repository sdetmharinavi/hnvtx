// components/ofc/OfcForm/hooks/useExistingRoutesQuery.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

/**
 * A specialized hook to query for existing OFC cables between two specific nodes.
 * @param startingNodeId The ID of the starting node.
 * @param endingNodeId The ID of the ending node.
 * @returns An object containing the fetched routes and a loading state.
 */
export const useExistingRoutesQuery = (
  startingNodeId: string | null,
  endingNodeId: string | null,
) => {
  const supabase = createClient();

  return useQuery({
    queryKey: ['existing-routes', { start: startingNodeId, end: endingNodeId }],
    queryFn: async () => {
      if (!startingNodeId || !endingNodeId) return [];

      // THE FIX: Use .in() array matching instead of error-prone .or() strings
      const { data, error } = await supabase
        .from('ofc_cables')
        .select('id, route_name, sn_id, en_id')
        .in('sn_id', [startingNodeId, endingNodeId])
        .in('en_id', [startingNodeId, endingNodeId]);

      if (error) throw error;

      // Filter exactly the cross matches in case there are self-loops
      return data.filter(
        (c) =>
          (c.sn_id === startingNodeId && c.en_id === endingNodeId) ||
          (c.sn_id === endingNodeId && c.en_id === startingNodeId),
      );
    },
    enabled: !!startingNodeId && !!endingNodeId,
    staleTime: 30000,
  });
};
