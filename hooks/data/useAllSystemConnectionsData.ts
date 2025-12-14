// hooks/data/useAllSystemConnectionsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_system_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { DEFAULTS } from '@/constants/constants';

export const useAllSystemConnectionsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_system_connections_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // 1. Online Fetcher using Generic Pagination RPC
  const onlineQueryFn = useCallback(async (): Promise<V_system_connections_completeRowSchema[]> => {
    
    // Construct robust search string for SQL OR condition
    let searchString: string | undefined;
    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.trim().replace(/'/g, "''");
      searchString = `(` +
        `service_name ILIKE '%${term}%' OR ` +
        `system_name ILIKE '%${term}%' OR ` + 
        `connected_system_name ILIKE '%${term}%' OR ` +
        `bandwidth_allocated ILIKE '%${term}%' OR ` +
        `unique_id ILIKE '%${term}%' OR ` +
        `lc_id ILIKE '%${term}%'` +
      `)`;
    }

    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchString,
    });

    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_system_connections_complete',
      p_limit: DEFAULTS.PAGE_SIZE,
      p_offset: 0,
      p_filters: rpcFilters,
      // Sort by Service Name alphabetically
      p_order_by: 'service_name',
      p_order_dir: 'asc',
    });

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any)?.data || [];
  }, [searchQuery, filters]);

  // 2. Offline Fetcher (Dexie)
  const localQueryFn = useCallback(() => {
    // THE FIX: Use toArray() to fetch all records.
    // We do NOT use orderBy('service_name') here because records with null service_name
    // would be excluded by Dexie, and we sort properly in memory later anyway.
    return localDb.v_system_connections_complete.toArray();
  }, []);

  // 3. Local-First Query Execution
  const {
    data: allConnections = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'v_system_connections_complete'>({
    queryKey: ['all-system-connections', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_system_connections_complete,
  });

  // 4. Client-Side Processing (Filtering, Sorting, Pagination)
  const processedData = useMemo(() => {
    if (!allConnections) {
      return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }

    let filtered = allConnections;

    // Search Logic
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((conn) =>
        conn.service_name?.toLowerCase().includes(lowerQuery) ||
        conn.system_name?.toLowerCase().includes(lowerQuery) ||
        conn.connected_system_name?.toLowerCase().includes(lowerQuery) ||
        conn.bandwidth_allocated?.toLowerCase().includes(lowerQuery) ||
        conn.unique_id?.toLowerCase().includes(lowerQuery) ||
        conn.lc_id?.toLowerCase().includes(lowerQuery)
      );
    }

    // Filter Logic
    if (filters.media_type_id) {
        filtered = filtered.filter(c => c.media_type_id === filters.media_type_id);
    }
    if (filters.connected_link_type_id) {
        filtered = filtered.filter(c => c.connected_link_type_id === filters.connected_link_type_id);
    }
    if (filters.status) {
        const statusBool = filters.status === 'true';
        filtered = filtered.filter(c => c.status === statusBool);
    }

    // Robust sorting by Service Name -> System Name
    filtered.sort((a, b) => {
      const nameA = a.service_name || a.system_name || '';
      const nameB = b.service_name || b.system_name || '';
      return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
    });

    const totalCount = filtered.length;
    const activeCount = filtered.filter((c) => !!c.status).length;
    const inactiveCount = totalCount - activeCount;

    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount
    };
  }, [allConnections, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};