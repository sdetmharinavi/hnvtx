// hooks/data/useSystemConnectionsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_system_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';

/**
 * Implements the local-first data fetching strategy for System Connections.
 * Filters by system ID and performs client-side search.
 */
export const useSystemConnectionsData = (
  systemId: string | null
) => {
  // Wrapped in a factory function to be used by useCrudManager
  return function useData(params: DataQueryHookParams): DataQueryHookReturn<V_system_connections_completeRowSchema> {
    const { currentPage, pageLimit, filters, searchQuery } = params;
    
    const onlineQueryFn = useCallback(async (): Promise<V_system_connections_completeRowSchema[]> => {
      if (!systemId) return [];

      const rpcFilters = buildRpcFilters({
        ...filters,
        system_id: systemId,
        or: searchQuery
          ? `(customer_name.ilike.%${searchQuery}%,connected_system_name.ilike.%${searchQuery}%)`
          : undefined,
      });

      const { data, error } = await createClient().rpc('get_paged_data', {
        p_view_name: 'v_system_connections_complete',
        p_limit: 5000,
        p_offset: 0,
        p_filters: rpcFilters,
        p_order_by: 'created_at', // Default sort
        p_order_dir: 'desc',
      });

      if (error) throw error;
      return (data as { data: V_system_connections_completeRowSchema[] })?.data || [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, filters, systemId]);

    const localQueryFn = useCallback(() => {
      if (!systemId) {
        // Return valid PromiseExtended for empty result
        return localDb.v_system_connections_complete.limit(0).toArray();
      }
      return localDb.v_system_connections_complete.where('system_id').equals(systemId).toArray();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [systemId]);

    const {
      data: allConnections = [],
      isLoading,
      isFetching,
      error,
      refetch,
    } = useLocalFirstQuery<'v_system_connections_complete', V_system_connections_completeRowSchema>({
      queryKey: ['system_connections-data', systemId, searchQuery, filters],
      onlineQueryFn,
      localQueryFn,
      dexieTable: localDb.v_system_connections_complete,
      localQueryDeps: [systemId], 
    });

    const processedData = useMemo(() => {
      if (!allConnections || !systemId) {
        return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
      }

      let filtered = allConnections;
      
      // Client-side filtering for offline search
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter((conn) =>
          conn.service_name?.toLowerCase().includes(lowerQuery) ||
          conn.connected_system_name?.toLowerCase().includes(lowerQuery)
        );
      }
      
      // Default sort by creation date
      filtered.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());

      const totalCount = filtered.length;
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
    }, [allConnections, searchQuery, currentPage, pageLimit, systemId]);

    return { ...processedData, isLoading, isFetching, error, refetch };
  };
};