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
 * Filters by system ID (Source OR Destination) and performs client-side search.
 */
export const useSystemConnectionsData = (
  systemId: string | null
) => {
  // Wrapped in a factory function to be used by useCrudManager
  return function useData(params: DataQueryHookParams): DataQueryHookReturn<V_system_connections_completeRowSchema> {
    const { currentPage, pageLimit, filters, searchQuery } = params;
    
    const onlineQueryFn = useCallback(async (): Promise<V_system_connections_completeRowSchema[]> => {
      if (!systemId) return [];

      // Use the new specialized RPC that checks both sides of the link
      const { data, error } = await createClient().rpc('get_paged_system_connections', {
        p_system_id: systemId,
        p_limit: 5000,
        p_offset: 0,
        p_search_query: searchQuery || null
      });

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any)?.data || [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, systemId]);

    const localQueryFn = useCallback(() => {
      if (!systemId) {
        return localDb.v_system_connections_complete.limit(0).toArray();
      }
      // Dexie doesn't support complex OR queries easily in one go without a compound index,
      // so we fetch two collections and merge.
      return Promise.all([
          localDb.v_system_connections_complete.where('system_id').equals(systemId).toArray(),
          localDb.v_system_connections_complete.where('en_id').equals(systemId).toArray()
      ]).then(([source, dest]) => {
          // Merge and deduplicate by ID
          const map = new Map();
          source.forEach(i => map.set(i.id, i));
          dest.forEach(i => map.set(i.id, i));
          return Array.from(map.values());
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [systemId]);

    const {
      data: allConnections = [],
      isLoading,
      isFetching,
      error,
      refetch,
    } = useLocalFirstQuery<'v_system_connections_complete', V_system_connections_completeRowSchema>({
      queryKey: ['system_connections-data', systemId, searchQuery], // Key changed slightly
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
      
      // Client-side filtering
      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter((conn) =>
          conn.service_name?.toLowerCase().includes(lowerQuery) ||
          conn.connected_system_name?.toLowerCase().includes(lowerQuery)
        );
      }
      
      // Sort
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