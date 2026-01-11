// hooks/data/usePortsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_ports_management_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import {
  buildServerSearchString,
  performClientSearch,
  performClientSort,
  performClientPagination,
} from '@/hooks/database/search-utils';

export const usePortsData = (systemId: string | null) => {
  return function useData(
    params: DataQueryHookParams
  ): DataQueryHookReturn<V_ports_management_completeRowSchema> {
    const { currentPage, pageLimit, filters, searchQuery } = params;

    // Search Config
    const searchFields = useMemo(
      () =>
        [
          'port',
          'port_type_name',
          'port_type_code',
          'sfp_serial_no',
        ] as (keyof V_ports_management_completeRowSchema)[],
      []
    );
    const serverSearchFields = useMemo(() => [...searchFields], [searchFields]);

    const onlineQueryFn = useCallback(async (): Promise<V_ports_management_completeRowSchema[]> => {
      if (!systemId) return [];

      const searchString = buildServerSearchString(searchQuery, serverSearchFields);
      const rpcFilters = buildRpcFilters({
        ...filters,
        system_id: systemId,
        or: searchString,
      });

      const { data, error } = await createClient().rpc('get_paged_data', {
        p_view_name: 'v_ports_management_complete',
        p_limit: 5000,
        p_offset: 0,
        p_filters: rpcFilters,
        p_order_by: 'port',
        p_order_dir: 'asc',
      });

      if (error) throw error;
      return (data as { data: V_ports_management_completeRowSchema[] })?.data || [];
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, filters, systemId, serverSearchFields]);

    const localQueryFn = useCallback(() => {
      if (!systemId) {
        return localDb.v_ports_management_complete.limit(0).toArray();
      }
      return localDb.v_ports_management_complete.where('system_id').equals(systemId).toArray();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [systemId]);

    const {
      data: allPorts = [],
      isLoading,
      isFetching,
      error,
      refetch,
    } = useLocalFirstQuery<'v_ports_management_complete', V_ports_management_completeRowSchema>({
      queryKey: ['ports_management-data', systemId, searchQuery, filters],
      onlineQueryFn,
      localQueryFn,
      dexieTable: localDb.v_ports_management_complete,
      localQueryDeps: [systemId],
    });

    const processedData = useMemo(() => {
      if (!allPorts || !systemId) {
        return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
      }

      let filtered = allPorts;

      // 1. Search
      filtered = performClientSearch(filtered, searchQuery, searchFields);

      // 2. Filters
      if (filters.port_type_code) {
        const codes = Array.isArray(filters.port_type_code)
          ? (filters.port_type_code as string[])
          : [filters.port_type_code as string];

        if (codes.length > 0) {
          filtered = filtered.filter((p) => p.port_type_code && codes.includes(p.port_type_code));
        }
      }
      if (filters.port_utilization) {
        const utilBool = filters.port_utilization === 'true';
        filtered = filtered.filter((p) => p.port_utilization === utilBool);
      }
      if (filters.port_admin_status) {
        const adminBool = filters.port_admin_status === 'true';
        filtered = filtered.filter((p) => p.port_admin_status === adminBool);
      }

      // 3. Sort
      filtered = performClientSort(filtered, 'port');

      const totalCount = filtered.length;
      const activeCount = filtered.filter((p) => p.port_admin_status).length;
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
    }, [allPorts, searchQuery, filters, currentPage, pageLimit, systemId]);

    return { ...processedData, isLoading, isFetching, error, refetch };
  };
};
