// hooks/data/useServicesData.ts
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { ServicesRowSchema } from '@/schemas/zod-schemas'; 
import { createClient } from '@/utils/supabase/client';
import { buildRpcFilters } from '@/hooks/database';

export const useServicesData = (
  params: DataQueryHookParams
): DataQueryHookReturn<ServicesRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();

  const {
    data: allServices = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['services-data', searchQuery, filters],
    queryFn: async (): Promise<ServicesRowSchema[]> => {
      const rpcFilters = buildRpcFilters({
        ...filters,
        or: searchQuery
          ? `(name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,services_ip::text.ilike.%${searchQuery}%)`
          : undefined,
      });
      
      const { data, error } = await supabase.rpc('get_paged_data', {
        p_view_name: 'services', 
        p_limit: 5000,
        p_offset: 0,
        p_filters: rpcFilters,
        p_order_by: 'name',
      });

      if (error) throw error;
      
      // ROBUST UNWRAPPING LOGIC
      // Check if data is an array wrapping the result object
      let resultObject = data;

      if (Array.isArray(data) && data.length > 0) {
          // If the RPC returns [ { data: [...], count: ... } ]
          resultObject = data[0];
      } else if (Array.isArray(data) && data.length === 0) {
          // Empty array return
          return [];
      }

      // Safe casting and access to the inner 'data' property
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (resultObject as any)?.data as ServicesRowSchema[] || [];
    },
    staleTime: 1000 * 60, 
    gcTime: 1000 * 60 * 5,
    refetchOnWindowFocus: false
  });

  const processedData = useMemo(() => {
    if (!allServices) {
        return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }

    let filtered = allServices;
    
    if (searchQuery) {
        const lower = searchQuery.toLowerCase();
        filtered = filtered.filter(s => 
            s.name?.toLowerCase().includes(lower) ||
            s.services_ip?.toLowerCase().includes(lower)
        );
    }
    
    const totalCount = filtered.length;
    const activeCount = filtered.filter(s => s.status === true).length;
    
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);
    
    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
    };
  }, [allServices, searchQuery, currentPage, pageLimit]);

  return { 
    ...processedData, 
    isLoading, 
    isFetching, 
    error: error as Error | null, 
    refetch 
  };
};