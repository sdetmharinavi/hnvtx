// hooks/data/useNodesData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_nodes_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { DEFAULTS } from '@/constants/constants';
import {
  buildServerSearchString,
  performClientSearch,
  performClientSort,
  performClientPagination,
} from '@/hooks/database/search-utils';

export const useNodesData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_nodes_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // Search Config
  const searchFields = useMemo(
    () =>
      [
        'name',
        'node_type_code',
        'remark',
        'latitude',
        'longitude',
      ] as (keyof V_nodes_completeRowSchema)[],
    []
  );

  const serverSearchFields = useMemo(
    () => ['name', 'node_type_code', 'remark', 'latitude::text', 'longitude::text'],
    []
  );

  // 1. Online Fetcher
  const onlineQueryFn = useCallback(async (): Promise<V_nodes_completeRowSchema[]> => {
    const searchString = buildServerSearchString(searchQuery, serverSearchFields);

    // Filter out client-side only filters (like coordinates_status) before sending to RPC
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { coordinates_status, ...serverFilters } = filters;

    const rpcFilters = buildRpcFilters({
      ...serverFilters,
      or: searchString,
    });

    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_nodes_complete',
      p_limit: DEFAULTS.PAGE_SIZE,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'name',
      p_order_dir: 'asc',
    });

    if (error) throw error;
    return (data as { data: V_nodes_completeRowSchema[] })?.data || [];
  }, [searchQuery, filters, serverSearchFields]);

  // 2. Offline Fetcher
  const localQueryFn = useCallback(() => {
    return localDb.v_nodes_complete.orderBy('name').toArray();
  }, []);

  // 3. Query
  const {
    data: allNodes = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'v_nodes_complete'>({
    queryKey: ['nodes-data', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_nodes_complete,
  });

  // 4. Processing
  const processedData = useMemo(() => {
    let filtered = allNodes || [];

    // Search
    filtered = performClientSearch(filtered, searchQuery, searchFields);

    // Filters
    if (filters.node_type_id) {
      filtered = filtered.filter((node) => node.node_type_id === filters.node_type_id);
    }
    if (filters.maintenance_terminal_id) {
      filtered = filtered.filter(
        (node) => node.maintenance_terminal_id === filters.maintenance_terminal_id
      );
    }
    if (filters.status) {
      filtered = filtered.filter((node) => String(node.status) === filters.status);
    }

    // NEW: Coordinates Status Filter
    if (filters.coordinates_status) {
      if (filters.coordinates_status === 'with_coords') {
        filtered = filtered.filter(
          (node) =>
            node.latitude !== null &&
            node.latitude !== undefined &&
            node.longitude !== null &&
            node.longitude !== undefined
        );
      } else if (filters.coordinates_status === 'without_coords') {
        filtered = filtered.filter(
          (node) =>
            node.latitude === null ||
            node.latitude === undefined ||
            node.longitude === null ||
            node.longitude === undefined
        );
      }
    }

    // Sort
    filtered = performClientSort(filtered, 'name');

    const totalCount = filtered.length;
    const activeCount = filtered.filter((n) => n.status === true).length;
    const inactiveCount = totalCount - activeCount;

    // Paginate
    const paginatedData = performClientPagination(filtered, currentPage, pageLimit);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allNodes, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};
