// hooks/data/useLookupTypesData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { Lookup_typesRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { 
  buildServerSearchString, 
  performClientSearch, 
  performClientPagination 
} from '@/hooks/database/search-utils';

export const useLookupTypesData = (
  params: DataQueryHookParams
): DataQueryHookReturn<Lookup_typesRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // Search Config
  const searchFields = useMemo(
    () => ['name', 'code', 'description'] as (keyof Lookup_typesRowSchema)[],
    []
  );
  const serverSearchFields = useMemo(() => [...searchFields], [searchFields]);

  const onlineQueryFn = useCallback(async (): Promise<Lookup_typesRowSchema[]> => {
    const searchString = buildServerSearchString(searchQuery, serverSearchFields);
    
    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchString,
    });

    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'lookup_types',
      p_limit: 5000,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'sort_order', 
      p_order_dir: 'asc',
    });
    if (error) throw error;
    return (data as { data: Lookup_typesRowSchema[] })?.data || [];
  }, [searchQuery, filters, serverSearchFields]);

  const localQueryFn = useCallback(() => {
    return localDb.lookup_types.orderBy('sort_order').toArray();
  }, []);

  const {
    data: allLookups = [],
    isLoading,
    isFetching,
    error,
    refetch,
    networkStatus
  } = useLocalFirstQuery<'lookup_types'>({
    queryKey: ['lookup_types-data', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.lookup_types,
    // Explicitly disable auto-sync to rely on manual refresh
    autoSync: false 
  });

  const processedData = useMemo(() => {
    if (!allLookups) {
      return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }

    let filtered = allLookups;

    // 1. Search
    filtered = performClientSearch(filtered, searchQuery, searchFields);

    // 2. Filters
    if (filters.category) {
        filtered = filtered.filter(lookup => lookup.category === filters.category);
    }

    // Hide DEFAULT placeholder
    filtered = filtered.filter(lookup => lookup.name !== 'DEFAULT');

    // 3. Sort (Priority: Sort Order, then Name)
    filtered.sort((a, b) => {
        const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
    });

    const totalCount = filtered.length;
    const activeCount = filtered.filter((l) => l.status === true).length;
    const inactiveCount = totalCount - activeCount;

    // 4. Paginate
    const paginatedData = performClientPagination(filtered, currentPage, pageLimit);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLookups, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch, networkStatus };
};