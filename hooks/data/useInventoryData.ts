// hooks/data/useInventoryData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_inventory_itemsRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { DEFAULTS } from '@/constants/constants';

export const useInventoryData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_inventory_itemsRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  const onlineQueryFn = useCallback(async (): Promise<V_inventory_itemsRowSchema[]> => {
    
    // FIX: Use standard SQL syntax
    let searchString: string | undefined;
    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.trim().replace(/'/g, "''");
      searchString = `(` +
        `name ILIKE '%${term}%' OR ` +
        `description ILIKE '%${term}%' OR ` +
        `asset_no ILIKE '%${term}%'` +
      `)`;
    }

    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchString,
    });
    
    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_inventory_items',
      p_limit: DEFAULTS.PAGE_SIZE,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'name', // Changed from created_at to name
      p_order_dir: 'asc', // Changed from desc to asc
    });
    if (error) throw error;
    return (data as { data: V_inventory_itemsRowSchema[] })?.data || [];
  }, [searchQuery, filters]);

  const localQueryFn = useCallback(() => {
    // Sort by name locally as well
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

    // Apply Filters
    if (filters.category_id) {
        filtered = filtered.filter(item => item.category_id === filters.category_id);
    }
    if (filters.location_id) {
        filtered = filtered.filter(item => item.location_id === filters.location_id);
    }
    
    // Explicit Client-Side Sort to ensure consistency
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' }));

    const totalCount = filtered.length;
    const activeCount = totalCount; // Inventory items don't have a standard boolean status field in this view context

    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount: 0,
    };
  }, [allItems, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};