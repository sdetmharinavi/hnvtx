import { createGenericDataQuery } from './useGenericDataQuery';
import { DEFAULTS } from '@/constants/constants';

export const useServicesData = createGenericDataQuery<'v_services'>({
  tableName: 'v_services',
  searchFields: [
    'name',
    'node_name',
    'end_node_name',
    'description',
    'link_type_name',
    'vlan',
    'unique_id',
  ],
  defaultSortField: 'name',
  rpcLimit: DEFAULTS.PAGE_SIZE,
  filterFn: (s, filters) => {
    if (filters.link_type_id && s.link_type_id !== filters.link_type_id) return false;

    if (filters.status) {
      const statusBool = filters.status === 'true';
      if (s.status !== statusBool) return false;
    }

    // Custom Allocation Status Logic
    if (filters.allocation_status) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const systems = s.allocated_systems as any[];
      const hasSystems = Array.isArray(systems) && systems.length > 0;

      if (filters.allocation_status === 'allocated' && !hasSystems) return false;
      if (filters.allocation_status === 'unallocated' && hasSystems) return false;
    }

    return true;
  },
});
