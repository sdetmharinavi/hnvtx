// hooks/data/useOfcConnectionsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_ofc_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import {
  buildServerSearchString,
  performClientSearch,
  performClientPagination,
} from '@/hooks/database/search-utils';

export const useOfcConnectionsData = (cableId: string | null) => {
  return function useData(
    params: DataQueryHookParams
  ): DataQueryHookReturn<V_ofc_connections_completeRowSchema> {
    const { currentPage, pageLimit, filters, searchQuery } = params;

    // Search Config
    const searchFields = [
      'system_name',
      'connection_type',
      'updated_sn_name',
      'updated_en_name',
      'remark',
      'updated_fiber_no_en',
      'updated_fiber_no_sn',
    ] as (keyof V_ofc_connections_completeRowSchema)[];

    // Server search needs specific casts for numbers
    const serverSearchFields = [
      'system_name',
      'connection_type',
      'updated_sn_name',
      'updated_en_name',
      'remark::text',
      'updated_fiber_no_en::text',
      'updated_fiber_no_sn::text',
    ];

    const onlineQueryFn = useCallback(async (): Promise<V_ofc_connections_completeRowSchema[]> => {
      if (!cableId) return [];

      const searchString = buildServerSearchString(searchQuery, serverSearchFields);

      // Filter out client-side filters (like allocation_status) from RPC params
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { allocation_status, ...serverFilters } = filters;

      const rpcFilters = buildRpcFilters({
        ...serverFilters,
        ofc_id: cableId,
        or: searchString,
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
    }, [searchQuery, filters, cableId, serverSearchFields]);

    const localQueryFn = useCallback(() => {
      if (!cableId) {
        return localDb.v_ofc_connections_complete.limit(0).toArray();
      }
      return localDb.v_ofc_connections_complete
        .where('ofc_id')
        .equals(cableId)
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

      // 1. Search
      if (searchQuery) {
        filtered = performClientSearch(filtered, searchQuery, searchFields);

        // Manual Numeric Filtering addition
        const lowerQ = searchQuery.toLowerCase();
        if (searchQuery && !isNaN(Number(searchQuery))) {
          const numericMatches = allConnections.filter(
            (c) => String(c.fiber_no_sn).includes(lowerQ) || String(c.fiber_no_en).includes(lowerQ)
          );
          // Union of results
          const ids = new Set(filtered.map((f) => f.id));
          numericMatches.forEach((m) => {
            if (!ids.has(m.id)) filtered.push(m);
          });
        }
      }

      // NEW: Extended Allocation Status Logic
      if (filters.allocation_status) {
        const filterVal = filters.allocation_status;

        if (filterVal === 'faulty') {
          // Faulty = Status is False
          filtered = filtered.filter((c) => !c.status);
        } else if (filterVal === 'available') {
          // Spare = Status True AND No Allocation
          filtered = filtered.filter((c) => c.status && !c.system_id && !c.logical_path_id);
        } else if (filterVal === 'allocated') {
          // Utilized = Status True AND Allocated
          filtered = filtered.filter((c) => c.status && (!!c.system_id || !!c.logical_path_id));
        }
      }
      // Note: We removed the generic 'status' filter check here if 'allocation_status' covers it,
      // but keeping the generic 'status' filter alongside is fine for "Show all Inactive" vs "Show faulty specifically".
      // Just ensure they don't conflict. The existing code:
      if (filters.status) {
        const statusBool = filters.status === 'true';
        filtered = filtered.filter((c) => c.status === statusBool);
      }

      // 3. Sort (Manual numeric sort for fibers)
      filtered.sort((a, b) => (a.fiber_no_sn || 0) - (b.fiber_no_sn || 0));

      const totalCount = filtered.length;
      const activeCount = filtered.filter((c) => !!c.status).length;
      const inactiveCount = totalCount - activeCount;

      // 4. Paginate
      const paginatedData = performClientPagination(filtered, currentPage, pageLimit);

      return {
        data: paginatedData,
        totalCount,
        activeCount,
        inactiveCount,
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allConnections, searchQuery, filters, currentPage, pageLimit, cableId]);

    return { ...processedData, isLoading, isFetching, error, refetch };
  };
};
