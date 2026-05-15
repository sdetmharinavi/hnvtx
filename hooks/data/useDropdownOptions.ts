// hooks/data/useDropdownOptions.ts
'use client';

import { useMemo } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import { buildRpcFilters, PublicTableOrViewName } from '@/hooks/database';
import { Lookup_typesRowSchema } from '@/schemas/zod-schemas';

interface OptionsQuery {
  tableName: PublicTableOrViewName;
  valueField: string;
  labelField: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters?: Record<string, any>;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
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
  const supabase = createClient();

  const { data, isLoading } = useQuery({
    queryKey: ['dropdown-options', tableName, filters, orderBy, orderDir],
    queryFn: async () => {
      const validFilters = cleanFilters(filters);
      
      const { data, error } = await supabase.rpc('get_paged_data', {
        p_view_name: tableName,
        p_limit: 10000,
        p_offset: 0,
        p_filters: buildRpcFilters(validFilters),
        p_order_by: orderBy,
        p_order_dir: orderDir,
      });

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any)?.data || [];
    },
    staleTime: 1000 * 60 * 10, // 10 minutes cache
    refetchOnWindowFocus: false,
  });

  const options: Option[] = useMemo(() => {
    if (!data) return [];
    const uniqueLabels = new Set<string>();
    const uniqueOptions: Option[] = [];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data.forEach((item: any) => {
      const label = String(item[labelField]);
      const value = String(item[valueField]);

      if (!uniqueLabels.has(label)) {
        uniqueLabels.add(label);
        uniqueOptions.push({ value, label });
      }
    });

    return uniqueOptions;
  }, [data, valueField, labelField]);

  return { options, isLoading, originalData: data || [] };
}

export const useLookupTypeOptions = (
  category: string,
  orderDir: 'asc' | 'desc' = 'asc',
  orderBy: string = 'sort_order',
  labelField: string = 'name'
) => {
  const { options, isLoading, originalData } = useDropdownOptions({
    tableName: 'v_lookup_types',
    valueField: 'id',
    labelField: labelField,
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
  const supabase = createClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ['employee-options'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_employees',
        p_limit: 10000,
        p_offset: 0,
        p_filters: { status: true },
        p_order_by: 'employee_name',
      });

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any)?.data || [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const options: Option[] = useMemo(() => {
    if (!data) return [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return data.map((e: any) => ({
      value: e.id!,
      label: `${e.employee_name} ${
        e.employee_designation_name ? `(${e.employee_designation_name})` : ''
      } ${e.maintenance_area_name ? `(${e.maintenance_area_name})` : ''}`,
    }));
  }, [data]);

  return { options, isLoading };
}

export function useSystemOptions() {
  const supabase = createClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ['system-options'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_paged_data', {
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
    },
    staleTime: 1000 * 60 * 5,
  });

  return { data: data || [], isLoading };
}

export function usePortOptions(systemId: string | null) {
  const supabase = createClient();
  
  const { data, isLoading } = useQuery({
    queryKey: ['port-options', systemId],
    queryFn: async () => {
      if (!systemId) return [];

      const rpcFilters = buildRpcFilters({
        system_id: systemId,
        port_admin_status: true,
      });

      const { data, error } = await supabase.rpc('get_paged_data', {
        p_view_name: 'v_ports_management_complete',
        p_limit: 10000,
        p_offset: 0,
        p_order_by: 'port',
        p_order_dir: 'asc',
        p_filters: rpcFilters,
      });

      if (error) throw error;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (data as any)?.data || [];
    },
    enabled: !!systemId,
    staleTime: 1000 * 60 * 5,
  });

  return { data: data || [], isLoading };
}