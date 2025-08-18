// hooks/useOfcData.ts
import { useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import { usePagedOfcCablesComplete, useTableQuery } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { Json } from '@/types/supabase-types';
import { OfcCablesFilters } from '@/components/ofc/ofc-types';

interface UseOfcDataProps {
  filters: OfcCablesFilters;
  searchTerm: string;
  currentPage: number;
  pageLimit: number;
}

export const useOfcData = ({ 
  filters, 
  searchTerm, 
  currentPage, 
  pageLimit 
}: UseOfcDataProps) => {
  const supabase = createClient();
  const [debouncedSearchTerm] = useDebounce(searchTerm, 300);

  // Server filters
  const serverFilters = useMemo((): Json => {
    const f: Json = {};
    if (filters.status) f.status = filters.status === "true";
    if (filters.ofc_type_id) f.ofc_type_id = filters.ofc_type_id;
    if (debouncedSearchTerm) {
      f.asset_no = { 
        operator: "ilike", 
        value: `%${debouncedSearchTerm}%` 
      };
    }
    return f;
  }, [filters, debouncedSearchTerm]);

  // Main nodes query
  const nodesQuery = usePagedOfcCablesComplete(supabase, {
    filters: serverFilters,
    orderBy: "asset_no",
    limit: pageLimit,
    offset: (currentPage - 1) * pageLimit
  });

  // Lookup types query
  const { data: nodeTypes = [] } = useTableQuery(supabase, "lookup_types", {
    filters: {
      category: {
        operator: "in",
        value: ["NODE_TYPES", "RING_TYPES"],
      },
    },
    orderBy: [{ column: "name", ascending: true }],
  });

  // Rings query
  const { data: ringsData = [] } = useTableQuery(supabase, "rings", {
    orderBy: [{ column: "name", ascending: true }],
    columns: "id, name",
  });

  // Maintenance terminals query
  const { data: maintenanceTerminalsData = [] } = useTableQuery(
    supabase, 
    "maintenance_areas", 
    {
      orderBy: [{ column: "name", ascending: true }],
      columns: "id, name",
    }
  );

  // Transform and filter data
  const transformedData = useMemo(() => {
    const safeNodeTypes = Array.isArray(nodeTypes) ? nodeTypes : [];
    
    const filteredNodeTypes: NodeType[] = safeNodeTypes
      .filter((type: any) => 
        type.name !== "DEFAULT" && type.category !== "RING_TYPES"
      )
      .map((type: any) => ({
        id: String(type.id || ""),
        name: String(type.name || ""),
        category: String(type.category || "")
      }));

    const filteredRingTypes: NodeType[] = safeNodeTypes
      .filter((type: any) => 
        type.name !== "DEFAULT" && type.category !== "NODE_TYPES"
      )
      .map((type: any) => ({
        id: String(type.id || ""),
        name: String(type.name || ""),
        category: String(type.category || "")
      }));

    const rings: Ring[] = Array.isArray(ringsData) 
      ? ringsData.map((ring: any) => ({
          id: String(ring.id || ""),
          name: String(ring.name || ""),
        }))
      : [];

    const maintenanceTerminals: MaintenanceTerminal[] = Array.isArray(maintenanceTerminalsData)
      ? maintenanceTerminalsData.map((terminal: any) => ({
          id: String(terminal.id || ""),
          name: String(terminal.name || ""),
        }))
      : [];

    return {
      filteredNodeTypes,
      filteredRingTypes,
      rings,
      maintenanceTerminals,
    };
  }, [nodeTypes, ringsData, maintenanceTerminalsData]);

  // Calculate total count safely
  const totalCount = useMemo(() => {
    try {
      const data = nodesQuery.data as Array<{ total_count?: number }> | undefined | null;
      if (Array.isArray(data) && data.length > 0) {
        const firstItem = data[0];
        return typeof firstItem?.total_count === "number" 
          ? firstItem.total_count 
          : data.length;
      }
      return 0;
    } catch (error) {
      console.error('Error calculating total count:', error);
      return 0;
    }
  }, [nodesQuery.data]);

  const allOfc = useMemo(() => {
    return Array.isArray(nodesQuery.data) ? nodesQuery.data : [];
  }, [nodesQuery.data]);

  return {
    nodesQuery,
    allOfc,
    totalCount,
    ...transformedData,
    debouncedSearchTerm,
  };
};