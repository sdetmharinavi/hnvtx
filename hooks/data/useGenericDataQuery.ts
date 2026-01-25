// path: hooks/data/useGenericDataQuery.ts
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
  // THE FIX: Add a field to specify the status column
  activeStatusField?: keyof Row<T> & string;
}

export function createGenericDataQuery<T extends PublicTableOrViewName>(
  options: GenericDataQueryOptions<T>,
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
    // THE FIX: Default to 'status' for backward compatibility
    activeStatusField = 'status' as keyof Row<T> & string,
  } = options;

  return (params: DataQueryHookParams): DataQueryHookReturn<Row<T>> => {
    const { currentPage, pageLimit, filters, searchQuery } = params;
    const supabase = createClient();

    const actualServerSearchFields = useMemo(
      () => serverSearchFields || searchFields,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [serverSearchFields, searchFields],
    );

    const onlineQueryFn = useCallback(async (): Promise<Row<T>[]> => {
      const searchString = buildServerSearchString(searchQuery, actualServerSearchFields);
      const rpcFilters = buildRpcFilters({
        ...filters,
        or: searchString,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as Record<string, any>;

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
        // THE FIX: Pass the status column name to the RPC
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

          if (searchQuery && searchQuery.trim() !== '') {
            const lowerQuery = searchQuery.toLowerCase().trim();
            const matchesSearch = searchFields.some((field) => {
              const value = item[field];
              if (value === null || value === undefined) return false;
              return String(value).toLowerCase().includes(lowerQuery);
            });
            if (!matchesSearch) return false;
          }

          if (filterFn) {
            if (!filterFn(item, filters)) matches = false;
          } else {
            for (const [key, value] of Object.entries(filters)) {
              if (value && key !== 'or' && key !== 'sortBy') {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const itemVal = (item as any)[key];
                if (key === 'status') {
                  if (String(itemVal) !== String(value)) {
                    matches = false;
                    break;
                  }
                } else if (String(itemVal) !== String(value)) {
                  matches = false;
                  break;
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
        // THE FIX: Use the dynamic activeStatusField for client-side counting
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
