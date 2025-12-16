// hooks/data/useEmployeesData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_employeesRowSchema } from '@/schemas/zod-schemas';
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

export const useEmployeesData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_employeesRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // Search Config
  const searchFields = useMemo(
    () => ['employee_name', 'employee_pers_no', 'employee_email', 'employee_contact', 'employee_designation_name'] as (keyof V_employeesRowSchema)[],
    []
  );
  const serverSearchFields = useMemo(() => [...searchFields], [searchFields]);

  const onlineQueryFn = useCallback(async (): Promise<V_employeesRowSchema[]> => {
    const searchString = buildServerSearchString(searchQuery, serverSearchFields);
    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchString,
    });

    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_employees',
      p_limit: 5000,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'employee_name',
      p_order_dir: 'asc'
    });
    if (error) throw error;
    return (data as { data: V_employeesRowSchema[] })?.data || [];
  }, [searchQuery, filters, serverSearchFields]);

  const localQueryFn = useCallback(() => {
    return localDb.v_employees.orderBy('employee_name').toArray();
  }, []);

  const {
    data: allEmployees = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'v_employees'>({
    queryKey: ['employees-data', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_employees,
  });

  const processedData = useMemo(() => {
    let filtered = allEmployees || [];

    // Search
    filtered = performClientSearch(filtered, searchQuery, searchFields);

    // Filters
    if (filters.employee_designation_id) {
      filtered = filtered.filter((emp) => emp.employee_designation_id === filters.employee_designation_id);
    }
    if (filters.maintenance_terminal_id) {
      filtered = filtered.filter((emp) => emp.maintenance_terminal_id === filters.maintenance_terminal_id);
    }
    if (filters.status) {
      filtered = filtered.filter((emp) => String(emp.status) === filters.status);
    }

    // Sort
    filtered = performClientSort(filtered, 'employee_name');

    const totalCount = filtered.length;
    const activeCount = filtered.filter((n) => n.status === true).length;
    const inactiveCount = totalCount - activeCount;

    // Paginate
    const paginatedData = performClientPagination(filtered, currentPage, pageLimit);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount: inactiveCount,
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allEmployees, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};