// hooks/data/useOfcData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_ofc_cables_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';

export const useOfcData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_ofc_cables_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // 1. Online Fetcher (RPC)
  const onlineQueryFn = useCallback(async (): Promise<V_ofc_cables_completeRowSchema[]> => {
    
    // FIX: Use standard SQL syntax
    let searchString: string | undefined;
    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.trim().replace(/'/g, "''");
      searchString = `(` +
        `route_name ILIKE '%${term}%' OR ` +
        `asset_no ILIKE '%${term}%' OR ` +
        `transnet_id ILIKE '%${term}%' OR ` +
        `sn_name ILIKE '%${term}%' OR ` +
        `en_name ILIKE '%${term}%' OR ` +
        `ofc_owner_name ILIKE '%${term}%'` +
      `)`;
    }

    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchString,
    });
    
    const { data, error } = await createClient().rpc("get_paged_data", {
      p_view_name: "v_ofc_cables_complete",
      p_limit: 5000, // Fetch large batch for client-side fluidity
      p_offset: 0,
      p_filters: rpcFilters,
      // THE FIX: Explicitly sort by route_name ascending
      p_order_by: "route_name",
      p_order_dir: "asc",
    });
    if (error) throw error;
    return (data as { data: V_ofc_cables_completeRowSchema[] })?.data || [];
  }, [searchQuery, filters]);

  // 2. Offline Fetcher (Dexie)
  const localQueryFn = useCallback(() => {
    // Sort locally by route_name
    return localDb.v_ofc_cables_complete.orderBy('route_name').toArray();
  }, []);

  // 3. Local First Query Hook
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

  // 4. Client-Side Processing
  const processedData = useMemo(() => {
    if (!allCables) {
        return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }
    let filtered = allCables;

    // Search Filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
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
    
    // Dropdown Filters
    if (filters.ofc_type_id)
      filtered = filtered.filter((c) => c.ofc_type_id === filters.ofc_type_id);
    if (filters.status) filtered = filtered.filter((c) => c.status === (filters.status === "true"));
    if (filters.ofc_owner_id)
      filtered = filtered.filter((c) => c.ofc_owner_id === filters.ofc_owner_id);
    if (filters.maintenance_terminal_id)
      filtered = filtered.filter(
        (c) => c.maintenance_terminal_id === filters.maintenance_terminal_id
      );

    // THE FIX: Explicit client-side sort to ensure order persists after filtering
    filtered.sort((a, b) => 
      (a.route_name || '').localeCompare(b.route_name || '', undefined, { sensitivity: 'base' })
    );

    const totalCount = filtered.length;
    const activeCount = filtered.filter((c) => c.status === true).length;
    const inactiveCount = totalCount - activeCount; // Calculate inactive

    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount,
    };
  }, [allCables, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};