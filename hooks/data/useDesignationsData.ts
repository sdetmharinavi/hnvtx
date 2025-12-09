// hooks/data/useDesignationsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_employee_designationsRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { DesignationWithRelations } from '@/config/designations';

export const useDesignationsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<DesignationWithRelations> => {
  const { filters, searchQuery } = params;

  const onlineQueryFn = useCallback(async (): Promise<V_employee_designationsRowSchema[]> => {
    // FIX: Use standard SQL syntax
    let searchString: string | undefined;
    if (searchQuery && searchQuery.trim() !== '') {
        const term = searchQuery.trim().replace(/'/g, "''");
        searchString = `(name ILIKE '%${term}%')`;
    }

    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchString,
    });
    
    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_employee_designations',
      p_limit: 5000,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'name',
    });
    if (error) throw error;
    return (data as { data: V_employee_designationsRowSchema[] })?.data || [];
  }, [searchQuery, filters]);

  const localQueryFn = useCallback(() => {
    return localDb.v_employee_designations.toArray();
  }, []);

  const {
    data: allDesignationsFlat = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'v_employee_designations'>({
    queryKey: ['employee_designations-data', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_employee_designations,
  });

  const processedData = useMemo(() => {
    if (!allDesignationsFlat) {
      return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }

    let filtered = allDesignationsFlat.filter(d => d.id != null);

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      const searchFilteredIds = new Set<string>();

      const initialFilter = filtered.filter(d => d.name?.toLowerCase().includes(lowerQuery));

      const addParents = (designation: V_employee_designationsRowSchema) => {
        if (designation.id && !searchFilteredIds.has(designation.id)) {
          searchFilteredIds.add(designation.id);
          if (designation.parent_id) {
            const parent = allDesignationsFlat.find(d => d.id === designation.parent_id);
            if (parent) addParents(parent);
          }
        }
      };
      initialFilter.forEach(addParents);
      filtered = allDesignationsFlat.filter(d => d.id && searchFilteredIds.has(d.id));
    }

    if (filters.status) {
      filtered = filtered.filter(d => String(d.status) === filters.status);
    }

    const designationsWithRelations = filtered.map(d => ({
      ...d,
      id: d.id!,
      name: d.name!,
      parent_designation: null,
      child_designations: [],
    })) as DesignationWithRelations[];

    const designationMap = new Map(designationsWithRelations.map(d => [d.id, d]));

    designationsWithRelations.forEach(designation => {
      if (designation.parent_id) {
        const parent = designationMap.get(designation.parent_id);
        if (parent) {
          parent.child_designations.push(designation);
          designation.parent_designation = parent;
        }
      }
    });

    const totalCount = filtered.length;
    const activeCount = filtered.filter((d) => d.status === true).length;

    return {
      data: designationsWithRelations,
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
    };
  }, [allDesignationsFlat, searchQuery, filters]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};