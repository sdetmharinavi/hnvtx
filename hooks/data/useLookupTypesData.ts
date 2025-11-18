// hooks/data/useLookupTypesData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { Lookup_typesRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';

/**
 * Implements the local-first data fetching strategy for the Lookup Types page.
 */
export const useLookupTypesData = (
  params: DataQueryHookParams
): DataQueryHookReturn<Lookup_typesRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // 1. Online Fetcher
  const onlineQueryFn = useCallback(async (): Promise<Lookup_typesRowSchema[]> => {
    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchQuery ? `(name.ilike.%${searchQuery}%,code.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%)` : undefined,
    });

    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'lookup_types', // Note: We query the base table here
      p_limit: 5000,
      p_offset: 0,
      p_filters: rpcFilters,
    });
    if (error) throw error;
    return (data as { data: Lookup_typesRowSchema[] })?.data || [];
  }, [searchQuery, filters]);

  // 2. Offline Fetcher
  const localQueryFn = useCallback(() => {
    return localDb.lookup_types.toArray();
  }, []);

  // 3. Use the local-first query hook
  const {
    data: allLookups = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'lookup_types'>({
    queryKey: ['lookup-types-data', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.lookup_types,
  });

  // 4. Client-side processing
  const processedData = useMemo(() => {
    if (!allLookups) {
      return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }
    
    let filtered = allLookups;

    // Filter by selected category (from the main filters object)
    if (filters.category) {
        filtered = filtered.filter(lookup => lookup.category === filters.category);
    }

    // Filter by search term
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(lookup => 
        lookup.name?.toLowerCase().includes(lowerQuery) ||
        lookup.code?.toLowerCase().includes(lowerQuery) ||
        lookup.description?.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Exclude the 'DEFAULT' entries from the main view
    filtered = filtered.filter(lookup => lookup.name !== 'DEFAULT');

    const totalCount = filtered.length;
    const activeCount = filtered.filter((l) => l.status === true).length;
    
    // Apply pagination
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
    };
  }, [allLookups, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};