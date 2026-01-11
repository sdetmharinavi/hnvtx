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
  ],
  defaultSortField: 'service_name',
  rpcLimit: DEFAULTS.PAGE_SIZE,
  filterFn: (c, filters) => {
    if (filters.media_type_id && c.media_type_id !== filters.media_type_id) return false;
    if (
      filters.connected_link_type_id &&
      c.connected_link_type_id !== filters.connected_link_type_id
    )
      return false;

    if (filters.status) {
      const statusBool = filters.status === 'true';
      if (c.status !== statusBool) return false;
    }
    return true;
  },
});
