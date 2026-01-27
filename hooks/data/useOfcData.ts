// hooks/data/useOfcData.ts
import { createGenericDataQuery } from './useGenericDataQuery';
import { DEFAULTS } from '@/constants/constants';

const matchFilter = (itemValue: unknown, filterValue: unknown) => {
  if (Array.isArray(filterValue)) {
    return filterValue.includes(itemValue);
  }
  return itemValue === filterValue;
};

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
    if (filters.ofc_type_id && !matchFilter(c.ofc_type_id, filters.ofc_type_id)) return false;
    if (filters.ofc_owner_id && !matchFilter(c.ofc_owner_id, filters.ofc_owner_id)) return false;
    if (
      filters.maintenance_terminal_id &&
      !matchFilter(c.maintenance_terminal_id, filters.maintenance_terminal_id)
    )
      return false;

    if (filters.status) {
      const statusBool = filters.status === 'true';
      if (c.status !== statusBool) return false;
    }

    return true;
  },
});