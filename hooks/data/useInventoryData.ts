// hooks/data/useInventoryData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_inventory_itemsRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { DEFAULTS } from '@/constants/constants';

/**
 * Implements the local-first data fetching strategy for the Inventory page.
 */
export const useInventoryData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_inventory_itemsRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // 1. Online Fetcher
  const onlineQueryFn = useCallback(async (): Promise<V_inventory_itemsRowSchema[]> => {
    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchQuery
        ? `(name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,asset_no.ilike.%${searchQuery}%)`
        : undefined,
    });
    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_inventory_items',
      p_limit: DEFAULTS.PAGE_SIZE,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'created_at',
      p_order_dir: 'desc',
    });
    if (error) throw error;
    return (data as { data: V_inventory_itemsRowSchema[] })?.data || [];
  }, [searchQuery, filters]);

  // 2. Offline Fetcher
  const localQueryFn = useCallback(() => {
    return localDb.v_inventory_items.toArray();
  }, []);

  // 3. Use the local-first query hook
  const {
    data: allItems = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'v_inventory_items'>({
    queryKey: ['inventory-data', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_inventory_items,
  });

  // 4. Client-side processing
  const processedData = useMemo(() => {
    if (!allItems) {
      return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }
    
    let filtered = allItems;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.asset_no?.toLowerCase().includes(lowerQuery)
      );
    }
    // Add other client-side filters if needed from the `filters` object

    const totalCount = filtered.length;
    // This view doesn't have a standard 'status' boolean, so we count all as 'active' for stats purposes.
    const activeCount = totalCount;
    
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount: 0,
    };
  }, [allItems, searchQuery, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};