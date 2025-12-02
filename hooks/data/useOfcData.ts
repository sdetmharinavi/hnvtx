// hooks/data/useOfcData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_ofc_cables_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { DEFAULTS } from '@/constants/constants';

/**
 * Implements the local-first data fetching strategy for the OFC Cables page.
 */
export const useOfcData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_ofc_cables_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  const onlineQueryFn = useCallback(async (): Promise<V_ofc_cables_completeRowSchema[]> => {
    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchQuery
        ? `(route_name.ilike.%${searchQuery}%,asset_no.ilike.%${searchQuery}%,transnet_id.ilike.%${searchQuery}%,sn_name.ilike.%${searchQuery}%,en_name.ilike.%${searchQuery}%,ofc_owner_name.ilike.%${searchQuery}%)`
        : undefined,
    });
    const { data, error } = await createClient().rpc("get_paged_data", {
      p_view_name: "v_ofc_cables_complete",
      p_limit: DEFAULTS.PAGE_SIZE,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: "route_name",
    });
    if (error) throw error;
    return (data as { data: V_ofc_cables_completeRowSchema[] })?.data || [];
  }, [searchQuery, filters]);

  const localQueryFn = useCallback(() => {
    return localDb.v_ofc_cables_complete.toArray();
  }, []);

  const {
    data: allCables = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'v_ofc_cables_complete'>({
    queryKey: ['ofc_cables-data', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_ofc_cables_complete,
  });

  const processedData = useMemo(() => {
    if (!allCables) {
        return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }
    let filtered = allCables;
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      // THE FIX: This client-side filter now mirrors the server-side search logic.
      filtered = filtered.filter(
        (cable) =>
          cable.route_name?.toLowerCase().includes(lowerQuery) ||
          cable.asset_no?.toLowerCase().includes(lowerQuery) ||
          cable.transnet_id?.toLowerCase().includes(lowerQuery) ||
          cable.sn_name?.toLowerCase().includes(lowerQuery) ||
          cable.en_name?.toLowerCase().includes(lowerQuery) ||
          cable.ofc_owner_name?.toLowerCase().includes(lowerQuery)
      );
    }
    if (filters.ofc_type_id)
      filtered = filtered.filter((c) => c.ofc_type_id === filters.ofc_type_id);
    if (filters.status) filtered = filtered.filter((c) => c.status === (filters.status === "true"));
    if (filters.ofc_owner_id)
      filtered = filtered.filter((c) => c.ofc_owner_id === filters.ofc_owner_id);
    if (filters.maintenance_terminal_id)
      filtered = filtered.filter(
        (c) => c.maintenance_terminal_id === filters.maintenance_terminal_id
      );

    const totalCount = filtered.length;
    const activeCount = filtered.filter((c) => c.status === true).length;
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
    };
  }, [allCables, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};