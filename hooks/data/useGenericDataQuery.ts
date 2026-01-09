// hooks/data/useGenericDataQuery.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters, PublicTableOrViewName, Row } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import {
  buildServerSearchString,
  performClientSearch,
  performClientSort,
  performClientPagination,
} from '@/hooks/database/search-utils';
import { Table } from 'dexie';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FilterFunction<T> = (item: T, filters: Record<string, any>) => boolean;

interface GenericDataQueryOptions<T extends PublicTableOrViewName> {
  tableName: T;
  searchFields: (keyof Row<T> & string)[];
  serverSearchFields?: string[]; // Defaults to searchFields cast to string if not provided
  defaultSortField?: keyof Row<T>;
  filterFn?: FilterFunction<Row<T>>;
  rpcName?: string; // Default 'get_paged_data'
  rpcLimit?: number; // Default 6000
  orderBy?: "asc" | "desc";
}

// CHANGED: Renamed from useGenericDataQuery to createGenericDataQuery
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
    orderBy = "asc",
  } = options;

  // This returns the actual hook function expected by useCrudManager
  return (params: DataQueryHookParams): DataQueryHookReturn<Row<T>> => {
    const { currentPage, pageLimit, filters, searchQuery } = params;
    const supabase = createClient();

    const actualServerSearchFields = useMemo(
      () => serverSearchFields || searchFields,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [serverSearchFields, searchFields]
    );

    // 1. Online Fetcher
    const onlineQueryFn = useCallback(async (): Promise<Row<T>[]> => {
      const searchString = buildServerSearchString(searchQuery, actualServerSearchFields);

      // FIX: Cast to Record<string, any> to allow object properties manipulation (delete/in operator).
      const rpcFilters = buildRpcFilters({
        ...filters,
        or: searchString,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as Record<string, any>;

      // Remove complex client-side keys from RPC call to prevent SQL errors
      if (rpcFilters) {
        if ('coordinates_status' in rpcFilters) delete rpcFilters.coordinates_status;
        if ('sortBy' in rpcFilters) delete rpcFilters.sortBy;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase.rpc(rpcName as any, {
        p_view_name: tableName,
        p_limit: rpcLimit,
        p_offset: 0,
        p_filters: rpcFilters,
        p_order_by: String(defaultSortField),
        p_order_dir: orderBy,
      });

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any)?.data || [];
    }, [searchQuery, filters, actualServerSearchFields, supabase]);

    // 2. Offline Fetcher
    const localQueryFn = useCallback(() => {
      // Dynamic access to localDb table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const table = (localDb as any)[tableName] as Table<Row<T>, any>;
      if (!table) {
        console.error(`Table ${tableName} not found in localDb schema`);
        return Promise.resolve([]);
      }
      return table.orderBy(String(defaultSortField)).toArray();
    }, []);

    // 3. Local-First Query
    const {
      data: allData = [],
      isLoading,
      isFetching,
      error,
      refetch,
      networkStatus,
    } = useLocalFirstQuery<T>({
      queryKey: [`${tableName}-data`, searchQuery, filters],
      onlineQueryFn,
      localQueryFn,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dexieTable: (localDb as any)[tableName],
    });

    // 4. Processing
    const processedData = useMemo(() => {
      let filtered = allData || [];

      // Client Search
      if (searchQuery) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filtered = performClientSearch(filtered, searchQuery, searchFields as any[]);
      }

      // Client Filtering
      if (filterFn) {
        filtered = filtered.filter((item) => filterFn(item, filters));
      } else {
        // Default generic filter logic (exact matches for basic keys)
        Object.entries(filters).forEach(([key, value]) => {
          if (value && key !== 'or' && key !== 'sortBy') {
            filtered = filtered.filter((item) => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const itemVal = (item as any)[key];
              // Handle boolean strings from selects
              if (value === 'true') return itemVal === true;
              if (value === 'false') return itemVal === false;
              return String(itemVal) === String(value);
            });
          }
        });
      }

      // Sort
      // Special handling for 'sortBy' filter if present
      if (
        filters.sortBy === 'last_activity' &&
        filtered.length > 0 &&
        'last_activity_at' in (filtered[0] as object)
      ) {
        filtered = filtered.sort((a, b) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tA = new Date((a as any).last_activity_at || 0).getTime();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tB = new Date((b as any).last_activity_at || 0).getTime();
          return tB - tA;
        });
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filtered = performClientSort(filtered, defaultSortField as any);
      }

      // Stats
      const totalCount = filtered.length;

      let activeCount = totalCount;
      if (filtered.length > 0 && 'status' in (filtered[0] as object)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        activeCount = filtered.filter((i) => (i as any).status === true).length;
      }

      const inactiveCount = totalCount - activeCount;

      // Paginate
      const paginatedData = performClientPagination(filtered, currentPage, pageLimit);

      return {
        data: paginatedData,
        totalCount,
        activeCount,
        inactiveCount,
      };
    }, [allData, searchQuery, filters, currentPage, pageLimit]);

    return { ...processedData, isLoading, isFetching, error, refetch, networkStatus };
  };
}
