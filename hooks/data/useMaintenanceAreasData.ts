// hooks/data/useMaintenanceAreasData.ts
import { useMemo, useCallback } from 'react';
import { DataQueryHookParams, DataQueryHookReturn } from '@/hooks/useCrudManager';
import { V_maintenance_areasRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { buildRpcFilters } from '@/hooks/database';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { MaintenanceAreaWithRelations } from '@/config/areas';

export const useMaintenanceAreasData = (
  params: DataQueryHookParams
): DataQueryHookReturn<MaintenanceAreaWithRelations> => {
  const { filters, searchQuery } = params;

  const onlineQueryFn = useCallback(async (): Promise<V_maintenance_areasRowSchema[]> => {
    // FIX: Use standard SQL syntax
    let searchString: string | undefined;
    if (searchQuery && searchQuery.trim() !== '') {
      const term = searchQuery.trim().replace(/'/g, "''");
      searchString =
        `(` +
        `name ILIKE '%${term}%' OR ` +
        `code ILIKE '%${term}%' OR ` +
        `contact_person ILIKE '%${term}%' OR ` +
        `email ILIKE '%${term}%'` +
        `)`;
    }

    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchString,
    });

    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_maintenance_areas',
      p_limit: 5000,
      p_offset: 0,
      p_filters: rpcFilters,
      // THE FIX: Ensure sorting by name
      p_order_by: 'name',
      p_order_dir: 'asc',
    });
    if (error) throw error;
    return (data as { data: V_maintenance_areasRowSchema[] })?.data || [];
  }, [searchQuery, filters]);

  const localQueryFn = useCallback(() => {
    // THE FIX: Ensure local sorting by name
    return localDb.v_maintenance_areas.orderBy('name').toArray();
  }, []);

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

  const processedData = useMemo(() => {
    if (!allAreasFlat) {
      return { data: [], totalCount: 0, activeCount: 0, inactiveCount: 0 };
    }

    let filtered = allAreasFlat;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      const searchFilteredIds = new Set<string>();

      const initialFilter = filtered.filter(
        (area) =>
          area.name?.toLowerCase().includes(lowerQuery) ||
          area.code?.toLowerCase().includes(lowerQuery) ||
          area.contact_person?.toLowerCase().includes(lowerQuery) ||
          area.email?.toLowerCase().includes(lowerQuery)
      );

      const addParents = (area: V_maintenance_areasRowSchema) => {
        if (area.id && !searchFilteredIds.has(area.id)) {
          searchFilteredIds.add(area.id);
          if (area.parent_id) {
            const parent = allAreasFlat.find((a) => a.id === area.parent_id);
            if (parent) {
              addParents(parent);
            }
          }
        }
      };
      initialFilter.forEach(addParents);
      filtered = allAreasFlat.filter((area) => area.id && searchFilteredIds.has(area.id));
    }

    if (filters.status) {
      filtered = filtered.filter((area) => String(area.status) === filters.status);
    }
    if (filters.area_type_id) {
      filtered = filtered.filter((area) => area.area_type_id === filters.area_type_id);
    }

    // THE FIX: Explicit case-insensitive sort for safety (though hook already sorts)
    filtered.sort((a, b) =>
      (a.name || '').localeCompare(b.name || '', undefined, { sensitivity: 'base' })
    );

    const areasWithRelations = filtered.map((area) => ({
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

    const totalCount = filtered.length;
    const activeCount = filtered.filter((a) => a.status === true).length;

    return {
      data: areasWithRelations,
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
    };
  }, [allAreasFlat, searchQuery, filters]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};
