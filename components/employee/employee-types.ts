// app/dashboard/employees/types.ts
import {
  Employee_designationsInsertSchema,
  EmployeesInsertSchema,
  Maintenance_areasInsertSchema,
} from '@/schemas/zod-schemas';

export type EmployeeWithRelations = EmployeesInsertSchema & {
  maintenance_areas: Maintenance_areasInsertSchema | null;
  employee_designations: Employee_designationsInsertSchema | null;
};
