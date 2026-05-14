// hooks/data/useRingManagerData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_ringsRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';

export interface DynamicStats {
  total: number;
  totalNodes: number; // Added: Total nodes across all filtered rings
  spec: { issued: number; pending: number };
  ofc: { ready: number; partial: number; pending: number };
  bts: { onAir: number; pending: number; nodesOnAir: number; configuredCount: number };
}

interface RingManagerDataReturn extends DataQueryHookReturn<V_ringsRowSchema> {
  stats: DynamicStats;
}

export const useRingManagerData = (params: DataQueryHookParams): RingManagerDataReturn => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // 1. Online Fetcher
  const onlineQueryFn = useCallback(async (): Promise<V_ringsRowSchema[]> => {
    let searchString: string | undefined;
    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.trim().replace(/'/g, "''");
      searchString =
        `(` +
        `name ILIKE '%${term}%' OR ` +
        `description ILIKE '%${term}%' OR ` +
        `ring_type_name ILIKE '%${term}%' OR ` +
        `maintenance_area_name ILIKE '%${term}%'` +
`associated_system_names ILIKE '%${term}%'` +
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
      p_order_dir: 'asc',
    });
    if (error) throw error;
    return (data as { data: V_ringsRowSchema[] })?.data || [];
  }, [searchQuery, filters]);

  // 2. Offline Fetcher
  const localQueryFn = useCallback(() => {
    return localDb.v_rings.orderBy('name').toArray();
  }, []);

  // 3. Local First Query
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

  // 4. Client-side Processing & Stats Calculation
  const processedData = useMemo(() => {
    const emptyStats: DynamicStats = {
      total: 0,
      totalNodes: 0,
      spec: { issued: 0, pending: 0 },
      ofc: { ready: 0, partial: 0, pending: 0 },
      bts: { onAir: 0, pending: 0, nodesOnAir: 0, configuredCount: 0 },
    };

    if (!allRings) {
      return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0, stats: emptyStats };
    }

    let filtered = allRings;

    // Search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (ring) =>
          ring.name?.toLowerCase().includes(lowerQuery) ||
          ring.description?.toLowerCase().includes(lowerQuery) ||
          ring.ring_type_name?.toLowerCase().includes(lowerQuery) ||
          ring.maintenance_area_name?.toLowerCase().includes(lowerQuery) ||
associated_system_names?.toLowerCase().includes(lowerQuery) 
      );
    }

    // Filters
    if (filters.status) filtered = filtered.filter((r) => String(r.status) === filters.status);
    if (filters.ring_type_id)
      filtered = filtered.filter((r) => r.ring_type_id === filters.ring_type_id);
    if (filters.maintenance_terminal_id)
      filtered = filtered.filter(
        (r) => r.maintenance_terminal_id === filters.maintenance_terminal_id
      );
    if (filters.ofc_status) filtered = filtered.filter((r) => r.ofc_status === filters.ofc_status);
    if (filters.spec_status)
      filtered = filtered.filter((r) => r.spec_status === filters.spec_status);
    if (filters.bts_status) filtered = filtered.filter((r) => r.bts_status === filters.bts_status);

    // Stats Calculation on Filtered Data
    const stats = { ...emptyStats };
    stats.total = filtered.length;

    filtered.forEach((r) => {
      // Accumulate total nodes for all visible rings
      stats.totalNodes += r.total_nodes ?? 0;

      if (r.spec_status === 'Issued') stats.spec.issued++;
      else stats.spec.pending++;

      if (r.ofc_status === 'Ready') stats.ofc.ready++;
      else if (r.ofc_status === 'Partial Ready') stats.ofc.partial++;
      else stats.ofc.pending++;

      if (r.bts_status === 'On-Air') {
        stats.bts.onAir++;
        stats.bts.nodesOnAir += r.total_nodes ?? 0;
      } else if (r.bts_status === 'Configured') {
        stats.bts.configuredCount++;
      } else {
        stats.bts.pending++;
      }
    });

    // Sort
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
      stats,
    };
  }, [allRings, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};
