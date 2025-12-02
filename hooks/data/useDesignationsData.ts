// hooks/data/useDesignationsData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_employee_designationsRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { DesignationWithRelations } from '@/config/designations';

/**
 * Implements the local-first data fetching strategy for the Designations page.
 * This version constructs the hierarchical data expected by the UI.
 */
export const useDesignationsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<DesignationWithRelations> => {
  const { filters, searchQuery } = params;

  // 1. Online Fetcher (fetches the flat view)
  const onlineQueryFn = useCallback(async (): Promise<V_employee_designationsRowSchema[]> => {
    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchQuery ? `(name.ilike.%${searchQuery}%)` : undefined,
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

  // 2. Offline Fetcher
  const localQueryFn = useCallback(() => {
    // THE FIX: Query the new view-specific table.
    return localDb.v_employee_designations.toArray();
  }, []);

  // 3. Use the local-first query hook
  const {
    data: allDesignationsFlat = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'v_employee_designations'>({
    // THE FIX: Key must contain 'employee_designations' for uploader invalidation to work
    queryKey: ['employee_designations-data', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    // THE FIX: Point to the new, correctly typed Dexie table.
    dexieTable: localDb.v_employee_designations,
  });

  // 4. Client-side processing
  const processedData = useMemo(() => {
    if (!allDesignationsFlat) {
      return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }
    
    // Filter out records with null IDs, which are invalid for our UI components.
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