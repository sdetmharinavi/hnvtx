// hooks/data/useMaintenanceAreasData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_maintenance_areasRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { MaintenanceAreaWithRelations } from '@/config/areas';

/**
 * Implements the local-first data fetching strategy for the Maintenance Areas page.
 * This version now correctly constructs the hierarchical data expected by the UI.
 */
export const useMaintenanceAreasData = (
  params: DataQueryHookParams
): DataQueryHookReturn<MaintenanceAreaWithRelations> => {
  const { filters, searchQuery } = params;

  // 1. Online Fetcher (remains the same, fetches the flat view)
  const onlineQueryFn = useCallback(async (): Promise<V_maintenance_areasRowSchema[]> => {
    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchQuery
        ? `(name.ilike.%${searchQuery}%,code.ilike.%${searchQuery}%,contact_person.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%)`
        : undefined,
    });
    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_maintenance_areas',
      p_limit: 5000,
      p_offset: 0,
      p_filters: rpcFilters,
      p_order_by: 'name',
    });
    if (error) throw error;
    return (data as { data: V_maintenance_areasRowSchema[] })?.data || [];
  }, [searchQuery, filters]);

  // 2. Offline Fetcher (remains the same)
  const localQueryFn = useCallback(() => {
    return localDb.v_maintenance_areas.toArray();
  }, []);

  // 3. Use the local-first query hook
  const {
    data: allAreasFlat = [],
    isLoading,
    isFetching,
    error,
    refetch,
  } = useLocalFirstQuery<'v_maintenance_areas'>({
    queryKey: ['maintenance_areas-data', searchQuery, filters],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_maintenance_areas,
  });

  // 4. Client-side processing (filtering, hierarchy construction, pagination)
  const processedData = useMemo(() => {
    if (!allAreasFlat) {
      return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }

    let filtered = allAreasFlat;
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      const searchFilteredIds = new Set<string>();
      
      // Initial filter based on search term
      const initialFilter = filtered.filter(area => 
        area.name?.toLowerCase().includes(lowerQuery) ||
        area.code?.toLowerCase().includes(lowerQuery) ||
        area.contact_person?.toLowerCase().includes(lowerQuery) ||
        area.email?.toLowerCase().includes(lowerQuery)
      );

      // Include parents of matched items to maintain tree structure
      const addParents = (area: V_maintenance_areasRowSchema) => {
        if (area.id && !searchFilteredIds.has(area.id)) {
          searchFilteredIds.add(area.id);
          if (area.parent_id) {
            const parent = allAreasFlat.find(a => a.id === area.parent_id);
            if (parent) {
              addParents(parent);
            }
          }
        }
      };
      initialFilter.forEach(addParents);
      filtered = allAreasFlat.filter(area => area.id && searchFilteredIds.has(area.id));
    }

    if (filters.status) {
      filtered = filtered.filter(area => String(area.status) === filters.status);
    }
    if (filters.area_type_id) {
      filtered = filtered.filter(area => area.area_type_id === filters.area_type_id);
    }

    // --- THE FIX: Construct the hierarchical data structure ---
    const areasWithRelations = filtered.map(area => ({
      ...area,
      id: area.id!, // Assert id is not null after filtering
      name: area.name!, // Assert name is not null
      area_type: null, // Placeholder
      parent_area: null, // Placeholder
      child_areas: [],   // Placeholder
    })) as MaintenanceAreaWithRelations[];
    
    const areaMap = new Map(areasWithRelations.map(a => [a.id, a]));

    areasWithRelations.forEach(area => {
      if (area.parent_id) {
        const parent = areaMap.get(area.parent_id);
        if (parent) {
          parent.child_areas.push(area);
          area.parent_area = parent;
        }
      }
    });
    // --- END FIX ---

    const totalCount = filtered.length;
    const activeCount = filtered.filter((a) => a.status === true).length;
    
    // For hierarchical data, pagination is often handled differently (e.g., virtual scrolling)
    // or applied only to root items. Here, we'll return the full structure for the EntityManagementComponent to handle.
    return {
      data: areasWithRelations,
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
    };
  }, [allAreasFlat, searchQuery, filters]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};