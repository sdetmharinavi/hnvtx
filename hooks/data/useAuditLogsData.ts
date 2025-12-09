// hooks/data/useAuditLogsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_audit_logsRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';

export const useAuditLogsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_audit_logsRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  const onlineQueryFn = useCallback(async (): Promise<V_audit_logsRowSchema[]> => {
    
    // FIX: Use standard SQL syntax
    let searchString: string | undefined;
    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.trim().replace(/'/g, "''");
      searchString = `(` +
        `action_type ILIKE '%${term}%' OR ` +
        `table_name ILIKE '%${term}%' OR ` +
        `performed_by_name ILIKE '%${term}%' OR ` +
        `performed_by_email ILIKE '%${term}%'` +
      `)`;
    }

    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchString,
    });
    
    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_audit_logs',
      p_limit: 5000,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'created_at',
      p_order_dir: 'desc',
    });
    if (error) throw error;
    return (data as { data: V_audit_logsRowSchema[] })?.data || [];
  }, [searchQuery, filters]);

  const localQueryFn = useCallback(() => {
    return localDb.v_audit_logs.orderBy('created_at').reverse().toArray();
  }, []);

  const {
    data: allLogs = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'v_audit_logs', V_audit_logsRowSchema>({
    queryKey: ['user_activity_logs-data', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_audit_logs,
  });

  const processedData = useMemo(() => {
    if (!allLogs) return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };

    let filtered = allLogs;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((log) =>
        log.action_type?.toLowerCase().includes(lowerQuery) ||
        log.table_name?.toLowerCase().includes(lowerQuery) ||
        log.performed_by_name?.toLowerCase().includes(lowerQuery) ||
        log.performed_by_email?.toLowerCase().includes(lowerQuery)
      );
    }

    if (filters.table_name) {
      filtered = filtered.filter((log) => log.table_name === filters.table_name);
    }
    if (filters.action_type) {
      filtered = filtered.filter((log) => log.action_type === filters.action_type);
    }

    const totalCount = filtered.length;
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      totalCount,
      activeCount: 0, // Not applicable
      inactiveCount: 0,
    };
  }, [allLogs, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};