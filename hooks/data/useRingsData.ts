import { createGenericDataQuery } from "./useGenericDataQuery";
import { DEFAULTS } from "@/constants/constants";

export const useRingsData = createGenericDataQuery<"v_rings">({
  tableName: "v_rings",
  searchFields: ["name", "description", "ring_type_name", "maintenance_area_name"],
  defaultSortField: "name",
  rpcLimit: DEFAULTS.PAGE_SIZE,
  filterFn: (r, filters) => {
    if (filters.status) {
      const statusBool = filters.status === "true";
      if (r.status !== statusBool) return false;
    }
    if (filters.ring_type_id && r.ring_type_id !== filters.ring_type_id) return false;
    if (
      filters.maintenance_terminal_id &&
      r.maintenance_terminal_id !== filters.maintenance_terminal_id
    )
      return false;

    // Status Selects
    if (filters.ofc_status && r.ofc_status !== filters.ofc_status) return false;
    if (filters.spec_status && r.spec_status !== filters.spec_status) return false;
    if (filters.bts_status && r.bts_status !== filters.bts_status) return false;

    return true;
  },
});