// hooks/data/usePortsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_ports_management_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { buildRpcFilters } from '@/hooks/database';
import {
  buildServerSearchString,
  performClientSearch,
  performClientSort,
  performClientPagination,
} from '@/hooks/database/search-utils';
import { useQuery } from '@tanstack/react-query';
import { DEFAULTS } from '@/constants/constants';

export const usePortsData = (systemId: string | null) => {
  return function useData(
    params: DataQueryHookParams
  ): DataQueryHookReturn<V_ports_management_completeRowSchema> {
    const { currentPage, pageLimit, filters, searchQuery } = params;
    const supabase = createClient();

    const searchFields = useMemo(
      () =>
        ['port', 'port_type_name', 'port_type_code', 'sfp_serial_no'] as (keyof V_ports_management_completeRowSchema)[],
      []
    );
    const serverSearchFields = useMemo(() => [...searchFields], [searchFields]);

    const {
      data: allPorts = [],
      isLoading,
      isFetching,
      error,
      refetch,
    } = useQuery({
      queryKey: ['ports_management-data', systemId, searchQuery, filters],
      queryFn: async (): Promise<V_ports_management_completeRowSchema[]> => {
        if (!systemId) return [];

        const searchString = buildServerSearchString(searchQuery, serverSearchFields);
        const rpcFilters = buildRpcFilters({
          ...filters,
          system_id: systemId,
          or: searchString,
        });

        const { data, error } = await supabase.rpc('get_paged_data', {
          p_view_name: 'v_ports_management_complete',
          p_limit: 5000,
          p_offset: 0,
          p_filters: rpcFilters,
          p_order_by: 'port',
          p_order_dir: 'asc',
        });

        if (error) throw error;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (data as any)?.data || [];
      },
      enabled: !!systemId,
      staleTime: DEFAULTS.CACHE_TIME,
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
    }, [allPorts, searchQuery, filters, currentPage, pageLimit, systemId, searchFields]);

    return { ...processedData, isLoading, isFetching, error, refetch };
  };
};