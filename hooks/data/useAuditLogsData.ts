// hooks/data/useAuditLogsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_audit_logsRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { 
  buildServerSearchString, 
  performClientSearch, 
  performClientSort, 
  performClientPagination 
} from '@/hooks/database/search-utils';

export const useAuditLogsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_audit_logsRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // Search Config
  const searchFields = useMemo(
    () => ['action_type', 'table_name', 'performed_by_name', 'performed_by_email'] as (keyof V_audit_logsRowSchema)[],
    []
  );
  const serverSearchFields = useMemo(() => [...searchFields], [searchFields]);

  const onlineQueryFn = useCallback(async (): Promise<V_audit_logsRowSchema[]> => {
    const searchString = buildServerSearchString(searchQuery, serverSearchFields);
    const rpcFilters = buildRpcFilters({ ...filters, or: searchString });

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
  }, [searchQuery, filters, serverSearchFields]);

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
    let filtered = allLogs || [];

    // Search
    filtered = performClientSearch(filtered, searchQuery, searchFields);

    // Filters
    if (filters.table_name) {
      filtered = filtered.filter((log) => log.table_name === filters.table_name);
    }
    if (filters.action_type) {
      filtered = filtered.filter((log) => log.action_type === filters.action_type);
    }

    // Sort (Desc for logs)
    filtered = performClientSort(filtered, 'created_at', 'desc');

    const totalCount = filtered.length;
    
    // Paginate
    const paginatedData = performClientPagination(filtered, currentPage, pageLimit);

    return {
      data: paginatedData,
      totalCount,
      activeCount: 0, 
      inactiveCount: 0,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allLogs, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};