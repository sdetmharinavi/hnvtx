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
  filters?: Record<string, string | boolean | undefined>; // Allow undefined in type to handle optional props
  orderBy?: string;
}

// Helper to remove undefined keys which crash IndexedDB queries
const cleanFilters = (filters: Record<string, unknown>) => {
  const cleaned: Record<string, unknown> = {};
  Object.keys(filters).forEach(key => {
    if (filters[key] !== undefined) {
      cleaned[key] = filters[key];
    }
  });
  return cleaned;
};

/**
 * A centralized, offline-first hook to fetch and format data for dropdown select components.
 * @param config - The configuration for which table and fields to query.
 */
export function useDropdownOptions({ tableName, valueField, labelField, filters = {}, orderBy = 'name' }: OptionsQuery) {

  const onlineQueryFn = async () => {
    // Remove undefined filters before sending to Supabase
    const validFilters = cleanFilters(filters) as Record<string, string | boolean>;
    
    const { data, error } = await createClient()
      .from(tableName)
      .select(`${valueField}, ${labelField}`)
      .match(validFilters)
      .order(orderBy);
    if (error) throw error;
    return data || [];
  };

  const localQueryFn = () => {
    const table = localDb.table(tableName);
    const validFilters = cleanFilters(filters);
    
    // If no filters, just sort
    if (Object.keys(validFilters).length === 0) {
      return table.orderBy(orderBy).toArray();
    }

    // Try robust filtering: Collection.filter() is safer than .where() for complex mixed types/indexes
    // It scans the table (or uses simple index if possible) and filters in JS
    return table
      .filter(item => {
        return Object.entries(validFilters).every(([key, val]) => item[key] === val);
      })
      .toArray()
      .then(result => {
        // Apply sorting in JS after filtering to avoid "Compound Index" requirements for .where().sortBy()
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
    staleTime: 60 * 60 * 1000, // 1 hour
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

// --- Specialized Hooks for Convenience ---

// export const useLookupTypeOptions = (category: string) => {
//   return useDropdownOptions({
//     tableName: 'lookup_types',
//     valueField: 'id',
//     labelField: 'name',
//     filters: { category, name: 'DEFAULT', status: true }, // We rely on logic to fix this: name != DEFAULT is not supported by match. 
//     // Actually, 'match' in Supabase is equality.
//     // To properly support "not equal", we'd need a more complex query builder.
//     // For now, let's filter client side or assume the caller handles it.
//     // Wait, the previous implementation had logic for this. 
//     // Let's assume standard equality for this generic hook for now, 
//     // and filter DEFAULT out in the options map if needed, 
//     // BUT 'match' {name: 'DEFAULT'} will only return DEFAULT.
//     // Let's remove 'name' from filters here and filter in memory if we can't express NEQ easily in this generic wrapper.
//     // UPDATED: Removed name filter here, handled by specialized filtering logic if needed, or we rely on the component to filter "DEFAULT".
//     // Actually, let's keep it simple: fetch all for category, filter DEFAULT in UI components if critical.
//     // Or, we fix the filter passed:
//     // filters: { category, status: true } 
//     // and filter 'DEFAULT' in the useMemo below? No, useDropdownOptions is generic.
    
//     // Correction: Let's just fetch active ones for category.
//     // Components usually ignore 'DEFAULT' or we can add a filter prop later.
//   });
// };
// FIX: Redefined to simple filter
export const useLookupTypeOptionsSimple = (category: string) => {
    const { options, isLoading } = useDropdownOptions({
        tableName: 'lookup_types',
        valueField: 'id',
        labelField: 'name',
        filters: { category, status: true },
        orderBy: 'sort_order'
    });
    
    // Filter out DEFAULT here
    const filteredOptions = useMemo(() => options.filter(o => o.label !== 'DEFAULT'), [options]);
    return { options: filteredOptions, isLoading };
};
// Re-export as the main one
export const useLookupTypeOptions = useLookupTypeOptionsSimple;


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

// Specialized hook for employees with custom label formatting
export function useEmployeeOptions() {
  const onlineQueryFn = async () => {
    const { data, error } = await createClient()
      .from('v_employees')
      .select('id, employee_name, employee_designation_name, maintenance_area_name')
      .eq('status', true)
      .order('employee_name');
    if (error) throw error;
    return (data || []) as V_employeesRowSchema[];
  };

  const localQueryFn = () => {
    // THE FIX: Use orderBy().filter() to safely handle sorting + boolean filtering
    // This avoids "Failed to execute 'bound' on 'IDBKeyRange'" errors.
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