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
  serverSearchFields?: string[];
  defaultSortField?: keyof Row<T>;
  filterFn?: FilterFunction<Row<T>>;
  rpcName?: string;
  rpcLimit?: number;
  orderBy?: 'asc' | 'desc';
  activeStatusField?: keyof Row<T> & string;
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
  } = options;

  return (params: DataQueryHookParams): DataQueryHookReturn<Row<T>> => {
    const { currentPage, pageLimit, filters, searchQuery } = params;
    const supabase = createClient();

    const actualServerSearchFields = useMemo(
      () => serverSearchFields || searchFields,
      [serverSearchFields, searchFields]
    );

    const onlineQueryFn = useCallback(async (): Promise<Row<T>[]> => {
      const searchString = buildServerSearchString(searchQuery, actualServerSearchFields);
      // Explicitly cast filters to Record<string, any> to allow 'or' property injection
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const queryFilters: Record<string, any> = { ...filters };
      if (searchString) {
        queryFilters.or = searchString;
      }

      // Remove client-side only filters if they exist (though buildRpcFilters handles most)
      if ('coordinates_status' in queryFilters) delete queryFilters.coordinates_status;
      if ('sortBy' in queryFilters) delete queryFilters.sortBy;

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

    const localQueryFn = useCallback(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const table = (localDb as any)[tableName] as Table<Row<T>, any>;
      if (!table) {
        console.error(`Table ${tableName} not found in localDb schema`);
        return Promise.resolve([]);
      }

      let collection = table.orderBy(String(defaultSortField));
      if (orderBy === 'desc') {
        collection = collection.reverse();
      }

      return collection
        .filter((item) => {
          let matches = true;

          // A. Search Logic
          if (searchQuery && searchQuery.trim() !== '') {
            const lowerQuery = searchQuery.toLowerCase().trim();
            const matchesSearch = searchFields.some((field) => {
              const value = item[field];
              if (value === null || value === undefined) return false;
              // Safe string conversion and check
              return String(value).toLowerCase().includes(lowerQuery);
            });
            
            if (!matchesSearch) {
              matches = false;
            }
          }

          if (!matches) return false;

          // B. Structured Filtering
          if (filterFn) {
            if (!filterFn(item, filters)) matches = false;
          } else {
            // Default generic filter logic
            for (const [key, value] of Object.entries(filters)) {
              if (value && key !== 'or' && key !== 'sortBy') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const itemVal = (item as any)[key];

                // Support Array Filtering in Offline Mode
                if (Array.isArray(value)) {
                  // If filter value is array, check if item value is IN that array
                  // We convert both to strings for safe comparison
                  if (!value.map(String).includes(String(itemVal))) {
                    matches = false;
                    break;
                  }
                } else {
                  // Standard single value check
                  if (value === 'true' && itemVal !== true) {
                    matches = false;
                    break;
                  }
                  if (value === 'false' && itemVal !== false) {
                    matches = false;
                    break;
                  }
                  if (
                    value !== 'true' &&
                    value !== 'false' &&
                    String(itemVal) !== String(value)
                  ) {
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
    }, [searchQuery, filters]);

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
      // Important: Ensure searchQuery is a dependency so useLiveQuery updates
      localQueryDeps: [searchQuery, filters],
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
    }, [filteredData, filters, currentPage, pageLimit, activeStatusField]);

    return { ...processedData, isLoading, isFetching, error, refetch, networkStatus };
  };
}