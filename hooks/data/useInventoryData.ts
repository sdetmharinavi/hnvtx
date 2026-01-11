import { createGenericDataQuery } from './useGenericDataQuery';
import { DEFAULTS } from '@/constants/constants';

export const useInventoryData = createGenericDataQuery<'v_inventory_items'>({
  tableName: 'v_inventory_items',
  searchFields: ['name', 'description', 'asset_no'],
  defaultSortField: 'name',
  rpcLimit: DEFAULTS.PAGE_SIZE,
  filterFn: (item, filters) => {
    if (filters.category_id && item.category_id !== filters.category_id) return false;
    if (filters.location_id && item.location_id !== filters.location_id) return false;
    return true;
  },
});
