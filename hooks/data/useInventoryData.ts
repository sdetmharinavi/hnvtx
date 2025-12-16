// hooks/data/useInventoryData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_inventory_itemsRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { DEFAULTS } from '@/constants/constants';
import { 
  buildServerSearchString, 
  performClientSearch, 
  performClientSort, 
  performClientPagination 
} from '@/hooks/database/search-utils';

export const useInventoryData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_inventory_itemsRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // Search Config
  const searchFields = useMemo(
    () => ['name', 'description', 'asset_no'] as (keyof V_inventory_itemsRowSchema)[],
    []
  );
  const serverSearchFields = useMemo(() => [...searchFields], [searchFields]);

  const onlineQueryFn = useCallback(async (): Promise<V_inventory_itemsRowSchema[]> => {
    const searchString = buildServerSearchString(searchQuery, serverSearchFields);
    const rpcFilters = buildRpcFilters({ ...filters, or: searchString });

    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_inventory_items',
      p_limit: DEFAULTS.PAGE_SIZE,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'name',
      p_order_dir: 'asc',
    });
    if (error) throw error;
    return (data as { data: V_inventory_itemsRowSchema[] })?.data || [];
  }, [searchQuery, filters, serverSearchFields]);

  const localQueryFn = useCallback(() => {
    return localDb.v_inventory_items.orderBy('name').toArray();
  }, []);

  const {
    data: allItems = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'v_inventory_items'>({
    queryKey: ['inventory_items-data', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_inventory_items,
  });

  const processedData = useMemo(() => {
    let filtered = allItems || [];

    // 1. Search
    filtered = performClientSearch(filtered, searchQuery, searchFields);

    // 2. Filters
    if (filters.category_id) {
        filtered = filtered.filter(item => item.category_id === filters.category_id);
    }
    if (filters.location_id) {
        filtered = filtered.filter(item => item.location_id === filters.location_id);
    }

    // 3. Sort
    filtered = performClientSort(filtered, 'name');

    const totalCount = filtered.length;
    
    // 4. Paginate
    const paginatedData = performClientPagination(filtered, currentPage, pageLimit);

    return {
      data: paginatedData,
      totalCount,
      activeCount: totalCount,
      inactiveCount: 0,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allItems, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};