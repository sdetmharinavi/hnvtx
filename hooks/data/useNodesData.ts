// hooks/data/useNodesData.ts
import { createGenericDataQuery } from './useGenericDataQuery';

// Helper for array/single value matching
const matchFilter = (itemValue: unknown, filterValue: unknown) => {
  if (Array.isArray(filterValue)) {
    return filterValue.includes(itemValue);
  }
  return itemValue === filterValue;
};

export const useNodesData = createGenericDataQuery<'v_nodes_complete'>({
  tableName: 'v_nodes_complete',
  searchFields: ['name', 'node_type_code', 'remark', 'latitude', 'longitude'],
  serverSearchFields: ['name', 'node_type_code', 'remark', 'latitude::text', 'longitude::text'],
  defaultSortField: 'name',
  // rpcLimit removed to use default 6000
  filterFn: (node, filters) => {
    if (filters.node_type_id && !matchFilter(node.node_type_id, filters.node_type_id)) return false;
    if (
      filters.maintenance_terminal_id &&
      !matchFilter(node.maintenance_terminal_id, filters.maintenance_terminal_id)
    )
      return false;

    if (filters.status) {
      const statusBool = filters.status === 'true';
      if (node.status !== statusBool) return false;
    }

    if (filters.coordinates_status) {
      const hasCoords =
        node.latitude !== null &&
        node.latitude !== undefined &&
        node.longitude !== null &&
        node.longitude !== undefined;

      if (filters.coordinates_status === 'with_coords' && !hasCoords) return false;
      if (filters.coordinates_status === 'without_coords' && hasCoords) return false;
    }

    return true;
  },
});