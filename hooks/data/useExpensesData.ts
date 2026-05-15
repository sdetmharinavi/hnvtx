// hooks/data/useExpensesData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_advances_completeRowSchema, V_expenses_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import {
  buildServerSearchString,
  performClientPagination,
  performClientSearch,
} from '@/hooks/database/search-utils';
import { buildRpcFilters } from '@/hooks/database';
import { DEFAULTS } from '@/constants/constants';

// --- ADVANCES HOOK WITH CUSTOM STATS ---

export interface AdvancesStats {
  total: number;
  active: number;
  pending: number;
  settled: number;
}

export interface AdvancesDataReturn extends DataQueryHookReturn<V_advances_completeRowSchema> {
  stats: AdvancesStats;
}

export const useAdvancesData = (params: DataQueryHookParams): AdvancesDataReturn => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();

  const searchFields = ['req_no', 'employee_name', 'status', 'description', 'employee_pers_no'];

  const queryFn = useCallback(async (): Promise<V_advances_completeRowSchema[]> => {
    const searchString = buildServerSearchString(searchQuery, searchFields);

    const rpcFilters = buildRpcFilters({ ...filters, or: searchString });

    const { data, error } = await supabase.rpc('get_paged_data', {
      p_view_name: 'v_advances_complete',
      p_limit: 5000,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'advance_date',
      p_order_dir: 'desc',
    });

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as any)?.data || []) as V_advances_completeRowSchema[];
  }, [searchQuery, filters, supabase]);

  const {
    data: allData = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['advances-data', searchQuery, filters],
    queryFn,
    placeholderData: keepPreviousData,
    staleTime: DEFAULTS.CACHE_TIME,
  });

  const processedData = useMemo(() => {
    const stats: AdvancesStats = {
      total: allData.length,
      active: allData.filter((a) => a.status === 'active').length,
      pending: allData.filter((a) => a.status === 'pending').length,
      settled: allData.filter((a) => a.status === 'settled').length,
    };

    const paginatedData = performClientPagination(allData, currentPage, pageLimit);

    return {
      data: paginatedData,
      totalCount: allData.length,
      activeCount: stats.active,
      inactiveCount: stats.settled,
      stats,
    };
  }, [allData, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};

// --- EXPENSES HOOK WITH CUSTOM STATS & CASE-INSENSITIVE FILTERING ---

export interface ExpensesStats {
  totalAmount: number;
  totalRoundedAmount: number;
}

export interface ExpensesDataReturn extends DataQueryHookReturn<V_expenses_completeRowSchema> {
  stats: ExpensesStats;
}

export const useExpensesData = (params: DataQueryHookParams): ExpensesDataReturn => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();

  const searchFields: (keyof V_expenses_completeRowSchema)[] = [
    'category',
    'vendor',
    'invoice_no',
    'advance_req_no',
    'terminal_location',
    'used_by',
    'description',
  ];

  const serverSearchFields = [
    'category',
    'vendor',
    'invoice_no',
    'advance_req_no',
    'terminal_location',
    'description',
    'used_by',
    'amount::text',
  ];

  const queryFn = useCallback(async (): Promise<V_expenses_completeRowSchema[]> => {
    const searchString = buildServerSearchString(searchQuery, serverSearchFields);
    const queryFilters = { ...filters };

    const clientSideKeys = ['category', 'vendor', 'used_by', 'terminal_location'];
    clientSideKeys.forEach((key) => {
      if (key in queryFilters) delete queryFilters[key];
    });

    if (searchString) queryFilters.or = searchString;

    const rpcFilters = buildRpcFilters(queryFilters);

    const { data, error } = await supabase.rpc('get_paged_data', {
      p_view_name: 'v_expenses_complete',
      p_limit: 6000,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'expense_date',
      p_order_dir: 'desc',
    });

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return ((data as any)?.data || []) as V_expenses_completeRowSchema[];
  }, [searchQuery, filters, supabase]);

  const {
    data: allData = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['expenses-data', searchQuery, filters.advance_id],
    queryFn,
    placeholderData: keepPreviousData,
    staleTime: DEFAULTS.CACHE_TIME,
  });

  const processedData = useMemo(() => {
    let filtered = allData;

    if (searchQuery) {
      filtered = performClientSearch(filtered, searchQuery, searchFields);
    }

    const matchMultiFilter = (itemVal: unknown, filterVal: unknown) => {
      if (!filterVal || (Array.isArray(filterVal) && filterVal.length === 0)) return true;
      const safeItem = String(itemVal || '')
        .toLowerCase()
        .trim();

      if (Array.isArray(filterVal)) {
        return filterVal.some((f) => String(f).toLowerCase().trim() === safeItem);
      }
      return safeItem === String(filterVal).toLowerCase().trim();
    };

    if (filters.category)
      filtered = filtered.filter((item) => matchMultiFilter(item.category, filters.category));
    if (filters.vendor)
      filtered = filtered.filter((item) => matchMultiFilter(item.vendor, filters.vendor));
    if (filters.used_by)
      filtered = filtered.filter((item) => matchMultiFilter(item.used_by, filters.used_by));
    if (filters.terminal_location)
      filtered = filtered.filter((item) =>
        matchMultiFilter(item.terminal_location, filters.terminal_location),
      );

    // Calculate sum of amount (Both raw exact and summed individual rounded values)
    const stats: ExpensesStats = {
      totalAmount: 0,
      totalRoundedAmount: 0,
    };

    filtered.forEach((item) => {
      const amt = Number(item.amount || 0);
      stats.totalAmount += amt;
      stats.totalRoundedAmount += Math.round(amt);
    });

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
