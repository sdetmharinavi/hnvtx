// hooks/data/useEmployeesData.ts
import { useGenericDataQuery } from "./useGenericDataQuery";
import { DEFAULTS } from "@/constants/constants";

export const useEmployeesData = useGenericDataQuery<"v_employees">({
  tableName: "v_employees",
  searchFields: [
    "employee_name",
    "employee_pers_no",
    "employee_email",
    "employee_contact",
    "employee_designation_name",
  ],
  defaultSortField: "employee_name",
  rpcLimit: DEFAULTS.PAGE_SIZE,
  filterFn: (emp, filters) => {
    if (
      filters.employee_designation_id &&
      emp.employee_designation_id !== filters.employee_designation_id
    )
      return false;
    if (
      filters.maintenance_terminal_id &&
      emp.maintenance_terminal_id !== filters.maintenance_terminal_id
    )
      return false;
    if (filters.status) {
      const statusBool = filters.status === "true";
      if (emp.status !== statusBool) return false;
    }
    return true;
  },
});
