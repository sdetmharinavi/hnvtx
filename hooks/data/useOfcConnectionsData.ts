// hooks/data/useOfcConnectionsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_ofc_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';

export const useOfcConnectionsData = (
  cableId: string | null
) => {
  return function useData(params: DataQueryHookParams): DataQueryHookReturn<V_ofc_connections_completeRowSchema> {
    const { currentPage, pageLimit, filters, searchQuery } = params;

    const onlineQueryFn = useCallback(async (): Promise<V_ofc_connections_completeRowSchema[]> => {
      if (!cableId) return [];

      // FIX: Use standard SQL syntax
      let searchString: string | undefined;
      if (searchQuery && searchQuery.trim() !== '') {
          const term = searchQuery.trim().replace(/'/g, "''");
          searchString = `(` +
            `system_name ILIKE '%${term}%' OR ` +
            `connection_type ILIKE '%${term}%' OR ` +
            `updated_sn_name ILIKE '%${term}%' OR ` +
            `updated_en_name ILIKE '%${term}%'` +
          `)`;
      }

      const rpcFilters = buildRpcFilters({
        ...filters,
        ofc_id: cableId,
        or: searchString,
      });

      const { data, error } = await createClient().rpc('get_paged_data', {
        p_view_name: 'v_ofc_connections_complete',
        p_limit: 5000,
        p_offset: 0,
        p_filters: rpcFilters,
        // THE FIX: Sort by Fiber Number (Start Node)
        p_order_by: 'fiber_no_sn',
        p_order_dir: 'asc',
      });

      if (error) throw error;
      return (data as { data: V_ofc_connections_completeRowSchema[] })?.data || [];
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, filters, cableId]);

    const localQueryFn = useCallback(() => {
      if (!cableId) {
        return localDb.v_ofc_connections_complete.limit(0).toArray();
      }
      // Sort locally by fiber number
      return localDb.v_ofc_connections_complete
        .where('ofc_id').equals(cableId)
        .sortBy('fiber_no_sn');
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cableId]);

    const {
      data: allConnections = [],
      isLoading,
      isFetching,
      error,
      refetch,
    } = useLocalFirstQuery<'v_ofc_connections_complete', V_ofc_connections_completeRowSchema>({
      queryKey: ['ofc_connections-data', cableId, searchQuery, filters],
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

      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter((conn) =>
          conn.system_name?.toLowerCase().includes(lowerQuery) ||
          conn.connection_type?.toLowerCase().includes(lowerQuery) ||
          conn.updated_sn_name?.toLowerCase().includes(lowerQuery) ||
          conn.updated_en_name?.toLowerCase().includes(lowerQuery)
        );
      }

      // Explicit Sort (Safety fallback)
      filtered.sort((a, b) => (a.fiber_no_sn || 0) - (b.fiber_no_sn || 0));

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
        inactiveCount,
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allConnections, searchQuery, currentPage, pageLimit, cableId]);

    return { ...processedData, isLoading, isFetching, error, refetch };
  };
};