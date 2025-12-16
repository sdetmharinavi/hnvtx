// hooks/data/useSystemConnectionsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_system_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import {
  buildServerSearchString,
  performClientSearch,
  performClientPagination
} from '@/hooks/database/search-utils';

const transformConnectionPerspective = (
  conn: V_system_connections_completeRowSchema,
  currentSystemId: string | null
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
      en_ip: conn.sn_ip
    };
  }

  return conn;
};

export const useSystemConnectionsData = (
  systemId: string | null
) => {
  return function useData(params: DataQueryHookParams): DataQueryHookReturn<V_system_connections_completeRowSchema> {
    const { currentPage, pageLimit, filters, searchQuery } = params;

    // Search Config
    // THE FIX: Added IP fields
    const searchFields = useMemo(
      () => [
      'service_name',
      'system_name',
      'connected_system_name',
      'bandwidth_allocated',
      'unique_id',
      'lc_id',
      'sn_ip',
      'en_ip',
      'services_ip'
    ] as (keyof V_system_connections_completeRowSchema)[],
    []);

    // THE FIX: Added IP fields with explicit text cast for server search
    const serverSearchFields = useMemo(() => [
      'service_name',
      'system_name',
      'connected_system_name',
      'bandwidth_allocated',
      'unique_id',
      'lc_id',
      'sn_ip::text',
      'en_ip::text',
      'services_ip::text'
    ], []);

    const onlineQueryFn = useCallback(async (): Promise<V_system_connections_completeRowSchema[]> => {
      if (!systemId) return [];

      const searchString = buildServerSearchString(searchQuery, serverSearchFields);
      const rpcFilters = buildRpcFilters({ ...filters, or: searchString });

      const { data, error } = await createClient().rpc('get_paged_data', {
        p_view_name: 'v_system_connections_complete',
        p_limit: 5000,
        p_offset: 0,
        p_filters: rpcFilters,
        p_order_by: 'service_name',
        p_order_dir: 'asc',
      });

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rawData = (data as any)?.data || [];

      return rawData.map((row: V_system_connections_completeRowSchema) =>
        transformConnectionPerspective(row, systemId)
      );
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchQuery, filters, serverSearchFields, systemId]);

    const localQueryFn = useCallback(() => {
      if (!systemId) {
        return localDb.v_system_connections_complete.limit(0).toArray();
      }
      return Promise.all([
          localDb.v_system_connections_complete.where('system_id').equals(systemId).toArray(),
          localDb.v_system_connections_complete.where('en_id').equals(systemId).toArray()
      ]).then(([source, dest]) => {
          const combined = [...source, ...dest];
          const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
          return unique.map(row => transformConnectionPerspective(row, systemId));
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

      // 1. Search
      if (searchQuery) {
        filtered = performClientSearch(filtered, searchQuery, searchFields);
      }

      // 2. Filters
      if (filters.media_type_id) {
        filtered = filtered.filter(c => c.media_type_id === filters.media_type_id);
      }
      if (filters.connected_link_type_id) {
        filtered = filtered.filter(c => c.connected_link_type_id === filters.connected_link_type_id);
      }
      if (filters.bandwidth) {
        filtered = filtered.filter(c => c.bandwidth === filters.bandwidth);
      }
      if (filters.status) {
        const statusBool = filters.status === 'true';
        filtered = filtered.filter(c => c.status === statusBool);
      }

      // 3. Sort
      filtered.sort((a, b) => {
        const nameA = a.service_name || a.connected_system_name || '';
        const nameB = b.service_name || b.connected_system_name || '';

        const nameComparison = nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
        if (nameComparison !== 0) return nameComparison;

        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
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
        inactiveCount
      };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [allConnections, searchQuery, filters, currentPage, pageLimit, systemId]);

    return { ...processedData, isLoading, isFetching, error, refetch };
  };
};