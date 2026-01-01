// hooks/data/useDropdownOptions.ts
'use client';

import { useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import { buildRpcFilters, PublicTableOrViewName } from '@/hooks/database';

interface OptionsQuery {
  tableName: PublicTableOrViewName;
  valueField: string;
  labelField: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters?: Record<string, any>;
  orderBy?: string;
  orderDir?: 'asc' | 'desc'; // Added orderDir support
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const cleanFilters = (filters: Record<string, any>) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const cleaned: Record<string, any> = {};
  Object.keys(filters).forEach((key) => {
    if (filters[key] !== undefined) {
      cleaned[key] = filters[key];
    }
  });
  return cleaned;
};

export function useDropdownOptions({
  tableName,
  valueField,
  labelField,
  filters = {},
  orderBy = 'name',
  orderDir = 'asc',
}: OptionsQuery) {
  // THE FIX: Switched from Direct Select to RPC 'get_paged_data'
  // This ensures we bypass RLS issues on Views and get complete data (no nulls).
  const onlineQueryFn = async () => {
    const validFilters = cleanFilters(filters);

    // We fetch a large limit to simulate "all options" for a dropdown
    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: tableName,
      p_limit: 10000,
      p_offset: 0,
      p_filters: buildRpcFilters(validFilters),
      p_order_by: orderBy,
      p_order_dir: orderDir, // Use the dynamic direction
    });

    if (error) throw error;

    // The RPC returns { data: [...], count: ... }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any)?.data || [];
  };

  const localQueryFn = () => {
    const table = localDb.table(tableName);
    const validFilters = cleanFilters(filters);

    if (Object.keys(validFilters).length === 0) {
      // Local Dexie sorting is simple, manual sort below handles direction
      return table
        .orderBy(orderBy)
        .toArray()
        .then((result) => sortResult(result));
    }

    return table
      .filter((item) => {
        return Object.entries(validFilters).every(([key, val]) => {
          const itemVal = item[key];
          if (key === 'status' && typeof val === 'boolean') {
            return String(itemVal) === String(val);
          }
          return itemVal === val;
        });
      })
      .toArray()
      .then((result) => sortResult(result));
  };

  // Helper to sort local results based on direction
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sortResult = (result: any[]) => {
    return result.sort((a, b) => {
      const valA = a[orderBy];
      const valB = b[orderBy];
      let comparison = 0;

      if (typeof valA === 'string' && typeof valB === 'string') {
        comparison = valA.localeCompare(valB, undefined, { numeric: true, sensitivity: 'base' });
      } else {
        comparison = valA > valB ? 1 : valA < valB ? -1 : 0;
      }

      return orderDir === 'asc' ? comparison : -comparison;
    });
  };

  const { data, isLoading } = useLocalFirstQuery({
    queryKey: ['dropdown-options', tableName, filters, orderBy, orderDir],
    onlineQueryFn,
    localQueryFn,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dexieTable: localDb.table(tableName) as any,
    staleTime: 60 * 60 * 1000,
    autoSync: true,
  });

  const options: Option[] = useMemo(() => {
    if (!data) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((item: any) => ({
      value: String(item[valueField]),
      label: String(item[labelField]),
    }));
  }, [data, valueField, labelField]);

  return { options, isLoading, originalData: data };
}

// ... (Rest of the file exports) ...

// Updated to accept orderBy
export const useLookupTypeOptions = (
  category: string,
  orderDir: 'asc' | 'desc' = 'asc',
  orderBy: string = 'sort_order' // Added orderBy parameter with default
) => {
  const { options, isLoading, originalData } = useDropdownOptions({
    tableName: 'lookup_types',
    valueField: 'id',
    labelField: 'name',
    filters: { category, status: true },
    orderBy,
    orderDir,
  });
  const filteredOptions = useMemo(() => options.filter((o) => o.label !== 'DEFAULT'), [options]);
  return { options: filteredOptions, isLoading, originalData };
};

export const useActiveNodeOptions = () => {
  return useDropdownOptions({
    tableName: 'nodes',
    valueField: 'id',
    labelField: 'name',
    filters: { status: true },
  });
};

export const useMaintenanceAreaOptions = () => {
  return useDropdownOptions({
    tableName: 'maintenance_areas',
    valueField: 'id',
    labelField: 'name',
    filters: { status: true },
  });
};

export const useActiveRingOptions = () => {
  return useDropdownOptions({
    tableName: 'rings',
    valueField: 'id',
    labelField: 'name',
    filters: { status: true },
  });
};

export function useEmployeeOptions() {
  const onlineQueryFn = async () => {
    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_employees',
      p_limit: 10000,
      p_offset: 0,
      p_filters: { status: true },
      p_order_by: 'employee_name',
    });

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any)?.data || [];
  };

  const localQueryFn = () => {
    return localDb.v_employees
      .orderBy('employee_name')
      .filter((e) => e.status === true)
      .toArray();
  };

  const { data, isLoading } = useLocalFirstQuery<'v_employees'>({
    queryKey: ['employee-options'],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_employees,
    autoSync: true,
  });

  const options: Option[] = useMemo(() => {
    if (!data) return [];
    return data.map((e) => ({
      value: e.id!,
      label: `${e.employee_name} ${
        e.employee_designation_name ? `(${e.employee_designation_name})` : ''
      } ${e.maintenance_area_name ? `(${e.maintenance_area_name})` : ''}`,
    }));
  }, [data]);

  return { options, isLoading };
}

export function useSystemOptions() {
  const onlineQueryFn = async () => {
    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_systems_complete',
      p_limit: 10000,
      p_offset: 0,
      p_order_by: 'system_name',
      p_order_dir: 'asc',
      p_filters: {},
    });

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any)?.data || [];
  };

  const localQueryFn = () => {
    return localDb.v_systems_complete.orderBy('system_name').toArray();
  };

  const { data, isLoading } = useLocalFirstQuery<'v_systems_complete'>({
    queryKey: ['system-options'],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_systems_complete,
    autoSync: true,
  });

  return { data: data || [], isLoading };
}

export function usePortOptions(systemId: string | null) {
  const onlineQueryFn = async () => {
    if (!systemId) return [];

    const rpcFilters = buildRpcFilters({
      system_id: systemId,
      port_admin_status: true,
    });

    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_ports_management_complete',
      p_limit: 1000,
      p_offset: 0,
      p_order_by: 'port',
      p_order_dir: 'asc',
      p_filters: rpcFilters,
    });

    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any)?.data || [];
  };

  const localQueryFn = () => {
    if (!systemId) return Promise.resolve([]);
    return localDb.v_ports_management_complete
      .where('system_id')
      .equals(systemId)
      .filter((p) => p.port_admin_status === true)
      .toArray();
  };

  const { data, isLoading } = useLocalFirstQuery<'v_ports_management_complete'>({
    queryKey: ['port-options', systemId],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_ports_management_complete,
    enabled: !!systemId,
    localQueryDeps: [systemId],
  });

  return { data: data || [], isLoading };
}
