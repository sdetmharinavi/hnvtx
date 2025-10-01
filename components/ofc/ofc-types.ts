import { z } from 'zod';
import { v_ofc_cables_completeRowSchema } from "@/schemas/zod-schemas";

export interface OfcCablesFilters {
  search: string;
  ofc_type_id: string;
  status: "true" | "false" | "";
  maintenance_terminal_id: string;
}

// THE FIX: This type now extends the auto-generated Zod schema type.
export type OfcCablesWithRelations = z.infer<typeof v_ofc_cables_completeRowSchema> & {
  ofc_type: {
    id: string;
    name: string;
  } | null;
  maintenance_area: {
    id: string;
    name: string;
  } | null;
};

