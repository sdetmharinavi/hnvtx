// hooks/data/useSystemConnectionsData.ts
import { useMemo } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_system_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { buildRpcFilters } from '@/hooks/database';
import {
  buildServerSearchString,
  performClientSearch,
  performClientPagination,
} from '@/hooks/database/search-utils';
import { useQuery } from '@tanstack/react-query';
import { DEFAULTS } from '@/constants/constants';

const transformConnectionPerspective = (
  conn: V_system_connections_completeRowSchema,
  currentSystemId: string | null,
): V_system_connections_completeRowSchema => {
  if (!currentSystemId || conn.system_id === currentSystemId) {
    return conn;
  }

  if (conn.en_id === currentSystemId) {
    return {
      ...conn,
      system_id: conn.en_id,
      system_name: conn.en_name,
      system_type_name: conn.en_system_type_name,
      system_working_interface: conn.en_interface,
      system_protection_interface: conn.en_protection_interface,
      en_id: conn.system_id,
      en_name: conn.system_name,
      en_system_type_name: conn.system_type_name,
      en_interface: conn.system_working_interface,
      connected_system_name: conn.system_name,
      connected_system_type_name: conn.system_type_name,
      sn_id: conn.en_node_id,
      sn_name: conn.en_node_name,
      en_node_id: conn.sn_node_id,
      en_node_name: conn.sn_node_name,
      sn_ip: conn.en_ip,
      en_ip: conn.sn_ip,
    };
  }

  return conn;
};

export const useSystemConnectionsData = (systemId: string | null) => {
  return function useData(
    params: DataQueryHookParams,
  ): DataQueryHookReturn<V_system_connections_completeRowSchema> {
    const { currentPage, pageLimit, filters, searchQuery } = params;
    const supabase = createClient();

    const searchFields = useMemo(
      () =>
        [
          'service_name',
          'system_name',
          'connected_system_name',
          'bandwidth_allocated',
          'unique_id',
          'lc_id',
          'sn_ip',
          'en_ip',
          'services_ip',
          'remark',
          'vlan',
          'sn_interface',
          'en_interface',
          'system_working_interface',
          'system_protection_interface',
          'en_protection_interface',
        ] as (keyof V_system_connections_completeRowSchema)[],
      [],
    );

    const serverSearchFields = useMemo(
      () => [
        'service_name',
        'system_name',
        'connected_system_name',
        'bandwidth_allocated',
        'unique_id',
        'lc_id',
        'sn_ip::text',
        'en_ip::text',
        'services_ip::text',
        'remark',
        'vlan::text',
        'sn_interface',
        'en_interface',
        'system_working_interface',
        'system_protection_interface',
        'en_protection_interface',
      ],
      [],
    );

    const {
      data: allConnections = [],
      isLoading,
      isFetching,
      error,
      refetch,
    } = useQuery({
      queryKey: ['system_connections-data', systemId, searchQuery, filters],
      queryFn: async (): Promise<V_system_connections_completeRowSchema[]> => {
        if (!systemId) return [];

        const searchString = buildServerSearchString(searchQuery, serverSearchFields);
        const rpcFilters = buildRpcFilters({ ...filters, or: searchString });

        // We want connections where this system is EITHER source OR destination
        // The RPC `get_paged_system_connections` handles this logic specifically
        const { data, error } = await supabase.rpc('get_paged_system_connections', {
          p_system_id: systemId,
          p_limit: 5000,
          p_offset: 0,
          p_search_query: searchQuery || null,
        });

        if (error) throw error;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawData = ((data as any)?.data || []) as V_system_connections_completeRowSchema[];

        return rawData.map((row) => transformConnectionPerspective(row, systemId));
      },
      enabled: !!systemId,
      staleTime: DEFAULTS.CACHE_TIME,
    });

    const processedData = useMemo(() => {
      if (!allConnections || !systemId) {
        return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
      }

      let filtered = allConnections;

      // 1. Client Search (Refinement)
      if (searchQuery) {
        filtered = performClientSearch(filtered, searchQuery, searchFields);
      }

      // 2. Filters
      if (filters.media_type_id) {
        filtered = filtered.filter((c) => c.media_type_id === filters.media_type_id);
      }
      if (filters.connected_link_type_id) {
        filtered = filtered.filter(
          (c) => c.connected_link_type_id === filters.connected_link_type_id,
        );
      }
      if (filters.bandwidth) {
        filtered = filtered.filter((c) => c.bandwidth === filters.bandwidth);
      }
      if (filters.status) {
        const statusBool = filters.status === 'true';
        filtered = filtered.filter((c) => c.status === statusBool);
      }

      // 3. Sort
      filtered.sort((a, b) => {
        const nameA = a.service_name || a.connected_system_name || '';
        const nameB = b.service_name || b.connected_system_name || '';
        return nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
      });

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
    }, [allConnections, searchQuery, filters, currentPage, pageLimit, systemId, searchFields]);

    return { ...processedData, isLoading, isFetching, error, refetch };
  };
};
