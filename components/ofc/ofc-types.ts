import { Database } from "@/types/supabase-types";

export interface OfcCablesFilters {
  search: string;
  ofc_type_id: string;
  status: "true" | "false" | "";
  maintenance_terminal_id: string;
}

// FIX: This type now correctly includes the optional 'total_count' field 
// which is added by the useTableQuery hook when `includeCount` is true.
export type OfcCablesWithRelations = 
  Database["public"]["Views"]["v_ofc_cables_complete"]["Row"] & {
  total_count?: number;
  // NOTE: These fields exist on the base table `ofc_cables` and are used by
  // `OfcForm` for initializing edit state, but they are not present in the
  // generated View Row type. Keep them optional to avoid lying about what the
  // view guarantees while allowing the component to reference them safely.
  sn_id?: string | null;
  en_id?: string | null;
  ofc_type: {
    id: string;
    name: string;
  } | null;
  maintenance_area: {
    id: string;
    name: string;
  } | null;
};

