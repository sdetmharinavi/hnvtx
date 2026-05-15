// hooks/data/useInventoryData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_inventory_itemsRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { buildServerSearchString, performClientPagination } from '@/hooks/database/search-utils';
import { buildRpcFilters } from '@/hooks/database';
import { DEFAULTS } from '@/constants/constants';

// Define strict typing for our new stats object
export interface InventoryStats {
  totalItems: number;
  totalValue: number;
  inStock: number;
  outOfStock: number;
  lowStock: number;
}

// Extend the base return type to include our stats
export interface InventoryDataReturn extends DataQueryHookReturn<V_inventory_itemsRowSchema> {
  stats: InventoryStats;
}

export const useInventoryData = (params: DataQueryHookParams): InventoryDataReturn => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();

  // THE FIX: Expanded search fields to include Vendor, Locations, Categories, Status, and Cost
  // We use ::text casting for numeric columns so ILIKE works perfectly in PostgreSQL
  const searchFields = [
    'name',
    'description',
    'asset_no',
    'vendor',
    'category_name',
    'store_location',
    'functional_location',
    'last_issued_to',
    'last_issue_reason',
    'cost::text',
  ];

  const queryFn = useCallback(async (): Promise<V_inventory_itemsRowSchema[]> => {
    const searchString = buildServerSearchString(searchQuery, searchFields);

    // We clone filters to prevent mutating the state directly
    const queryFilters = { ...filters };
    if (searchString) queryFilters.or = searchString;

    // Remove client-side specific filters before sending to RPC
    // so Postgres doesn't throw a "column does not exist" error
    const clientSideKeys = ['stock_status', 'sortBy', 'allocation_status'];
    clientSideKeys.forEach((key) => {
      if (key in queryFilters) delete queryFilters[key];
    });

    const rpcFilters = buildRpcFilters(queryFilters);

    const { data, error } = await supabase.rpc('get_paged_data', {
      p_view_name: 'v_inventory_items',
      p_limit: 6000, // Fetch large batch for accurate client-side stats & filtering
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'name',
      p_order_dir: 'asc',
    });

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as any)?.data || []) as V_inventory_itemsRowSchema[];
  }, [searchQuery, filters, supabase, searchFields]);

  const {
    data: allData = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['inventory_items-data', searchQuery, filters],
    queryFn,
    placeholderData: keepPreviousData,
    staleTime: DEFAULTS.CACHE_TIME,
  });

  const processedData = useMemo(() => {
    let filtered = allData;

    // Apply client-side stock_status filter
    if (filters.stock_status) {
      filtered = filtered.filter((item) => {
        const qty = item.quantity || 0;
        if (filters.stock_status === 'in_stock') return qty > 0;
        if (filters.stock_status === 'out_of_stock') return qty <= 0;
        return true;
      });
    }

    // CALCULATE GLOBAL STATS ON THE FULL FILTERED DATASET (Before Pagination!)
    const stats: InventoryStats = {
      totalItems: filtered.length,
      totalValue: 0,
      inStock: 0,
      outOfStock: 0,
      lowStock: 0,
    };

    filtered.forEach((item) => {
      const qty = item.quantity || 0;
      stats.totalValue += item.total_value || qty * (item.cost || 0);

      if (qty > 0) {
        stats.inStock++;
        if (qty < 5) stats.lowStock++;
      } else {
        stats.outOfStock++;
      }
    });

    // Apply pagination slicing
    const paginatedData = performClientPagination(filtered, currentPage, pageLimit);

    return {
      data: paginatedData,
      totalCount: filtered.length,
      activeCount: stats.inStock,
      inactiveCount: stats.outOfStock,
      stats, // Expose accurate stats to the UI
    };
  }, [allData, filters.stock_status, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};
