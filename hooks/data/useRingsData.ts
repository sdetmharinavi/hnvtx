// hooks/data/useRingsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_ringsRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';

export const useRingsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_ringsRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  const onlineQueryFn = useCallback(async (): Promise<V_ringsRowSchema[]> => {
    
    // FIX: Use standard SQL syntax for search
    let searchString: string | undefined;
    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.trim().replace(/'/g, "''");
      searchString = `(` +
        `name ILIKE '%${term}%' OR ` +
        `description ILIKE '%${term}%' OR ` +
        `ring_type_name ILIKE '%${term}%' OR ` +
        `maintenance_area_name ILIKE '%${term}%'` +
      `)`;
    }

    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchString,
    });

    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_rings',
      p_limit: 5000,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'name',
      p_order_dir: 'asc'
    });
    if (error) throw error;
    return (data as { data: V_ringsRowSchema[] })?.data || [];
  }, [searchQuery, filters]);

  const localQueryFn = useCallback(() => {
    // Sort by name locally
    return localDb.v_rings.orderBy('name').toArray();
  }, []);

  const {
    data: allRings = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'v_rings'>({
    queryKey: ['rings-manager-data', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_rings,
  });

  const processedData = useMemo(() => {
    if (!allRings) {
        return {
            data: [],
            totalCount: 0,
            activeCount: 0,
            inactiveCount: 0,
        };
    }

    let filtered = allRings;

    // 1. Search Filter
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ring) =>
          ring.name?.toLowerCase().includes(lowerQuery) ||
          ring.description?.toLowerCase().includes(lowerQuery) ||
          ring.ring_type_name?.toLowerCase().includes(lowerQuery) ||
          ring.maintenance_area_name?.toLowerCase().includes(lowerQuery)
      );
    }

    // 2. Exact Match Filters (Dropdowns)
    if (filters.status) {
      filtered = filtered.filter(r => String(r.status) === filters.status);
    }
    if (filters.ring_type_id) {
        filtered = filtered.filter(r => r.ring_type_id === filters.ring_type_id);
    }
    if (filters.maintenance_terminal_id) {
        filtered = filtered.filter(r => r.maintenance_terminal_id === filters.maintenance_terminal_id);
    }
    
    // 3. New Status Filters
    if (filters.ofc_status) {
        filtered = filtered.filter(r => r.ofc_status === filters.ofc_status);
    }
    if (filters.spec_status) {
        filtered = filtered.filter(r => r.spec_status === filters.spec_status);
    }
    if (filters.bts_status) {
        filtered = filtered.filter(r => r.bts_status === filters.bts_status);
    }

    // 4. Sorting
    filtered.sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', undefined, { numeric: true, sensitivity: 'base' })
    );

    const totalCount = filtered.length;
    const activeCount = filtered.filter((r) => r.status === true).length;
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
    };
  }, [allRings, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};