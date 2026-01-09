import { createGenericDataQuery } from "./useGenericDataQuery";
import { DEFAULTS } from "@/constants/constants";

export const useNodesData = createGenericDataQuery<"v_nodes_complete">({
  tableName: "v_nodes_complete",
  searchFields: ["name", "node_type_code", "remark", "latitude", "longitude"],
  // Server search needs text casting for numbers
  serverSearchFields: ["name", "node_type_code", "remark", "latitude::text", "longitude::text"],
  defaultSortField: "name",
  rpcLimit: DEFAULTS.PAGE_SIZE,
  filterFn: (node, filters) => {
    // 1. Standard Filters
    if (filters.node_type_id && node.node_type_id !== filters.node_type_id) return false;
    if (
      filters.maintenance_terminal_id &&
      node.maintenance_terminal_id !== filters.maintenance_terminal_id
    )
      return false;
    if (filters.status) {
      const statusBool = filters.status === "true";
      if (node.status !== statusBool) return false;
    }

    // 2. Custom Logic: Coordinates Status
    if (filters.coordinates_status) {
      const hasCoords =
        node.latitude !== null &&
        node.latitude !== undefined &&
        node.longitude !== null &&
        node.longitude !== undefined;

      if (filters.coordinates_status === "with_coords" && !hasCoords) return false;
      if (filters.coordinates_status === "without_coords" && hasCoords) return false;
    }

    return true;
  },
});