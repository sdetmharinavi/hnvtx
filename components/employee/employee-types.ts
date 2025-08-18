// app/dashboard/employees/types.ts
import { Tables } from "@/types/supabase-types";

export type EmployeeWithRelations = Tables<"employees"> & {
  maintenance_areas: Tables<"maintenance_areas"> | null;
  employee_designations: Tables<"employee_designations"> | null;
};

export type EmployeeFilters = {
  search: string;
  designation: string;
  status: "true" | "false" | "";
  maintenanceTerminal: string;
};

