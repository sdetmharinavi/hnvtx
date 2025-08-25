// =================================================================
// MASTER TABLES (Using the corrected helpers)
// =================================================================

import z from "zod";

export const lookupTypeSchema = z.object({
  id: z.uuid().optional(),
  category: z.string().min(1, { message: "Category is required." }),
  name: z.string().min(1, { message: "Name is required." }),
  code: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  sort_order: z.number().int().default(0).optional(),
  is_system_default: z.boolean().default(false).optional(),
  status: z.boolean().default(true).optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const maintenanceAreaSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().min(1, { message: "Area name is required." }),
  code: z.string().optional().nullable(),
  area_type_id: z.uuid().optional().nullable(),
  parent_id: z.uuid().optional().nullable(),
  contact_person: z.string().optional().nullable(),
  contact_number: z.string().optional().nullable(),
  email: z
    .email({ message: "Invalid email address." })
    .optional()
    .or(z.literal("")),
  latitude: z.string().optional().nullable(),
  longitude: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  status: z.boolean().default(true).optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const employeeDesignationSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().min(1, { message: "Designation name is required." }),
  parent_id: z.uuid().optional().nullable(),
  status: z.boolean().default(true).optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const employeeSchema = z.object({
  id: z.uuid().optional(),
  employee_name: z.string().min(1, { message: "Employee name is required." }),
  employee_pers_no: z.string().optional().nullable(),
  employee_contact: z.string().optional().nullable(),
  employee_email: z.email({ message: "Invalid email address." })
    .optional()
    .or(z.literal("")),
  // dob/doj should not be future dates
  employee_dob: z.coerce
    .date<Date>()
    .optional()
    .nullable()
    .refine((date) => !date || date < new Date(), {
      message: "Date of birth cannot be in the future.",
    }),
  employee_doj: z.coerce
    .date<Date>()
    .optional()
    .nullable()
    .refine((date) => !date || date < new Date(), {
      message: "Date of joining cannot be in the future.",
    }),
  employee_designation_id: z.string().uuid().optional().nullable(),
  employee_addr: z.string().optional().nullable(),
  maintenance_terminal_id: z.string().uuid().optional().nullable(),
  remark: z.string().optional().nullable(),
  status: z.boolean().default(true).optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});
