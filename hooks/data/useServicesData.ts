// hooks/data/useServicesData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_servicesRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import {
  buildServerSearchString,
  performClientSearch,
  performClientSort,
  performClientPagination,
} from '@/hooks/database/search-utils';

export const useServicesData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_servicesRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();

  // Search Config
  const searchFields = useMemo(
    () =>
      [
        'name',
        'node_name',
        'end_node_name',
        'description',
        'link_type_name',
        'vlan',
      ] as (keyof V_servicesRowSchema)[],
    []
  );
  const serverSearchFields = useMemo(() => [...searchFields], [searchFields]);

  const onlineQueryFn = useCallback(async (): Promise<V_servicesRowSchema[]> => {
    const searchString = buildServerSearchString(searchQuery, serverSearchFields);
    const rpcFilters = buildRpcFilters({ ...filters, or: searchString });

    const { data, error } = await supabase.rpc('get_paged_data', {
      p_view_name: 'v_services',
      p_limit: 5000,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'name',
      p_order_dir: 'asc',
    });

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resultList = (data as any)?.data || [];
    return resultList as V_servicesRowSchema[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filters, serverSearchFields]);

  const localQueryFn = useCallback(() => {
    return localDb.v_services.orderBy('name').toArray();
  }, []);

  const {
    data: allServices = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'v_services'>({
    queryKey: ['v_services-data', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_services,
  });

  const processedData = useMemo(() => {
    let filtered = allServices || [];

    // 1. Search
    filtered = performClientSearch(filtered, searchQuery, searchFields);

    // 2. Filters
    if (filters.link_type_id) {
      filtered = filtered.filter((s) => s.link_type_id === filters.link_type_id);
    }
    if (filters.status) {
      const statusBool = filters.status === 'true';
      filtered = filtered.filter((s) => s.status === statusBool);
    }

    // 3. Sort
    filtered = performClientSort(filtered, 'name');

    const totalCount = filtered.length;
    const activeCount = filtered.filter((s) => s.status === true).length;
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
  }, [allServices, searchQuery, filters, currentPage, pageLimit]);

  return {
    ...processedData,
    isLoading,
    isFetching,
    error: error as Error | null,
    refetch,
  };
};
