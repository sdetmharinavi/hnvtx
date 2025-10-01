// components/ofc/OfcForm/hooks/useNodeSearch.ts
'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/utils/supabase/client';

export const useNodeSearch = (searchTerm: string) => {
  const supabase = createClient();

  return useQuery({
    queryKey: ['node-search', searchTerm],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_nodes_for_select', {
        p_search_term: searchTerm,
        p_limit: 50 // Limit the results to a reasonable number for a dropdown
      });
      if (error) throw error;
      
      // **THE FIX: Add explicit type for the 'node' parameter.**
      return data.map((node: { id: string; name: string }) => ({ value: node.id, label: node.name }));
    },
    enabled: !!searchTerm, // Only run the query when the user is searching
    staleTime: 60 * 1000, // Cache results for 1 minute
  });
};