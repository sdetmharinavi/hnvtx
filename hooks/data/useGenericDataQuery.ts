// hooks/data/useGenericDataQuery.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters, PublicTableOrViewName, Row, Filters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import {
  buildServerSearchString,
  performClientPagination,
  performClientSort,
  performClientSearch
} from '@/hooks/database/search-utils';
import { Table, Collection } from 'dexie';

interface GenericDataQueryOptions<T extends PublicTableOrViewName> {
  tableName: T;
  searchFields: (keyof Row<T> & string)[];
  serverSearchFields?: string[];
  defaultSortField: keyof Row<T> & string;
  rpcLimit?: number;
  orderBy?: 'asc' | 'desc';
  activeStatusField?: keyof Row<T> & string;
  baseFilters?: Filters;
  getLocalCollection?: (table: Table<Row<T>, string | number>) => Collection<Row<T>, string | number> | Table<Row<T>, string | number>;
  filterFn?: (item: Row<T>, filters: Record<string, unknown>) => boolean;
}

export function createGenericDataQuery<T extends PublicTableOrViewName>(
  options: GenericDataQueryOptions<T>
) {
  const {
    tableName,
    searchFields,
    serverSearchFields,
    defaultSortField,
    rpcLimit = 5000,
    orderBy = 'asc',
    activeStatusField = 'status' as keyof Row<T> & string,
    baseFilters = {},
    getLocalCollection,
    filterFn
  } = options;

  return (params: DataQueryHookParams): DataQueryHookReturn<Row<T>> => {
    const { currentPage, pageLimit, filters, searchQuery } = params;
    const supabase = createClient();

    const actualServerSearchFields = useMemo(
      () => serverSearchFields || searchFields,
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [serverSearchFields, searchFields]
    );

    const onlineQueryFn = useCallback(async (): Promise<Row<T>[]> => {
      const searchString = buildServerSearchString(searchQuery, actualServerSearchFields);
      const queryFilters = { ...filters, ...baseFilters };

      if (searchString) {
        queryFilters.or = searchString;
      }

      const { data, error } = await supabase.rpc('get_paged_data', {
        p_view_name: tableName,
        p_limit: rpcLimit,
        p_offset: 0,
        p_filters: buildRpcFilters(queryFilters),
        p_order_by: defaultSortField,
        p_order_dir: orderBy,
      });

      if (error) throw error;
      const response = data as { data: Row<T>[] };
      return response.data ||[];
    }, [searchQuery, filters, actualServerSearchFields, supabase]);

    const localQueryFn = useCallback(async () => {
      const table = (localDb as unknown as Record<string, Table<Row<T>, string | number>>)[tableName];
      
      const dbResults = getLocalCollection ? await getLocalCollection(table).toArray() : await table.toArray();
      
      // 1. Search
      let filtered = performClientSearch(dbResults, searchQuery, searchFields);

      // 2. Filters
      filtered = filtered.filter((item) => {
        // Base filters first
        for (const[key, value] of Object.entries(baseFilters)) {
            if (String(item[key as keyof Row<T>]) !== String(value)) return false;
        }
        
        // Custom filter function
        if (filterFn && !filterFn(item, filters)) return false;

        // General exact match filters (if no custom filterFn handled it)
        if (!filterFn) {
            for (const [key, value] of Object.entries(filters)) {
                if (!value || key === 'or') continue;
                if (String(item[key as keyof Row<T>]) !== String(value)) return false;
            }
        }
        return true;
      });

      // 3. Sort
      return performClientSort(filtered, defaultSortField, orderBy);
    }, [searchQuery, filters]);

    const {
      data: filteredData =[],
      isLoading,
      isFetching,
      error,
      refetch,
    } = useLocalFirstQuery<T>({
      queryKey:[tableName, searchQuery, filters],
      onlineQueryFn,
      localQueryFn,
      dexieTable: (localDb as unknown as Record<string, Table<Row<T>, string | number>>)[tableName],
      localQueryDeps: [searchQuery, filters],
    });

    const processedData = useMemo(() => {
      const totalCount = filteredData.length;
      const activeCount = filteredData.filter((i) => (i as Record<string, unknown>)[activeStatusField] === true).length;
      const paginatedData = performClientPagination(filteredData, currentPage, pageLimit);

      return {
        data: paginatedData,
        totalCount,
        activeCount,
        inactiveCount: totalCount - activeCount,
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },[filteredData, currentPage, pageLimit, activeStatusField]);

    return { ...processedData, isLoading, isFetching, error, refetch };
  };
}