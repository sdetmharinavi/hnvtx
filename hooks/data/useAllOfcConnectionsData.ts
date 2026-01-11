import { createGenericDataQuery } from './useGenericDataQuery';
import { DEFAULTS } from '@/constants/constants';

export const useAllOfcConnectionsData = createGenericDataQuery<'v_ofc_connections_complete'>({
  tableName: 'v_ofc_connections_complete',
  searchFields: [
    'ofc_route_name',
    'system_name',
    'sn_name',
    'en_name',
    'maintenance_area_name',
    'remark',
  ],
  defaultSortField: 'ofc_route_name',
  rpcLimit: DEFAULTS.PAGE_SIZE,
  filterFn: (c, filters) => {
    if (filters.ofc_type_name && c.ofc_type_name !== filters.ofc_type_name) return false;

    if (filters.status) {
      const statusBool = filters.status === 'true';
      if (c.status !== statusBool) return false;
    }

    return true;
  },
});
