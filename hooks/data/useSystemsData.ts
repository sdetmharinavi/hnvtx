// hooks/data/useSystemsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import {
  buildServerSearchString,
  performClientSearch,
  performClientSort,
  performClientPagination
} from '@/hooks/database/search-utils';

export const useSystemsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_systems_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // Configuration for Search
  const searchFields = [
    'system_name',
    'system_type_name',
    'node_name',
    'make',
    's_no',
    'ip_address' 
  ] as (keyof V_systems_completeRowSchema)[];

  // For server-side, we need to handle specific casts manually or pass strings
  const serverSearchFields = useMemo(() => [
    'system_name',
    'system_type_name',
    'node_name',
    'ip_address::text', // Special cast for INET
    'make',
    's_no'
  ], []);

  // 1. Online Fetcher
  const onlineQueryFn = useCallback(async (): Promise<V_systems_completeRowSchema[]> => {
    const searchString = buildServerSearchString(searchQuery, serverSearchFields);

    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchString,
    });

    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_systems_complete',
      p_limit: 5000,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'system_name',
      p_order_dir: 'asc'
    });
    if (error) throw error;
    return (data as { data: V_systems_completeRowSchema[] })?.data || [];
  }, [searchQuery, filters, serverSearchFields]);

  // 2. Offline Fetcher
  const localQueryFn = useCallback(() => {
    return localDb.v_systems_complete.orderBy('system_name').toArray();
  }, []);

  // 3. Local-First Query
  const {
    data: allSystems = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'v_systems_complete'>({
    queryKey: ['systems-data', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_systems_complete,
  });

  // 4. Client-side Processing (Unified Logic)
  const processedData = useMemo(() => {
    let filtered = allSystems || [];

    // Search
    if (searchQuery) {
        filtered = performClientSearch(filtered, searchQuery, searchFields);
    }

    // Explicit Filters (FIXED: Using ID matching)
    if (filters.system_type_id) {
      filtered = filtered.filter(s => s.system_type_id === filters.system_type_id);
    }
    if (filters.system_capacity_id) {
      filtered = filtered.filter(s => s.system_capacity_id === filters.system_capacity_id);
    }
    if (filters.status) {
      filtered = filtered.filter(s => String(s.status) === filters.status);
    }

    // Sort
    filtered = performClientSort(filtered, 'system_name');

    // Stats
    const totalCount = filtered.length;
    const activeCount = filtered.filter((s) => s.status === true).length;
    const inactiveCount = totalCount - activeCount;

    // Paginate
    const paginatedData = performClientPagination(filtered, currentPage, pageLimit);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSystems, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};