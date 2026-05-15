// hooks/data/useMaintenanceAreasData.ts
import { useMemo } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_maintenance_areasRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { buildRpcFilters } from '@/hooks/database';
import { MaintenanceAreaWithRelations } from '@/config/areas';
import { useQuery } from '@tanstack/react-query';
import { buildServerSearchString } from '@/hooks/database/search-utils';

export const useMaintenanceAreasData = (
  params: DataQueryHookParams
): DataQueryHookReturn<MaintenanceAreaWithRelations> => {
  const { filters, searchQuery, currentPage, pageLimit } = params;
  const supabase = createClient();

  const {
    data: allAreas = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useQuery({
    queryKey: ['maintenance_areas-data', searchQuery, filters],
    queryFn: async (): Promise<V_maintenance_areasRowSchema[]> => {
      const serverSearchFields = ['name', 'code', 'contact_person', 'email'];
      const searchString = buildServerSearchString(searchQuery, serverSearchFields);

      const rpcFilters = buildRpcFilters({
        ...filters,
        or: searchString,
      });

      const { data, error } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_maintenance_areas',
        p_limit: 5000,
        p_offset: 0,
        p_filters: rpcFilters,
        p_order_by: 'name',
        p_order_dir: 'asc',
      });
      
      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return ((data as any)?.data || []) as V_maintenance_areasRowSchema[];
    },
    staleTime: 5 * 60 * 1000
  });

  const processedData = useMemo(() => {
    // 1. Client-side hierarchy construction is needed since the View is flat
    const areasWithRelations = allAreas.map((area) => ({
      ...area,
      id: area.id!,
      name: area.name!,
      area_type: null,
      parent_area: null,
      child_areas: [],
    })) as MaintenanceAreaWithRelations[];

    const areaMap = new Map(areasWithRelations.map((a) => [a.id, a]));

    areasWithRelations.forEach((area) => {
      if (area.parent_id) {
        const parent = areaMap.get(area.parent_id);
        if (parent) {
          parent.child_areas.push(area);
          area.parent_area = parent;
        }
      }
    });

    // Pagination logic applied after hierarchy build (though hierarchy usually shows all)
    // If strict pagination is needed on root elements, we filter here.
    // For now, simple client pagination of the flat list (or roots) could be done.
    // We'll return all for Tree view compatibility, or paginate flat if needed.
    
    // For this specific hook, since we often need the full tree, 
    // returning the full processed list for the UI to paginate or render as tree is safer.
    // However, useCrudManager expects pagination.
    
    const totalCount = allAreas.length;
    const activeCount = allAreas.filter((a) => a.status === true).length;
    
    // Slice if necessary (though for Tree View, usually we want everything)
    // Assuming Tree view handles its own rendering if 'list' mode is off.
    // In 'list' mode, slicing happens here.
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = areasWithRelations.slice(start, end);

    return {
      data: paginatedData, // Or areasWithRelations if tree view is priority
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
    };
  }, [allAreas, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};