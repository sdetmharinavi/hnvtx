import { Tables } from "@/types/supabase-types";

// --- TYPE DEFINITIONS ---
export type EmployeeDesignation = Tables<"employee_designations">;

export interface DesignationWithRelations extends EmployeeDesignation {
  parent_designation: EmployeeDesignation | null;
  child_designations: DesignationWithRelations[];
}