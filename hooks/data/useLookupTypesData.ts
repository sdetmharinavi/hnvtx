// hooks/data/useLookupTypesData.ts
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { Lookup_typesRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { buildRpcFilters } from '@/hooks/database';
import {
  buildServerSearchString,
  performClientSearch,
  performClientPagination,
} from '@/hooks/database/search-utils';

export const useLookupTypesData = (
  params: DataQueryHookParams
): DataQueryHookReturn<Lookup_typesRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();

  // Search Config
  const searchFields = useMemo(
    () => ['name', 'code', 'description'] as (keyof Lookup_typesRowSchema)[],
    []
  );
  
  // For lookups, we generally search the same fields on server and client
  const serverSearchFields = useMemo(() => [...searchFields], [searchFields]);

  const {
    data: allLookups = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['lookup_types-data', searchQuery, filters],
    queryFn: async (): Promise<Lookup_typesRowSchema[]> => {
      // 1. Build Search String for RPC
      const searchString = buildServerSearchString(searchQuery, serverSearchFields);

      // 2. Build Filters
      // Note: We use 'get_paged_data' with a high limit (5000) to fetch all lookups 
      // and perform detailed filtering/sorting on the client if necessary, 
      // or rely on RPC filters for basic needs.
      const rpcFilters = buildRpcFilters({
        ...filters,
        or: searchString,
      });

      const { data, error } = await supabase.rpc('get_paged_data', {
        p_view_name: 'lookup_types', // Can also use 'v_lookup_types' if view exists
        p_limit: 5000,
        p_offset: 0,
        p_filters: rpcFilters,
        p_order_by: 'sort_order',
        p_order_dir: 'asc',
      });

      if (error) throw error;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data as any)?.data || []) as Lookup_typesRowSchema[];
    },
    // Keep data fresh for 1 hour since lookup types rarely change during a session.
    // This replaces the need for a local database.
    staleTime: 1000 * 60 * 60, 
    refetchOnWindowFocus: false,
  });

  const processedData = useMemo(() => {
    if (!allLookups) {
      return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }

    let filtered = allLookups;

    // 1. Client-Side Search Refinement (Optional, adds responsiveness)
    filtered = performClientSearch(filtered, searchQuery, searchFields);

    // 2. Client-Side Filters
    // (RPC handles most, but we ensure specific logic here if needed)
    if (filters.category) {
      filtered = filtered.filter((lookup) => lookup.category === filters.category);
    }

    // Hide DEFAULT placeholder from UI
    filtered = filtered.filter((lookup) => lookup.name !== 'DEFAULT');

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
  }, [allLookups, searchQuery, filters, currentPage, pageLimit, searchFields]);

  return { 
    ...processedData, 
    isLoading, 
    isFetching, 
    error, 
    refetch 
  };
};