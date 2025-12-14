// hooks/data/useSystemsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';

export const useSystemsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_systems_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // 1. Online Fetcher
  const onlineQueryFn = useCallback(async (): Promise<V_systems_completeRowSchema[]> => {
    
    // FIX: Construct proper SQL string for search
    let searchString: string | undefined;

    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.trim().replace(/'/g, "''");
      
      searchString = `(` +
        `system_name ILIKE '%${term}%' OR ` +
        `system_type_name ILIKE '%${term}%' OR ` +
        `node_name ILIKE '%${term}%' OR ` +
        `ip_address::text ILIKE '%${term}%' OR ` + // Cast INET to text
        `make ILIKE '%${term}%' OR ` +
        `s_no ILIKE '%${term}%'` +
      `)`;
    }

    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchString,
    });
    
    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_systems_complete',
      p_limit: 5000, 
      p_offset: 0,
      p_filters: rpcFilters,
      // THE FIX: Explicit ascending sort
      p_order_by: 'system_name',
      p_order_dir: 'asc'
    });
    if (error) throw error;
    return (data as { data: V_systems_completeRowSchema[] })?.data || [];
  }, [searchQuery, filters]);

  // 2. Offline Fetcher
  const localQueryFn = useCallback(() => {
    return localDb.v_systems_complete.orderBy('system_name').toArray();
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

  // 4. Client-side processing
  const processedData = useMemo(() => {
    if (!allSystems) {
        return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }

    let filtered = allSystems;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (system) =>
          system.system_name?.toLowerCase().includes(lowerQuery) ||
          system.system_type_name?.toLowerCase().includes(lowerQuery) ||
          system.node_name?.toLowerCase().includes(lowerQuery) ||
          String(system.ip_address)?.split('/')[0].toLowerCase().includes(lowerQuery) ||
          system.make?.toLowerCase().includes(lowerQuery) ||
          system.s_no?.toLowerCase().includes(lowerQuery)
      );
    }
    if (filters.system_type_name) {
      filtered = filtered.filter(
        (system) =>
          system.system_type_name === filters.system_type_name
      );
    }
    if (filters.system_capacity_name) {
      filtered = filtered.filter(
        (system) =>
          system.system_capacity_name === filters.system_capacity_name
      );
    }
    if (filters.status) {
      filtered = filtered.filter(
        (system) => system.status === (filters.status === "true")
      );
    }

    filtered.sort((a, b) =>
      (a.system_name || '').localeCompare(b.system_name || '', undefined, {
        numeric: true,
        sensitivity: 'base'
      })
    );

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