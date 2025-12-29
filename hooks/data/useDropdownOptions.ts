// hooks/data/useDropdownOptions.ts
"use client";

import { useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { useLocalFirstQuery } from './useLocalFirstQuery';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import { V_employeesRowSchema, V_systems_completeRowSchema, V_ports_management_completeRowSchema } from '@/schemas/zod-schemas';
import { buildRpcFilters } from '@/hooks/database';

type TableName = 'lookup_types' | 'nodes' | 'maintenance_areas' | 'rings' | 'v_employees' | 'employee_designations';

interface OptionsQuery {
  tableName: TableName;
  valueField: string;
  labelField: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters?: Record<string, any>;
  orderBy?: string;
}

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
        return Object.entries(validFilters).every(([key, val]) => item[key] === val);
      })
      .toArray()
      .then(result => {
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

  // THE FIX: Return the raw data as well so consumers can check other fields
  return { options, isLoading, originalData: data };
}

// --- Specialized Hooks ---

export const useLookupTypeOptions = (category: string) => {
  const { options, isLoading, originalData } = useDropdownOptions({
    tableName: 'lookup_types',
    valueField: 'id',
    labelField: 'name',
    filters: { category, status: true },
    orderBy: 'sort_order'
  });
  const filteredOptions = useMemo(() => options.filter(o => o.label !== 'DEFAULT'), [options]);
  // Pass through originalData (filtered to match options if needed, but usually raw is fine)
  return { options: filteredOptions, isLoading, originalData };
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
      .select('*')
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

// --- NEW RPC-BASED HOOKS FOR SYSTEM CONNECTION MODAL ---

export function useSystemOptions() {
  const onlineQueryFn = async () => {
    // Use RPC to avoid RLS view issues
    const { data, error } = await createClient().rpc('get_paged_data', {
        p_view_name: 'v_systems_complete',
        p_limit: 10000, // Fetch ample amount for dropdown
        p_offset: 0,
        p_order_by: 'system_name',
        p_order_dir: 'asc',
        p_filters: {}
    });
    
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any)?.data || [] as V_systems_completeRowSchema[];
  };

  const localQueryFn = () => {
    return localDb.v_systems_complete.orderBy('system_name').toArray();
  };

  const { data, isLoading } = useLocalFirstQuery<'v_systems_complete'>({
    queryKey: ['system-options'],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_systems_complete,
    autoSync: true
  });

  return { data: data || [], isLoading };
}

export function usePortOptions(systemId: string | null) {
  const onlineQueryFn = async () => {
    if(!systemId) return [];
    
    const rpcFilters = buildRpcFilters({ 
        system_id: systemId,
        port_admin_status: true 
    });

    const { data, error } = await createClient().rpc('get_paged_data', {
        p_view_name: 'v_ports_management_complete',
        p_limit: 1000,
        p_offset: 0,
        p_order_by: 'port',
        p_order_dir: 'asc',
        p_filters: rpcFilters
    });
    
    if (error) throw error;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data as any)?.data || [] as V_ports_management_completeRowSchema[];
  };

  const localQueryFn = () => {
    if(!systemId) return Promise.resolve([]);
    return localDb.v_ports_management_complete
        .where('system_id').equals(systemId)
        .filter(p => p.port_admin_status === true)
        .toArray();
  };

  const { data, isLoading } = useLocalFirstQuery<'v_ports_management_complete'>({
    queryKey: ['port-options', systemId],
    onlineQueryFn,
    localQueryFn,
    dexieTable: localDb.v_ports_management_complete,
    enabled: !!systemId,
    localQueryDeps: [systemId]
  });

  return { data: data || [], isLoading };
}