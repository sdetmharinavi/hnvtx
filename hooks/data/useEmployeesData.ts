// hooks/data/useEmployeesData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_employeesRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { DEFAULTS } from '@/constants/constants';

/**
 * This is the refactored data fetching hook for the Employees page.
 * It now uses the `useLocalFirstQuery` hook to implement a local-first strategy.
 */
export const useEmployeesData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_employeesRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  // THE FIX: Wrap onlineQueryFn in useCallback.
  const onlineQueryFn = useCallback(async (): Promise<V_employeesRowSchema[]> => {
    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchQuery
        ? `(employee_name.ilike.%${searchQuery}%,employee_pers_no.ilike.%${searchQuery}%,employee_email.ilike.%${searchQuery}%,employee_contact.ilike.%${searchQuery}%)`
        : undefined,
    });
    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_employees',
      p_limit: 5000, // Fetch all for client-side filtering
      p_offset: 0,
      p_filters: rpcFilters,
    });
    if (error) throw error;
    return (data as { data: V_employeesRowSchema[] })?.data || [];
  }, [searchQuery, filters]);

  // THE FIX: Wrap localQueryFn in useCallback.
  const localQueryFn = useCallback(() => {
    return localDb.v_employees.toArray();
  }, []);

  // 3. Use the local-first query hook
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

  // 4. Client-side processing
  const processedData = useMemo(() => {
    if (!allEmployees) {
        return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }
    
    let filtered = allEmployees;
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (emp) =>
          emp.employee_name?.toLowerCase().includes(lowerQuery) ||
          emp.employee_pers_no?.toLowerCase().includes(lowerQuery) ||
          emp.employee_email?.toLowerCase().includes(lowerQuery) ||
          emp.employee_contact?.toLowerCase().includes(lowerQuery) ||
          emp.employee_designation_name?.toLowerCase().includes(lowerQuery)
      );
    }
    if (filters.employee_designation_id) {
      filtered = filtered.filter((emp) => emp.employee_designation_id === filters.employee_designation_id);
    }
    if (filters.maintenance_terminal_id) {
      filtered = filtered.filter((emp) => emp.maintenance_terminal_id === filters.maintenance_terminal_id);
    }
    if (filters.status) {
      const statusBool = filters.status === 'true';
      filtered = filtered.filter((emp) => emp.status === statusBool);
    }

    const totalCount = filtered.length;
    const activeCount = filtered.filter((n) => n.status === true).length;
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
    };
  }, [allEmployees, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};