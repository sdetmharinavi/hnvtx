import { createGenericDataQuery } from './useGenericDataQuery';
import { DEFAULTS } from '@/constants/constants';

export const useAllSystemConnectionsData = createGenericDataQuery<'v_system_connections_complete'>({
  tableName: 'v_system_connections_complete',
  searchFields: [
    'service_name',
    'system_name',
    'connected_system_name',
    'bandwidth_allocated',
    'unique_id',
    'lc_id',
    'sn_ip',
    'en_ip',
    'services_ip',
    'remark',
    'vlan',
    'sn_interface',
  ],
  serverSearchFields: [
    'service_name',
    'system_name',
    'connected_system_name',
    'bandwidth_allocated',
    'unique_id',
    'lc_id',
    'sn_ip::text',
    'en_ip::text',
    'services_ip::text',
    'remark',
    'vlan::text',
    'sn_interface',
  ],
  defaultSortField: 'service_name',
  rpcLimit: DEFAULTS.PAGE_SIZE,
  orderBy: 'asc', // Explicit sort order
  filterFn: (c, filters) => {
    // Media Type Filter
    if (filters.media_type_id && c.media_type_id !== filters.media_type_id) {
      return false;
    }
    
    // Link Type Filter
    if (
      filters.connected_link_type_id &&
      c.connected_link_type_id !== filters.connected_link_type_id
    ) {
      return false;
    }

    // Status Filter (Handle string 'true'/'false' from selects)
    if (filters.status !== undefined && filters.status !== '') {
      const statusBool = String(filters.status) === 'true';
      if (c.status !== statusBool) return false;
    }

    return true;
  },
});