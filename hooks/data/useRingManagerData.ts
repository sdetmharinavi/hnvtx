// hooks/data/useRingManagerData.ts
import { useMemo } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_ringsRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { buildRpcFilters } from '@/hooks/database';
import { useQuery } from '@tanstack/react-query';
import { buildServerSearchString } from '@/hooks/database/search-utils';

export interface DynamicStats {
  total: number;
  totalNodes: number;
  spec: { issued: number; pending: number };
  ofc: { ready: number; partial: number; pending: number };
  bts: { onAir: number; pending: number; nodesOnAir: number; configuredCount: number };
}

interface RingManagerDataReturn extends DataQueryHookReturn<V_ringsRowSchema> {
  stats: DynamicStats;
}

export const useRingManagerData = (params: DataQueryHookParams): RingManagerDataReturn => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();

  const {
    data: allRings = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['rings-manager-data', searchQuery, filters],
    queryFn: async (): Promise<V_ringsRowSchema[]> => {
      // ADDED: 'associated_system_ips' to search fields
      const serverSearchFields = [
        'name',
        'description',
        'ring_type_name',
        'maintenance_area_name',
        'associated_system_names',
        'associated_system_ips',
      ];
      const searchString = buildServerSearchString(searchQuery, serverSearchFields);

      const rpcFilters = buildRpcFilters({
        ...filters,
        or: searchString,
      });

      const { data, error } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_rings',
        p_limit: 5000,
        p_offset: 0,
        p_filters: rpcFilters,
        p_order_by: 'name',
        p_order_dir: 'asc',
      });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data as any)?.data || []) as V_ringsRowSchema[];
    },
    staleTime: 5 * 60 * 1000,
  });

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

    // Since we fetch "all" matching filters from server (limit 5000), we can calc stats here
    const filtered = allRings;
    const stats = { ...emptyStats };
    stats.total = filtered.length;

    filtered.forEach((r) => {
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

    const totalCount = filtered.length;
    const activeCount = filtered.filter((r) => r.status === true).length;

    // Client Pagination
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
  }, [allRings, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};
