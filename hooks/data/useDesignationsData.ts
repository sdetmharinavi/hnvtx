// hooks/data/useDesignationsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_employee_designationsRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { DesignationWithRelations } from '@/config/designations';
import { 
  buildServerSearchString,
  performClientSort,
} from '@/hooks/database/search-utils';

export const useDesignationsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<DesignationWithRelations> => {
  const { filters, searchQuery } = params;

  // Search Config
  const serverSearchFields = useMemo(() => ['name'], []);

  const onlineQueryFn = useCallback(async (): Promise<V_employee_designationsRowSchema[]> => {
    const searchString = buildServerSearchString(searchQuery, serverSearchFields);
    const rpcFilters = buildRpcFilters({ ...filters, or: searchString });

    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_employee_designations',
      p_limit: 5000,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'name',
    });
    if (error) throw error;
    return (data as { data: V_employee_designationsRowSchema[] })?.data || [];
  }, [searchQuery, filters, serverSearchFields]);

  const localQueryFn = useCallback(() => {
    return localDb.v_employee_designations.orderBy('name').toArray();
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
    let filtered = (allDesignationsFlat || []).filter(d => d.id != null);

    // 1. Search
    // We use custom logic here because of the recursive parent/child filtering requirement specific to designations
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      const searchFilteredIds = new Set<string>();

      const initialFilter = filtered.filter(d => d.name?.toLowerCase().includes(lowerQuery));

      // Recursive function to keep parents if child matches search
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

    // 2. Filters
    if (filters.status) {
      filtered = filtered.filter(d => String(d.status) === filters.status);
    }

    // 3. Sort
    filtered = performClientSort(filtered, 'name');

    // 4. Reconstruct Hierarchy (Specific logic for this hook)
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
    const inactiveCount = totalCount - activeCount;

    // Note: Designations page handles pagination internally in the Tree View, 
    // but if we use List view, we might need pagination.
    // For consistency with other hooks, we return all data if it's hierarchical or paginated if list.
    // The current UI component expects full list for tree building.
    
    return {
      data: designationsWithRelations, // Return full list for tree construction
      totalCount,
      activeCount,
      inactiveCount,
    };
  }, [allDesignationsFlat, searchQuery, filters]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};