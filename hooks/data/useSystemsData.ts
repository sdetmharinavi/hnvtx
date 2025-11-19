// hooks/data/useSystemsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';

/**
 * Implements the local-first data fetching strategy for the Systems page.
 */
export const useSystemsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_systems_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // 1. Online Fetcher
  const onlineQueryFn = useCallback(async (): Promise<V_systems_completeRowSchema[]> => {
    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchQuery
        ? `(system_name.ilike.%${searchQuery}%,system_type_name.ilike.%${searchQuery}%,node_name.ilike.%${searchQuery}%,ip_address::text.ilike.%${searchQuery}%)`
        : undefined,
    });
    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_systems_complete',
      p_limit: 5000, // Fetch all matching for client-side processing
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'system_name',
    });
    if (error) throw error;
    return (data as { data: V_systems_completeRowSchema[] })?.data || [];
  }, [searchQuery, filters]);

  // 2. Offline Fetcher
  const localQueryFn = useCallback(() => {
    return localDb.v_systems_complete.toArray();
  }, []);

  // 3. Use the local-first query hook
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

  // 4. Client-side processing (filtering and pagination)
  const processedData = useMemo(() => {
    if (!allSystems) {
        return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }
    
    let filtered = allSystems;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      // THE FIX: This client-side filter now mirrors the server-side search logic.
      filtered = filtered.filter(
        (system) =>
          system.system_name?.toLowerCase().includes(lowerQuery) ||
          system.system_type_name?.toLowerCase().includes(lowerQuery) ||
          system.node_name?.toLowerCase().includes(lowerQuery) ||
          String(system.ip_address)?.toLowerCase().includes(lowerQuery)
      );
    }
    if (filters.system_type_name) {
      filtered = filtered.filter(
        (system) =>
          system.system_type_name === filters.system_type_name
      );
    }
    if (filters.status) {
      filtered = filtered.filter(
        (system) => system.status === (filters.status === "true")
      );
    }

    const totalCount = filtered.length;
    const activeCount = filtered.filter((s) => s.status === true).length;
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
    };
  }, [allSystems, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};