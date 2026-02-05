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
    
    // NEW: Handle Stock Status Filter
    if (filters.stock_status) {
        const qty = item.quantity || 0;
        if (filters.stock_status === 'in_stock' && qty <= 0) return false;
        if (filters.stock_status === 'out_of_stock' && qty > 0) return false;
    }
    
    return true;
  },
});