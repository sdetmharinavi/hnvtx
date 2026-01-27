// hooks/data/useEmployeesData.ts
import { createGenericDataQuery } from './useGenericDataQuery';
import { DEFAULTS } from '@/constants/constants';

const matchFilter = (itemValue: unknown, filterValue: unknown) => {
  if (Array.isArray(filterValue)) {
    return filterValue.includes(itemValue);
  }
  return itemValue === filterValue;
};

export const useEmployeesData = createGenericDataQuery<'v_employees'>({
  tableName: 'v_employees',
  searchFields: [
    'employee_name',
    'employee_pers_no',
    'employee_email',
    'employee_contact',
    'employee_designation_name',
  ],
  defaultSortField: 'employee_name',
  rpcLimit: DEFAULTS.PAGE_SIZE,
  filterFn: (emp, filters) => {
    if (
      filters.employee_designation_id &&
      !matchFilter(emp.employee_designation_id, filters.employee_designation_id)
    )
      return false;
    if (
      filters.maintenance_terminal_id &&
      !matchFilter(emp.maintenance_terminal_id, filters.maintenance_terminal_id)
    )
      return false;
    if (filters.status) {
      const statusBool = filters.status === 'true';
      if (emp.status !== statusBool) return false;
    }
    return true;
  },
});