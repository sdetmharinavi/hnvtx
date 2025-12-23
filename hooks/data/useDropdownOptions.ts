// hooks/data/useDropdownOptions.ts
"use client";

import { useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import { V_employeesRowSchema } from '@/schemas/zod-schemas';

type TableName = 'lookup_types' | 'nodes' | 'maintenance_areas' | 'rings' | 'v_employees' | 'employee_designations';

interface OptionsQuery {
  tableName: TableName;
  valueField: string;
  labelField: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters?: Record<string, any>;
  orderBy?: string;
}

// Helper to remove undefined keys
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cleanFilters = (filters: Record<string, any>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleaned: Record<string, any> = {};
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined) {
      cleaned[key] = filters[key];
    }
  });
  return cleaned;
};

export function useDropdownOptions({ tableName, valueField, labelField, filters = {}, orderBy = 'name' }: OptionsQuery) {
  const onlineQueryFn = async () => {
    const validFilters = cleanFilters(filters);
    
    // THE FIX: Select '*' instead of partial columns.
    // This ensures:
    // 1. We receive fields needed for filtering (e.g., 'status', 'category')
    // 2. We don't overwrite full local records with partial data via bulkPut
    const { data, error } = await createClient()
      .from(tableName)
      .select('*') 
      .match(validFilters)
      .order(orderBy);

    if (error) throw error;
    return data || [];
  };

  const localQueryFn = () => {
    const table = localDb.table(tableName);
    const validFilters = cleanFilters(filters);
    
    if (Object.keys(validFilters).length === 0) {
      return table.orderBy(orderBy).toArray();
    }

    return table
      .filter(item => {
        // Strict local filtering works now because 'item' will have all fields
        return Object.entries(validFilters).every(([key, val]) => item[key] === val);
      })
      .toArray()
      .then(result => {
        // Javascript Sort
        return result.sort((a, b) => {
           const valA = a[orderBy];
           const valB = b[orderBy];
           if (typeof valA === 'string' && typeof valB === 'string') {
               return valA.localeCompare(valB);
           }
           return (valA > valB ? 1 : -1);
        });
      });
  };

  const { data, isLoading } = useLocalFirstQuery({
    queryKey: ['dropdown-options', tableName, filters],
    onlineQueryFn,
    localQueryFn,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dexieTable: localDb.table(tableName) as any,
    staleTime: 60 * 60 * 1000, 
    autoSync: true 
  });

  const options: Option[] = useMemo(() => {
    if (!data) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => ({
      value: String(item[valueField]),
      label: String(item[labelField]),
    }));
  }, [data, valueField, labelField]);

  return { options, isLoading };
}

// --- Specialized Hooks ---

export const useLookupTypeOptions = (category: string) => {
  const { options, isLoading } = useDropdownOptions({
    tableName: 'lookup_types',
    valueField: 'id',
    labelField: 'name',
    filters: { category, status: true }, // Query only active items in category
    orderBy: 'sort_order'
  });

  // Client-side filtering to exclude 'DEFAULT' since match() is equality-only
  const filteredOptions = useMemo(() => 
    options.filter(o => o.label !== 'DEFAULT'), 
  [options]);

  return { options: filteredOptions, isLoading };
};

export const useActiveNodeOptions = () => {
  return useDropdownOptions({
    tableName: 'nodes',
    valueField: 'id',
    labelField: 'name',
    filters: { status: true }
  });
};

export const useMaintenanceAreaOptions = () => {
  return useDropdownOptions({
    tableName: 'maintenance_areas',
    valueField: 'id',
    labelField: 'name',
    filters: { status: true }
  });
};

export const useActiveRingOptions = () => {
  return useDropdownOptions({
    tableName: 'rings',
    valueField: 'id',
    labelField: 'name',
    filters: { status: true }
  });
};

export function useEmployeeOptions() {
  const onlineQueryFn = async () => {
    const { data, error } = await createClient()
      .from('v_employees')
      .select('*') // Changed to * here as well for consistency
      .eq('status', true)
      .order('employee_name');
    if (error) throw error;
    return (data || []) as V_employeesRowSchema[];
  };

  const localQueryFn = () => {
    return localDb.v_employees
        .orderBy('employee_name')
        .filter(e => e.status === true)
        .toArray();
  };

  const { data, isLoading } = useLocalFirstQuery<'v_employees'>({
    queryKey: ['employee-options'],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_employees,
    autoSync: true 
  });

  const options: Option[] = useMemo(() => {
    if (!data) return [];
    return data.map(e => ({
      value: e.id!,
      label: `${e.employee_name} ${e.employee_designation_name ? `(${e.employee_designation_name})` : ''} ${e.maintenance_area_name ? `(${e.maintenance_area_name})` : ''}`
    }));
  }, [data]);

  return { options, isLoading };
}