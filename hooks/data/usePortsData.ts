// hooks/data/usePortsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_ports_management_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';

/**
 * Implements the local-first data fetching strategy for System Ports.
 * Filters by system ID and performs client-side search.
 */
export const usePortsData = (
  systemId: string | null
) => {
  // Wrapped in a factory function to be used by useCrudManager
  return function useData(params: DataQueryHookParams): DataQueryHookReturn<V_ports_management_completeRowSchema> {
    const { currentPage, pageLimit, filters, searchQuery } = params;
    
    const onlineQueryFn = useCallback(async (): Promise<V_ports_management_completeRowSchema[]> => {
      if (!systemId) return [];

      const rpcFilters = buildRpcFilters({
        ...filters,
        system_id: systemId,
        or: searchQuery
          ? `(port.ilike.%${searchQuery}%,port_type_name.ilike.%${searchQuery}%,sfp_serial_no.ilike.%${searchQuery}%)`
          : undefined,
      });

      const { data, error } = await createClient().rpc('get_paged_data', {
        p_view_name: 'v_ports_management_complete',
        p_limit: 5000, // Fetch larger set for client-side processing
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
      queryKey: ['ports-data', systemId, searchQuery, filters],
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
      
      // Natural sort for ports (e.g., 1.1, 1.2, 1.10)
      const collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
      filtered.sort((a, b) => collator.compare(a.port || '', b.port || ''));

      const totalCount = filtered.length;
      // Assuming valid port means "active" in this context since there is no active status column on the view
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