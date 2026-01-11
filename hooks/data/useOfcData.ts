import { createGenericDataQuery } from './useGenericDataQuery';
import { DEFAULTS } from '@/constants/constants';

export const useOfcData = createGenericDataQuery<'v_ofc_cables_complete'>({
  tableName: 'v_ofc_cables_complete',
  searchFields: [
    'route_name',
    'asset_no',
    'transnet_id',
    'sn_name',
    'en_name',
    'ofc_owner_name',
    'remark',
  ],
  defaultSortField: 'route_name',
  rpcLimit: DEFAULTS.PAGE_SIZE,
  filterFn: (c, filters) => {
    if (filters.ofc_type_id && c.ofc_type_id !== filters.ofc_type_id) return false;
    if (filters.ofc_owner_id && c.ofc_owner_id !== filters.ofc_owner_id) return false;
    if (
      filters.maintenance_terminal_id &&
      c.maintenance_terminal_id !== filters.maintenance_terminal_id
    )
      return false;

    if (filters.status) {
      const statusBool = filters.status === 'true';
      if (c.status !== statusBool) return false;
    }

    return true;
  },
});
