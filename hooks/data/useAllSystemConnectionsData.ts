// hooks/data/useAllSystemConnectionsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_system_connections_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { DEFAULTS } from '@/constants/constants';
import { 
  buildServerSearchString, 
  performClientSearch, 
  performClientPagination 
} from '@/hooks/database/search-utils';

export const useAllSystemConnectionsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_system_connections_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // Search Config
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
    const searchString = buildServerSearchString(searchQuery, serverSearchFields);
    const rpcFilters = buildRpcFilters({ ...filters, or: searchString });

    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_system_connections_complete',
      p_limit: DEFAULTS.PAGE_SIZE,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'service_name',
      p_order_dir: 'asc',
    });

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any)?.data || [];
  }, [searchQuery, filters, serverSearchFields]);

  const localQueryFn = useCallback(() => {
    return localDb.v_system_connections_complete.toArray();
  }, []);

  const {
    data: allConnections = [],
    isLoading,
    isFetching,
    error,
    refetch,
    networkStatus
  } = useLocalFirstQuery<'v_system_connections_complete'>({
    queryKey: ['all-system-connections', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_system_connections_complete,
    autoSync: false // Manual sync only
  });

  const processedData = useMemo(() => {
    let filtered = allConnections || [];

    // 1. Search
    filtered = performClientSearch(filtered, searchQuery, searchFields);

    // 2. Filters
    if (filters.media_type_id) {
        filtered = filtered.filter(c => c.media_type_id === filters.media_type_id);
    }
    if (filters.connected_link_type_id) {
        filtered = filtered.filter(c => c.connected_link_type_id === filters.connected_link_type_id);
    }
    if (filters.status) {
        const statusBool = filters.status === 'true';
        filtered = filtered.filter(c => c.status === statusBool);
    }

    // 3. Sort (Client-side)
    filtered.sort((a, b) => {
      const nameA = a.service_name || a.system_name || '';
      const nameB = b.service_name || b.system_name || '';
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
      inactiveCount
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allConnections, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch, networkStatus };
};