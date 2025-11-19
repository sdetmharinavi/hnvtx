// hooks/data/useNodesData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_nodes_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { localDb } from '@/hooks/data/localDb';

/**
 * Implements the local-first data fetching strategy for the Nodes page.
 */
export const useNodesData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_nodes_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // 1. Online Fetcher
  const onlineQueryFn = useCallback(async (): Promise<V_nodes_completeRowSchema[]> => {
    const rpcFilters = buildRpcFilters({ 
      ...filters, 
      or: searchQuery 
        ? `(name.ilike.%${searchQuery}%,node_type_name.ilike.%${searchQuery}%,maintenance_area_name.ilike.%${searchQuery}%,latitude::text.ilike.%${searchQuery}%,longitude::text.ilike.%${searchQuery}%,node_type_code.ilike.%${searchQuery}%)` 
        : undefined 
    });
    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_nodes_complete',
      p_limit: 5000, // Fetch all matching records
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'name',
    });
    if (error) throw error;
    return (data as { data: V_nodes_completeRowSchema[] })?.data || [];
  }, [searchQuery, filters]);

  // 2. Offline Fetcher
  const localQueryFn = useCallback(() => {
    return localDb.v_nodes_complete.toArray();
  }, []);

  // 3. Use the local-first query hook
  const {
    data: allNodes = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'v_nodes_complete'>({
    queryKey: ['nodes-data', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_nodes_complete,
  });

  // 4. Client-side processing (filtering and pagination)
  const processedData = useMemo(() => {
    if (!allNodes) {
        return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }

    let filtered = allNodes;
    if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        // THE FIX: The client-side filter now mirrors the server-side `or` filter.
        filtered = filtered.filter((node) =>
            node.name?.toLowerCase().includes(lowerQuery) ||
            node.node_type_name?.toLowerCase().includes(lowerQuery) ||
            node.maintenance_area_name?.toLowerCase().includes(lowerQuery) ||
            String(node.latitude).toLowerCase().includes(lowerQuery) ||
            String(node.longitude).toLowerCase().includes(lowerQuery) ||
            node.node_type_code?.toLowerCase().includes(lowerQuery)
        );
    }
    if (filters.node_type_id) {
        filtered = filtered.filter((node) => node.node_type_id === filters.node_type_id);
    }

    const totalCount = filtered.length;
    const activeCount = filtered.filter((n) => n.status === true).length;
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return { data: paginatedData, totalCount, activeCount, inactiveCount: totalCount - activeCount };
  }, [allNodes, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};