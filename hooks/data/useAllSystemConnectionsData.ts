// hooks/data/useAllSystemConnectionsData.ts
import { createGenericDataQuery } from './useGenericDataQuery';

const matchFilter = (itemValue: unknown, filterValue: unknown) => {
  if (Array.isArray(filterValue)) {
    return filterValue.includes(itemValue);
  }
  return itemValue === filterValue;
};

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
    'en_interface',
    'system_working_interface',
    'system_protection_interface',
    'en_protection_interface',
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
    'en_interface',
    'system_working_interface',
    'system_protection_interface',
    'en_protection_interface',
  ],
  defaultSortField: 'service_name',
  // rpcLimit removed
  orderBy: 'asc',
  filterFn: (c, filters) => {
    // Media Type Filter
    if (filters.media_type_id && !matchFilter(c.media_type_id, filters.media_type_id)) {
      return false;
    }

    // Link Type Filter
    if (
      filters.connected_link_type_id &&
      !matchFilter(c.connected_link_type_id, filters.connected_link_type_id)
    ) {
      return false;
    }

    // Status Filter
    if (filters.status !== undefined && filters.status !== '') {
      const statusBool = String(filters.status) === 'true';
      if (c.status !== statusBool) return false;
    }

    return true;
  },
});
