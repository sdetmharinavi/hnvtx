// hooks/data/useServicesData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_servicesRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';

export const useServicesData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_servicesRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // 1. Online Fetcher (RPC)
  const onlineQueryFn = useCallback(async (): Promise<V_servicesRowSchema[]> => {
    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchQuery
        ? `(name.ilike.%${searchQuery}%,node_name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%)`
        : undefined,
    });
    
    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_services',
      p_limit: 5000,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'name',
    });

    if (error) throw error;
    
    // Safe unwrapping of the RPC response
    let resultList: V_servicesRowSchema[] = [];
    
    if (Array.isArray(data)) {
      if (data.length > 0 && 'data' in data[0]) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            resultList = (data[0] as any).data as V_servicesRowSchema[];
      } else {
            resultList = data as V_servicesRowSchema[];
      }
    } else if (data && typeof data === 'object' && 'data' in data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        resultList = (data as any).data as V_servicesRowSchema[];
    }

    return resultList || [];
  }, [searchQuery, filters]);

  // 2. Offline Fetcher (Dexie)
  const localQueryFn = useCallback(() => {
    return localDb.v_services.toArray();
  }, []);

  // 3. Use Local First Query
  const {
    data: allServices = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'v_services'>({
    // Key includes 'v_services' for cache invalidation matching
    queryKey: ['v_services-data', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_services,
  });

  // 4. Client-side Processing
  const processedData = useMemo(() => {
    if (!allServices) {
        return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }

    let filtered = allServices;
    
    if (searchQuery) {
        const lower = searchQuery.toLowerCase();
        filtered = filtered.filter(s => 
            s.name?.toLowerCase().includes(lower) ||
            s.node_name?.toLowerCase().includes(lower) ||
            s.description?.toLowerCase().includes(lower)
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