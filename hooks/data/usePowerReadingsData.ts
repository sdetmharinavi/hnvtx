// hooks/data/usePowerReadingsData.ts
'use client';

/* STREAMING_CHUNK:Defining types and imports... */
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_port_power_readingsRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  buildServerSearchString,
  performClientPagination,
  performClientSearch,
} from '@/hooks/database/search-utils';
import { buildRpcFilters } from '@/hooks/database';
import { DEFAULTS } from '@/constants/constants';

export interface PowerReadingsStats {
  total: number;
  maxTx: number | null;
  minTx: number | null;
  maxRx: number | null;
  minRx: number | null;
}

export interface PowerReadingsDataReturn extends DataQueryHookReturn<V_port_power_readingsRowSchema> {
  stats: PowerReadingsStats;
}

export const usePowerReadingsData = (params: DataQueryHookParams): PowerReadingsDataReturn => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();

  const searchFields: (keyof V_port_power_readingsRowSchema)[] = [
    'port',
    'remark',
    'recorded_by_name',
    'system_name',
  ];

  const serverSearchFields = [
    'port',
    'remark',
    'recorded_by_name',
    'system_name',
  ];

  /* STREAMING_CHUNK:Setting up search and query function... */
  const queryFn = useCallback(async (): Promise<V_port_power_readingsRowSchema[]> => {
    const searchString = buildServerSearchString(searchQuery, serverSearchFields);
    const queryFilters = { ...filters };

    // Strip client-side specific filters to prevent Postgres from throwing a schema mismatch error
    const clientSideKeys = ['start_date', 'end_date'];
    clientSideKeys.forEach((key) => {
      if (key in queryFilters) delete queryFilters[key];
    });

    if (searchString) queryFilters.or = searchString;

    const rpcFilters = buildRpcFilters(queryFilters);

    const { data, error } = await supabase.rpc('get_paged_data', {
      p_view_name: 'v_port_power_readings',
      p_limit: 6000, // Fetch a large batch to handle client-side date range filtering correctly
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'reading_date',
      p_order_dir: 'desc',
    });

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as any)?.data || []) as V_port_power_readingsRowSchema[];
  }, [searchQuery, filters, supabase]);

  const {
    data: allData = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['power-readings-list-data', searchQuery, filters.ring_id, filters.system_id],
    queryFn,
    placeholderData: keepPreviousData,
    staleTime: DEFAULTS.CACHE_TIME,
  });

  /* STREAMING_CHUNK:Filtering and calculating min/max stats... */
  const processedData = useMemo(() => {
    let filtered = allData;

    // 1. Client Search
    if (searchQuery) {
      filtered = performClientSearch(filtered, searchQuery, searchFields);
    }

    // 2. Client-side Date Range Filtering
    const startDate = filters.start_date as Date | null | undefined;
    const endDate = filters.end_date as Date | null | undefined;

    if (startDate || endDate) {
      filtered = filtered.filter((item) => {
        if (!item.reading_date) return false;
        const readingDate = new Date(item.reading_date);
        if (isNaN(readingDate.getTime())) return false;
        
        // Strip time for accurate day-level comparison
        readingDate.setHours(0, 0, 0, 0);

        if (startDate && endDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          return readingDate >= s && readingDate <= e;
        } else if (startDate) {
          const s = new Date(startDate);
          s.setHours(0, 0, 0, 0);
          return readingDate >= s;
        } else if (endDate) {
          const e = new Date(endDate);
          e.setHours(23, 59, 59, 999);
          return readingDate <= e;
        }
        return true;
      });
    }

    // 3. Stats Calculation on the fully filtered dataset
    let maxTx: number | null = null;
    let minTx: number | null = null;
    let maxRx: number | null = null;
    let minRx: number | null = null;

    // Using a for...of loop ensures TypeScript correctly tracks variable reassignments
    for (const item of filtered) {
      if (item.tx_power !== null && item.tx_power !== undefined) {
        const val = Number(item.tx_power);
        if (maxTx === null || val > maxTx) maxTx = val;
        if (minTx === null || val < minTx) minTx = val;
      }
      if (item.rx_power !== null && item.rx_power !== undefined) {
        const val = Number(item.rx_power);
        if (maxRx === null || val > maxRx) maxRx = val;
        if (minRx === null || val < minRx) minRx = val;
      }
    }

    const stats: PowerReadingsStats = {
      total: filtered.length,
      maxTx: maxTx !== null ? Number((maxTx as number).toFixed(2)) : null,
      minTx: minTx !== null ? Number((minTx as number).toFixed(2)) : null,
      maxRx: maxRx !== null ? Number((maxRx as number).toFixed(2)) : null,
      minRx: minRx !== null ? Number((minRx as number).toFixed(2)) : null,
    };

    const paginatedData = performClientPagination(filtered, currentPage, pageLimit);

    return {
      data: paginatedData,
      totalCount: filtered.length,
      activeCount: filtered.length,
      inactiveCount: 0,
      stats,
    };
  }, [allData, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};