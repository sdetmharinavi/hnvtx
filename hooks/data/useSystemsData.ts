import { createGenericDataQuery } from './useGenericDataQuery';
import { DEFAULTS } from '@/constants/constants';

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
    if (filters.system_type_id && s.system_type_id !== filters.system_type_id) return false;
    if (filters.system_capacity_id && s.system_capacity_id !== filters.system_capacity_id)
      return false;
    if (filters.status) {
      const statusBool = filters.status === 'true';
      if (s.status !== statusBool) return false;
    }
    return true;
  },
});
