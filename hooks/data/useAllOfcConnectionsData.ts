// hooks/data/useAllOfcConnectionsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_ofc_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { DEFAULTS } from '@/constants/constants';
import { 
  buildServerSearchString, 
  performClientSearch, 
  performClientPagination 
} from '@/hooks/database/search-utils';

export const useAllOfcConnectionsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_ofc_connections_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // Search Config
  const searchFields = useMemo(
    () => ['ofc_route_name', 'system_name', 'sn_name', 'en_name', 'maintenance_area_name', 'remark'] as (keyof V_ofc_connections_completeRowSchema)[],
    []
  );
  const serverSearchFields = useMemo(() => [...searchFields], [searchFields]);

  const onlineQueryFn = useCallback(async (): Promise<V_ofc_connections_completeRowSchema[]> => {
    const searchString = buildServerSearchString(searchQuery, serverSearchFields);
    const rpcFilters = buildRpcFilters({ ...filters, or: searchString });

    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_ofc_connections_complete',
      p_limit: DEFAULTS.PAGE_SIZE,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'ofc_route_name',
      p_order_dir: 'asc',
    });

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any)?.data || [];
  }, [searchQuery, filters, serverSearchFields]);

  // Offline: Use the full collection
  const localQueryFn = useCallback(() => {
    return localDb.v_ofc_connections_complete.orderBy('ofc_route_name').toArray();
  }, []);

  const {
    data: allFibers = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'v_ofc_connections_complete'>({
    queryKey: ['all-ofc-connections', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_ofc_connections_complete,
    autoSync: false // Manual sync recommended for large datasets
  });

  const processedData = useMemo(() => {
    let filtered = allFibers || [];

    // 1. Search
    if (searchQuery) {
        filtered = performClientSearch(filtered, searchQuery, searchFields);
    }

    // 2. Filters
    if (filters.status) {
         const statusBool = filters.status === 'true';
         filtered = filtered.filter(c => c.status === statusBool);
    }
    if (filters.ofc_type_name) {
        filtered = filtered.filter(c => c.ofc_type_name === filters.ofc_type_name);
    }

    // 3. Multi-Column Sort: Route Name -> Fiber Number
    filtered.sort((a, b) => {
        // Primary: Route Name (Natural Sort for text like "Route 1", "Route 10")
        const routeA = a.ofc_route_name || '';
        const routeB = b.ofc_route_name || '';
        const routeCompare = routeA.localeCompare(routeB, undefined, { sensitivity: 'base', numeric: true });
        
        if (routeCompare !== 0) return routeCompare;
        
        // Secondary: Fiber Number (Numeric)
        return (a.fiber_no_sn || 0) - (b.fiber_no_sn || 0);
    });
    
    const totalCount = filtered.length;
    const activeCount = filtered.filter(c => !!c.status).length;
    const inactiveCount = totalCount - activeCount;

    // 4. Paginate
    const paginatedData = performClientPagination(filtered, currentPage, pageLimit);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allFibers, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};