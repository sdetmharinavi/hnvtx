// hooks/data/useLookupTypesData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { Lookup_typesRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';

export const useLookupTypesData = (
  params: DataQueryHookParams
): DataQueryHookReturn<Lookup_typesRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  const onlineQueryFn = useCallback(async (): Promise<Lookup_typesRowSchema[]> => {
    
    // FIX: Use standard SQL syntax
    let searchString: string | undefined;
    if (searchQuery && searchQuery.trim() !== '') {
        const term = searchQuery.trim().replace(/'/g, "''");
        searchString = `(` +
          `name ILIKE '%${term}%' OR ` +
          `code ILIKE '%${term}%' OR ` +
          `description ILIKE '%${term}%'` +
        `)`;
    }

    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchString,
    });

    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'lookup_types',
      p_limit: 5000,
      p_offset: 0,
      p_filters: rpcFilters,
      // Default DB sort
      p_order_by: 'sort_order', 
      p_order_dir: 'asc',
    });
    if (error) throw error;
    return (data as { data: Lookup_typesRowSchema[] })?.data || [];
  }, [searchQuery, filters]);

  const localQueryFn = useCallback(() => {
    return localDb.lookup_types.toArray();
  }, []);

  const {
    data: allLookups = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'lookup_types'>({
    queryKey: ['lookup_types-data', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.lookup_types,
  });

  const processedData = useMemo(() => {
    if (!allLookups) {
      return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }

    let filtered = allLookups;

    if (filters.category) {
        filtered = filtered.filter(lookup => lookup.category === filters.category);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(lookup =>
        lookup.name?.toLowerCase().includes(lowerQuery) ||
        lookup.code?.toLowerCase().includes(lowerQuery) ||
        lookup.description?.toLowerCase().includes(lowerQuery)
      );
    }

    // Explicitly hide 'DEFAULT' placeholder entries if they exist
    filtered = filtered.filter(lookup => lookup.name !== 'DEFAULT');

    // SORTING: Priority 1: Sort Order, Priority 2: Name
    filtered.sort((a, b) => {
        const orderDiff = (a.sort_order ?? 0) - (b.sort_order ?? 0);
        if (orderDiff !== 0) return orderDiff;
        return (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' });
    });

    const totalCount = filtered.length;
    const activeCount = filtered.filter((l) => l.status === true).length;

    // Pagination
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