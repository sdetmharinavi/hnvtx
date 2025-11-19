// hooks/data/useOfcConnectionsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_ofc_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';

/**
 * Implements the local-first data fetching strategy for OFC Connections.
 * Filters by cable ID and performs client-side search.
 */
export const useOfcConnectionsData = (
  cableId: string | null
) => {
  // Wrapped in a factory function to be used by useCrudManager
  return function useData(params: DataQueryHookParams): DataQueryHookReturn<V_ofc_connections_completeRowSchema> {
    const { currentPage, pageLimit, filters, searchQuery } = params;
    
    const onlineQueryFn = useCallback(async (): Promise<V_ofc_connections_completeRowSchema[]> => {
      if (!cableId) return [];

      const rpcFilters = buildRpcFilters({
        ...filters,
        ofc_id: cableId,
        or: searchQuery
          ? `(system_name.ilike.%${searchQuery}%,connection_type.ilike.%${searchQuery}%,customer_name.ilike.%${searchQuery}%)`
          : undefined,
      });

      const { data, error } = await createClient().rpc('get_paged_data', {
        p_view_name: 'v_ofc_connections_complete',
        p_limit: 5000,
        p_offset: 0,
        p_filters: rpcFilters,
        p_order_by: 'fiber_no_sn',
        p_order_dir: 'asc',
      });

      if (error) throw error;
      return (data as { data: V_ofc_connections_completeRowSchema[] })?.data || [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, filters, cableId]);

    const localQueryFn = useCallback(() => {
      if (!cableId) {
        // THE FIX: Return a valid Dexie PromiseExtended that resolves to an empty array
        return localDb.v_ofc_connections_complete.limit(0).toArray();
      }
      return localDb.v_ofc_connections_complete.where('ofc_id').equals(cableId).toArray();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cableId]);

    // THE FIX: Explicitly pass the Row Schema type to the hook
    const {
      data: allConnections = [],
      isLoading,
      isFetching,
      error,
      refetch,
    } = useLocalFirstQuery<'v_ofc_connections_complete', V_ofc_connections_completeRowSchema>({
      queryKey: ['ofc-connections-data', cableId, searchQuery, filters],
      onlineQueryFn,
      localQueryFn,
      dexieTable: localDb.v_ofc_connections_complete,
      localQueryDeps: [cableId], 
    });

    const processedData = useMemo(() => {
      if (!allConnections || !cableId) {
        return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
      }

      let filtered = allConnections;
      
      // Client-side filtering
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter((conn) =>
          conn.system_name?.toLowerCase().includes(lowerQuery) ||
          conn.connection_type?.toLowerCase().includes(lowerQuery)
        );
      }
      
      // Default sort by fiber number
      filtered.sort((a, b) => (a.fiber_no_sn || 0) - (b.fiber_no_sn || 0));

      const totalCount = filtered.length;
      // THE FIX: Use loose comparison or boolean conversion if status might be null/undefined
      const activeCount = filtered.filter((c) => !!c.status).length;
      const start = (currentPage - 1) * pageLimit;
      const end = start + pageLimit;
      const paginatedData = filtered.slice(start, end);

      return {
        data: paginatedData,
        totalCount,
        activeCount,
        inactiveCount: totalCount - activeCount,
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allConnections, searchQuery, currentPage, pageLimit, cableId]);

    return { ...processedData, isLoading, isFetching, error, refetch };
  };
};