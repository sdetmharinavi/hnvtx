// hooks/data/useOfcData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_ofc_cables_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { 
  buildServerSearchString, 
  performClientSearch, 
  performClientSort, 
  performClientPagination 
} from '@/hooks/database/search-utils';

export const useOfcData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_ofc_cables_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // Search Config
  const searchFields = useMemo(
    () => [
      'route_name',
      'asset_no',
      'transnet_id',
      'sn_name',
      'en_name',
      'ofc_owner_name',
    ] as (keyof V_ofc_cables_completeRowSchema)[],
    []
  );

  const onlineQueryFn = useCallback(async (): Promise<V_ofc_cables_completeRowSchema[]> => {
    const searchString = buildServerSearchString(searchQuery, searchFields);
    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchString,
    });

    const { data, error } = await createClient().rpc("get_paged_data", {
      p_view_name: "v_ofc_cables_complete",
      p_limit: 5000,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: "route_name",
      p_order_dir: "asc",
    });
    if (error) throw error;
    return (data as { data: V_ofc_cables_completeRowSchema[] })?.data || [];
  }, [searchQuery, filters, searchFields]);

  const localQueryFn = useCallback(() => {
    return localDb.v_ofc_cables_complete.orderBy('route_name').toArray();
  }, []);

  const {
    data: allCables = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'v_ofc_cables_complete'>({
    queryKey: ['ofc_cables-data', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_ofc_cables_complete,
  });

  const processedData = useMemo(() => {
    let filtered = allCables || [];

    // Search
    filtered = performClientSearch(filtered, searchQuery, searchFields);

    // Filters
    if (filters.ofc_type_id)
      filtered = filtered.filter((c) => c.ofc_type_id === filters.ofc_type_id);
    if (filters.status) 
      filtered = filtered.filter((c) => String(c.status) === filters.status);
    if (filters.ofc_owner_id)
      filtered = filtered.filter((c) => c.ofc_owner_id === filters.ofc_owner_id);
    if (filters.maintenance_terminal_id)
      filtered = filtered.filter((c) => c.maintenance_terminal_id === filters.maintenance_terminal_id);

    // Sort
    filtered = performClientSort(filtered, 'route_name');

    const totalCount = filtered.length;
    const activeCount = filtered.filter((c) => c.status === true).length;
    const inactiveCount = totalCount - activeCount;

    // Paginate
    const paginatedData = performClientPagination(filtered, currentPage, pageLimit);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allCables, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};