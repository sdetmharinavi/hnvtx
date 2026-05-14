// hooks/data/useGenericDataQuery.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters, PublicTableOrViewName, Row } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import {
  buildServerSearchString,
  performClientPagination,
  performClientSort
} from '@/hooks/database/search-utils';
import { Table, Collection } from 'dexie';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type FilterFunction<T> = (item: T, filters: Record<string, any>) => boolean;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LocalCollectionFactory<T> = (table: Table<T, any>) => Collection<T, any> | Table<T, any>;

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
  /**
   * Optional: Provide a function to start the Dexie query chain (e.g., use an Index).
   * Must return a Collection or Table. Do not call .toArray() or .sortBy() here.
   */
  getLocalCollection?: LocalCollectionFactory<Row<T>>;
  /**
   * Optional: Base filters to always apply to the RPC call (e.g., { system_id: '...' }).
   */
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
    getLocalCollection,
    baseFilters = {},
  } = options;

  return (params: DataQueryHookParams): DataQueryHookReturn<Row<T>> => {
    const { currentPage, pageLimit, filters, searchQuery } = params;
    const supabase = createClient();

    // Determine if we are in "Search Mode"
    const isSearching = !!(searchQuery && searchQuery.trim().length > 0);

    const actualServerSearchFields = useMemo(
      () => serverSearchFields || searchFields,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [serverSearchFields, searchFields]
    );

    const onlineQueryFn = useCallback(async (): Promise<Row<T>[]> => {
      const searchString = buildServerSearchString(searchQuery, actualServerSearchFields);

      // Merge baseFilters with UI filters
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const queryFilters: Record<string, any> = { ...baseFilters, ...filters };

      if (searchString) {
        queryFilters.or = searchString;
      }

      // Remove client-side only filters
      if ('coordinates_status' in queryFilters) delete queryFilters.coordinates_status;
      if ('sortBy' in queryFilters) delete queryFilters.sortBy;
      // OFC specific client-filters
      if ('allocation_status' in queryFilters) delete queryFilters.allocation_status;

      const rpcFilters = buildRpcFilters(queryFilters);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await supabase.rpc(rpcName as any, {
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
      return (data as any)?.data || [];
    }, [searchQuery, filters, actualServerSearchFields, supabase]);

    const localQueryFn = useCallback(async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const table = (localDb as any)[tableName] as Table<Row<T>, any>;
      if (!table) {
        console.error(`Table ${tableName} not found in localDb schema`);
        return Promise.resolve([]);
      }

      // 1. Get Initial Collection (Filtered by index if provided, or default order)
      // Note: If getLocalCollection is NOT provided, we use orderBy to leverage DB sort.
      // If it IS provided (e.g. where('ofc_id')), we lose the sort, so we must sort in memory later.
      const collection = getLocalCollection
        ? getLocalCollection(table)
        : table.orderBy(String(defaultSortField));

      let dbResults = await collection
        .filter((item) => {
          let matches = true;

          // A. Search Logic (Offline fallback)
          if (searchQuery && searchQuery.trim() !== '') {
            const lowerQuery = searchQuery.toLowerCase().trim();
            const matchesSearch = searchFields.some((field) => {
              const value = item[field];
              if (value === null || value === undefined) return false;
              return String(value).toLowerCase().includes(lowerQuery);
            });
            if (!matchesSearch) matches = false;
          }

          if (!matches) return false;

          // B. Structured Filtering
          if (filterFn) {
            if (!filterFn(item, filters)) matches = false;
          } else {
            for (const [key, value] of Object.entries(filters)) {
              // Skip special keys or keys managed by baseFilters/getLocalCollection
              if (value && key !== 'or' && key !== 'sortBy' && key !== 'allocation_status') {
                 // Skip base filters if they are already handled by getLocalCollection
                 if (baseFilters && key in baseFilters) continue;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const itemVal = (item as any)[key];
                if (Array.isArray(value)) {
                  if (!value.map(String).includes(String(itemVal))) {
                    matches = false;
                    break;
                  }
                } else {
                  if (
                    value !== 'true' &&
                    value !== 'false' &&
                    String(itemVal) !== String(value)
                  ) {
                    matches = false;
                    break;
                  }
                  if (value === 'true' && itemVal !== true) {
                    matches = false;
                    break;
                  }
                  if (value === 'false' && itemVal !== false) {
                    matches = false;
                    break;
                  }
                }
              }
            }
          }
          return matches;
        })
        .toArray();

        // 2. Explicit In-Memory Sort
        // This ensures correct ordering even if getLocalCollection used a non-sorting index
        if (defaultSortField) {
           dbResults = performClientSort(dbResults, defaultSortField, orderBy);
        }

        return dbResults;

    }, [searchQuery, filters]);

    const {
      data: filteredData = [],
      isLoading,
      isFetching,
      error,
      refetch,
      networkStatus,
    } = useLocalFirstQuery<T>({
      queryKey: [`${tableName}-data`, searchQuery, filters, baseFilters],
      onlineQueryFn,
      localQueryFn,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      dexieTable: (localDb as any)[tableName],
      localQueryDeps: [searchQuery, filters, baseFilters],
      // OPTIMIZATION: If we are searching, prefer network data and skip DB sync to avoid lag
      preferNetwork: isSearching,
      skipSync: isSearching,
      autoSync: true, // Allow standard sync when not searching
    });

    const processedData = useMemo(() => {
      let finalData = filteredData;

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

      const totalCount = finalData.length;
      let activeCount = totalCount;
      if (finalData.length > 0 && activeStatusField in (finalData[0] as object)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        activeCount = finalData.filter((i) => (i as any)[activeStatusField] === true).length;
      }
      const inactiveCount = totalCount - activeCount;

      const paginatedData = performClientPagination(finalData, currentPage, pageLimit);

      return {
        data: paginatedData,
        totalCount,
        activeCount,
        inactiveCount,
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filteredData, filters, currentPage, pageLimit, activeStatusField]);

    return { ...processedData, isLoading, isFetching, error, refetch, networkStatus };
  };
}