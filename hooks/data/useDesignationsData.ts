// hooks/data/useDesignationsData.ts
import { useMemo } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_employee_designationsRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { buildRpcFilters } from '@/hooks/database';
import { DesignationWithRelations } from '@/config/designations';
import { buildServerSearchString } from '@/hooks/database/search-utils';
import { useQuery } from '@tanstack/react-query';

export const useDesignationsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<DesignationWithRelations> => {
  const { filters, searchQuery } = params;
  const supabase = createClient();

  const {
    data: allDesignationsFlat = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['employee_designations-data', searchQuery, filters],
    queryFn: async (): Promise<V_employee_designationsRowSchema[]> => {
      const serverSearchFields = ['name'];
      const searchString = buildServerSearchString(searchQuery, serverSearchFields);
      const rpcFilters = buildRpcFilters({ ...filters, or: searchString });

      const { data, error } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_employee_designations',
        p_limit: 5000,
        p_offset: 0,
        p_filters: rpcFilters,
        p_order_by: 'name',
      });
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data as any)?.data || []) as V_employee_designationsRowSchema[];
    },
    staleTime: 5 * 60 * 1000
  });

  const processedData = useMemo(() => {
    // Basic client-side processing for hierarchy (required for the UI tree view)
    // Filter out invalids
    const filtered = (allDesignationsFlat || []).filter((d) => d.id != null);
    
    // Sort
    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));

    // Reconstruct Hierarchy
    const designationsWithRelations = filtered.map((d) => ({
      ...d,
      id: d.id!,
      name: d.name!,
      parent_designation: null,
      child_designations: [],
    })) as DesignationWithRelations[];

    const designationMap = new Map(designationsWithRelations.map((d) => [d.id, d]));

    designationsWithRelations.forEach((designation) => {
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
  }, [allDesignationsFlat]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};