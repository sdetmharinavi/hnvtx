// hooks/data/usePortsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_ports_management_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';

export const usePortsData = (
  systemId: string | null
) => {
  return function useData(params: DataQueryHookParams): DataQueryHookReturn<V_ports_management_completeRowSchema> {
    const { currentPage, pageLimit, filters, searchQuery } = params;

    const onlineQueryFn = useCallback(async (): Promise<V_ports_management_completeRowSchema[]> => {
      if (!systemId) return [];

      // FIX: Use standard SQL syntax
      let searchString: string | undefined;
      if (searchQuery && searchQuery.trim() !== '') {
          const term = searchQuery.trim().replace(/'/g, "''");
          searchString = `(` +
            `port ILIKE '%${term}%' OR ` +
            `port_type_name ILIKE '%${term}%' OR ` +
            `sfp_serial_no ILIKE '%${term}%'` +
          `)`;
      }

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
    }, [searchQuery, filters, systemId]);

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

      if (searchQuery) {
        const lowerQuery = searchQuery.toLowerCase();
        filtered = filtered.filter((p) =>
          p.port?.toLowerCase().includes(lowerQuery) ||
          p.port_type_name?.toLowerCase().includes(lowerQuery) ||
          p.sfp_serial_no?.toLowerCase().includes(lowerQuery)
        );
      }

      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      filtered.sort((a, b) => collator.compare(a.port || '', b.port || ''));

      const totalCount = filtered.length;
      const activeCount = totalCount;

      const start = (currentPage - 1) * pageLimit;
      const end = start + pageLimit;
      const paginatedData = filtered.slice(start, end);

      return {
        data: paginatedData,
        totalCount,
        activeCount,
        inactiveCount: 0,
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allPorts, searchQuery, currentPage, pageLimit, systemId]);

    return { ...processedData, isLoading, isFetching, error, refetch };
  };
};