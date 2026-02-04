// hooks/data/useSystemsData.ts
import { createGenericDataQuery } from './useGenericDataQuery';
import { DEFAULTS } from '@/constants/constants';

const matchFilter = (itemValue: unknown, filterValue: unknown) => {
  if (Array.isArray(filterValue)) {
    return filterValue.includes(itemValue);
  }
  return itemValue === filterValue;
};

export const useSystemsData = createGenericDataQuery<'v_systems_complete'>({
  tableName: 'v_systems_complete',
  searchFields: [
    'system_name',
    'system_type_name',
    'node_name',
    'make',
    's_no',
    'ip_address',
    'remark',
  ],
  serverSearchFields: [
    'system_name',
    'system_type_name',
    'node_name',
    'ip_address::text',
    'make',
    's_no',
    'remark',
  ],
  defaultSortField: 'system_name',
  rpcLimit: DEFAULTS.PAGE_SIZE,
  filterFn: (s, filters) => {
    if (filters.system_type_id && !matchFilter(s.system_type_id, filters.system_type_id)) return false;
    if (
      filters.system_capacity_id &&
      !matchFilter(s.system_capacity_id, filters.system_capacity_id)
    )
      return false;
    
    // THE FIX: Added maintenance_terminal_id check
    if (
      filters.maintenance_terminal_id &&
      !matchFilter(s.maintenance_terminal_id, filters.maintenance_terminal_id)
    )
      return false;
    
    if (filters.status) {
      const statusBool = filters.status === 'true';
      if (s.status !== statusBool) return false;
    }
    return true;
  },
});