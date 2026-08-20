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

    // --- EDITED SECTION START ---
    // Added logic to filter by systems currently present at the node.
    // We check if there is an intersection between selected types and the node's aggregated system_type_ids.
    if (filters.system_type_id) {
      const selectedSystemTypes = Array.isArray(filters.system_type_id)
        ? filters.system_type_id
        : [filters.system_type_id];

      if (selectedSystemTypes.length > 0) {
        // If the node has NO systems, it shouldn't match any system-based filter.
        if (!node.system_type_ids || node.system_type_ids.length === 0) return false;

        const hasMatch = selectedSystemTypes.some(typeId => 
          node.system_type_ids!.includes(typeId)
        );
        
        if (!hasMatch) return false;
      }
    }
    // --- EDITED SECTION END ---

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