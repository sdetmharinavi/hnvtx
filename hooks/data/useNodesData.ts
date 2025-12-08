// hooks/data/useNodesData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_nodes_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';

/**
 * Implements the local-first data fetching strategy for the Nodes page.
 */
export const useNodesData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_nodes_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // 1. Online Fetcher
  const onlineQueryFn = useCallback(async (): Promise<V_nodes_completeRowSchema[]> => {

    // FIX: Removed 'maintenance_area_name' from search.
    // This prevents generic terms like "Transmission" (containing "mission") from matching every node.
    // We also construct the SQL string manually to allow casting numeric coords to text.
    let searchString: string | undefined;

    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.trim().replace(/'/g, "''"); // Basic sanitization

      searchString = `(` +
        `name ILIKE '%${term}%' OR ` +
        // `node_type_name ILIKE '%${term}%' OR ` +
        // maintenance_area_name ILIKE ... <-- REMOVED
        `node_type_code ILIKE '%${term}%' OR ` +
        `remark ILIKE '%${term}%' OR ` +
        `latitude::text ILIKE '%${term}%' OR ` +
        `longitude::text ILIKE '%${term}%'` +
      `)`;
    }

    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchString
    });

    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_nodes_complete',
      p_limit: 5000,
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
    const cleanSearch = (searchQuery || '').trim().toLowerCase();

    if (cleanSearch) {
        filtered = filtered.filter((node) => {
            // Helper to safely check inclusion against multiple fields
            const valuesToCheck = [
                node.name,
                // node.node_type_name,
                // node.maintenance_area_name, <-- REMOVED here as well
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
    
    if (filters.maintenance_terminal_id) {
        filtered = filtered.filter((node) => node.maintenance_terminal_id === filters.maintenance_terminal_id);
    }

    if (filters.status) {
         const statusBool = filters.status === 'true';
         filtered = filtered.filter((node) => node.status === statusBool);
    }

    // Sort alphabetically by name
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    const totalCount = filtered.length;
    const activeCount = filtered.filter((n) => n.status === true).length;
    const inactiveCount = totalCount - activeCount;

    // Pagination Logic
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return {
        data: paginatedData,
        totalCount,
        activeCount,
        inactiveCount
    };
  }, [allNodes, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};