// hooks/data/useGenericDataQuery.ts
import { useMemo, useCallback } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query'; 
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { createClient } from '@/utils/supabase/client';
import { buildRpcFilters, PublicTableOrViewName, Row } from '@/hooks/database';
import {
  buildServerSearchString,
  performClientPagination,
} from '@/hooks/database/search-utils';
import { DEFAULTS } from '@/constants/constants';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FilterFunction<T> = (item: T, filters: Record<string, any>) => boolean;

interface GenericDataQueryOptions<T extends PublicTableOrViewName> {
  tableName: T;
  searchFields: (keyof Row<T> & string)[];
  serverSearchFields?: string[];
  defaultSortField?: keyof Row<T>;
  filterFn?: FilterFunction<Row<T>>;
  rpcName?: string;
  rpcLimit?: number;
  orderBy?: 'asc' | 'desc';
  activeStatusField?: keyof Row<T> & string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  baseFilters?: Record<string, any>;
}

export function createGenericDataQuery<T extends PublicTableOrViewName>(
  options: GenericDataQueryOptions<T>
) {
  const {
    tableName,
    searchFields,
    serverSearchFields,
    defaultSortField = 'name' as keyof Row<T>,
    filterFn,
    rpcName = 'get_paged_data',
    rpcLimit = 6000,
    orderBy = 'asc',
    activeStatusField = 'status' as keyof Row<T> & string,
    baseFilters = {},
  } = options;

  return (params: DataQueryHookParams): DataQueryHookReturn<Row<T>> => {
    const { currentPage, pageLimit, filters, searchQuery } = params;
    const supabase = createClient();

    const actualServerSearchFields = useMemo(
      () => serverSearchFields || searchFields,
      [serverSearchFields, searchFields]
    );

    const queryFn = useCallback(async (): Promise<Row<T>[]> => {
      const searchString = buildServerSearchString(searchQuery, actualServerSearchFields);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const queryFilters: Record<string, any> = { ...baseFilters, ...filters };
      if (searchString) queryFilters.or = searchString;

      // THE FIX: Added 'stock_status' to prevent Postgres PGRST errors on the inventory page
      const clientSideKeys = ['coordinates_status', 'sortBy', 'allocation_status', 'stock_status'];
      clientSideKeys.forEach(key => {
        if (key in queryFilters) delete queryFilters[key];
      });

      const rpcFilters = buildRpcFilters(queryFilters);
      
      const { data, error } = await supabase.rpc(rpcName, {
        p_view_name: tableName,
        p_limit: rpcLimit,
        p_offset: 0,
        p_filters: rpcFilters,
        p_order_by: String(defaultSortField),
        p_order_dir: orderBy,
        p_status_column_name: activeStatusField,
      });

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data as any)?.data || []) as Row<T>[];
    }, [searchQuery, filters, actualServerSearchFields, supabase]);

    const {
      data: allData = [],
      isLoading,
      isFetching,
      error,
      refetch,
    } = useQuery<Row<T>[]>({
      queryKey: [`${tableName}-data`, searchQuery, filters, baseFilters],
      queryFn,
      placeholderData: keepPreviousData,
      staleTime: DEFAULTS.CACHE_TIME, 
    });

    const processedData = useMemo(() => {
      let filtered = allData;

      // Client-side filtering (if filterFn is provided)
      if (filterFn) {
        filtered = filtered.filter((item) => filterFn(item, filters));
      }

      // Client-side sorting (Optional specific overrides)
      if (filters.sortBy === 'last_activity' && filtered.length > 0) {
        filtered = [...filtered].sort((a, b) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tA = new Date((a as any).last_activity_at || 0).getTime();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tB = new Date((b as any).last_activity_at || 0).getTime();
          return tB - tA; // Descending
        });
      }

      const totalCount = filtered.length;
      let activeCount = totalCount;
      
      if (filtered.length > 0 && activeStatusField in (filtered[0] as object)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        activeCount = filtered.filter((i) => (i as any)[activeStatusField] === true).length;
      }
      const inactiveCount = totalCount - activeCount;

      const paginatedData = performClientPagination(filtered, currentPage, pageLimit);

      return {
        data: paginatedData,
        totalCount,
        activeCount,
        inactiveCount,
      };
    }, [allData, filters, currentPage, pageLimit, activeStatusField]);

    return { ...processedData, isLoading, isFetching, error, refetch };
  };
}