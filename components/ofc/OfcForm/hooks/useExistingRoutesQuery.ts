// components/ofc/OfcForm/hooks/useExistingRoutesQuery.ts
'use client';

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

/**
 * A specialized hook to query for existing OFC cables between two specific nodes.
 * @param startingNodeId The ID of the starting node.
 * @param endingNodeId The ID of the ending node.
 * @returns An object containing the fetched routes and a loading state.
 */
export const useExistingRoutesQuery = (startingNodeId: string | null, endingNodeId: string | null) => {
  const supabase = createClient();

  // The specific 'or' filter string for this query.
  const orFilter = useMemo(() => {
    if (!startingNodeId || !endingNodeId) return null;
    // This creates the PostgREST filter `or=(and(sn_id.eq.val1,en_id.eq.val2),and(sn_id.eq.val2,en_id.eq.val1))`
    return `and(sn_id.eq.${startingNodeId},en_id.eq.${endingNodeId}),and(sn_id.eq.${endingNodeId},en_id.eq.${startingNodeId})`;
  }, [startingNodeId, endingNodeId]);

  return useQuery({
    queryKey: ['existing-routes', { start: startingNodeId, end: endingNodeId }],
    queryFn: async () => {
      if (!orFilter) return []; // Don't query if nodes aren't selected

      const { data, error } = await supabase
        .from('ofc_cables')
        .select('id, route_name')
        .or(orFilter);

      if (error) throw error;
      return data || [];
    },
    enabled: !!orFilter, // Only run the query when the filter is ready
    staleTime: 30000,
  });
};