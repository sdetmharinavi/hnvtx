// hooks/data/useGenericDataQuery.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters, PublicTableOrViewName, Row } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { buildServerSearchString, performClientPagination } from '@/hooks/database/search-utils';
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
  orderBy?: 'asc' | 'desc';
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

    // 2. Offline Fetcher (Optimized with Dexie filtering)
    const localQueryFn = useCallback(() => {
      // Dynamic access to localDb table
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const table = (localDb as any)[tableName] as Table<Row<T>, any>;
      if (!table) {
        console.error(`Table ${tableName} not found in localDb schema`);
        return Promise.resolve([]);
      }

      // Start with sorting
      let collection = table.orderBy(String(defaultSortField));
      if (orderBy === 'desc') {
        collection = collection.reverse();
      }

      // Apply Filtering at DB Level (before toArray)
      return collection
        .filter((item) => {
          let matches = true;

          // A. Search
          if (searchQuery && searchQuery.trim() !== '') {
            const lowerQuery = searchQuery.toLowerCase().trim();
            const matchesSearch = searchFields.some((field) => {
              const value = item[field];
              if (value === null || value === undefined) return false;
              return String(value).toLowerCase().includes(lowerQuery);
            });
            if (!matchesSearch) return false;
          }

          // B. Structured Filtering
          if (filterFn) {
            if (!filterFn(item, filters)) matches = false;
          } else {
            // Default generic filter logic (exact matches for basic keys)
            for (const [key, value] of Object.entries(filters)) {
              if (value && key !== 'or' && key !== 'sortBy') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const itemVal = (item as any)[key];
                // Handle boolean strings from selects
                if (value === 'true' && itemVal !== true) {
                  matches = false;
                  break;
                }
                if (value === 'false' && itemVal !== false) {
                  matches = false;
                  break;
                }
                if (value !== 'true' && value !== 'false' && String(itemVal) !== String(value)) {
                  matches = false;
                  break;
                }
              }
            }
          }

          return matches;
        })
        .toArray();
    }, [searchQuery, filters]); // Re-run Dexie query when filters change

    // 3. Local-First Query
    const {
      data: filteredData = [],
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
      localQueryDeps: [searchQuery, filters], // Pass deps to useLiveQuery
    });

    // 4. Processing (Sorting special cases & Pagination)
    // Note: Basic search/filter is now done in localQueryFn, but we still handle
    // complex sorts (like last_activity_at) and pagination here.
    const processedData = useMemo(() => {
      let finalData = filteredData;

      // Special handling for 'sortBy' filter if present (Client-side re-sort)
      // Dexie index sorting is limited to one key, so complex sorts happen here.
      if (
        filters.sortBy === 'last_activity' &&
        finalData.length > 0 &&
        'last_activity_at' in (finalData[0] as object)
      ) {
        finalData = [...finalData].sort((a, b) => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tA = new Date((a as any).last_activity_at || 0).getTime();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const tB = new Date((b as any).last_activity_at || 0).getTime();
          return tB - tA;
        });
      }

      // Stats
      const totalCount = finalData.length;
      let activeCount = totalCount;
      if (finalData.length > 0 && 'status' in (finalData[0] as object)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        activeCount = finalData.filter((i) => (i as any).status === true).length;
      }
      const inactiveCount = totalCount - activeCount;

      // Paginate
      const paginatedData = performClientPagination(finalData, currentPage, pageLimit);

      return {
        data: paginatedData,
        totalCount,
        activeCount,
        inactiveCount,
      };
    }, [filteredData, filters, currentPage, pageLimit]);

    return { ...processedData, isLoading, isFetching, error, refetch, networkStatus };
  };
}
