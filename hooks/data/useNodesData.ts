// hooks/data/useNodesData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_nodes_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { buildRpcFilters } from '@/hooks/database'; // Using the standard helper
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
    
    // Construct the filters. 
    // We send a STRING for the 'or' clause, which is safer for existing backend functions.
    const rpcFilters = buildRpcFilters({ 
      ...filters, 
      or: searchQuery && searchQuery.trim() !== ''
        ? `(name.ilike.%${searchQuery}%,node_type_name.ilike.%${searchQuery}%,maintenance_area_name.ilike.%${searchQuery}%,node_type_code.ilike.%${searchQuery}%,remark.ilike.%${searchQuery}%)` 
        : undefined 
    });

    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_nodes_complete',
      p_limit: 5000, // Fetch all matching records to ensure client sorting/filtering works on full set
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'name',
    });

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any)?.data || [];
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

  // 4. Client-side processing (The Source of Truth for the UI)
  const processedData = useMemo(() => {
    if (!allNodes) {
        return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }

    let filtered = allNodes;
    
    // Robust Client-Side Filtering
    // We trim and lowercase once for performance
    const cleanSearch = (searchQuery || '').trim().toLowerCase();

    if (cleanSearch) {
        filtered = filtered.filter((node) => {
            // Helper to safely check inclusion against multiple fields
            const valuesToCheck = [
                node.name,
                node.node_type_name,
                node.maintenance_area_name,
                node.node_type_code,
                node.remark,
                node.latitude,
                node.longitude
            ];

            return valuesToCheck.some(val => 
                val !== null && 
                val !== undefined && 
                String(val).toLowerCase().includes(cleanSearch)
            );
        });
    }

    // Apply Dropdown Filters
    if (filters.node_type_id) {
        filtered = filtered.filter((node) => node.node_type_id === filters.node_type_id);
    }
    
    if (filters.status) {
         const statusBool = filters.status === 'true';
         filtered = filtered.filter((node) => node.status === statusBool);
    }

    // Sort alphabetically by name
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const totalCount = filtered.length;
    const activeCount = filtered.filter((n) => n.status === true).length;
    
    // Pagination Logic
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return { 
        data: paginatedData, 
        totalCount, 
        activeCount, 
        inactiveCount: totalCount - activeCount 
    };
  }, [allNodes, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};