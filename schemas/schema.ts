import { z } from "zod";

// =================================================================
// HELPERS (Definitively Corrected using the proper pattern)
// =================================================================

const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.){3}(25[0-5]|(2[0-4]|1\d|[1-9]|)\d)$/;
const ipValidation = z.string().regex(ipv4Regex, { message: "Invalid IPv4 address format." });

// 1. Define the base number schema with custom error messages.
const baseNumberSchema = z.number().refine(
  (val) => typeof val === "number",
  { message: "This field must be a number." }
);

// 2. Create a preprocessor for OPTIONAL numbers.
const emptyStringToNumber = z.preprocess(
  (val) => (val === "" || val === null ? undefined : val),
  baseNumberSchema.optional() // Use the base schema and make it optional.
);

// 3. Create a preprocessor for REQUIRED numbers.
const requiredStringToNumber = z.preprocess(
  (val) => (val === "" || val === null ? undefined : val),
  baseNumberSchema // Use the base schema which is required by default.
);


export const userSchema = z.object({
  email: z.email("Invalid email address"),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .max(50, "Password must not exceed 50 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, "Password must contain at least one uppercase letter, one lowercase letter, one number and one special character"),
});

export const signupSchema = userSchema
  .extend({
    firstName: z.string().min(1, "First name is required").max(50, "First name must not exceed 50 characters"),
    lastName: z.string().min(1, "Last name is required").max(50, "Last name must not exceed 50 characters"),
    confirmPassword: z.string().min(6, "Confirm password is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords must match",
    path: ["confirmPassword"],
  });

export type UserFormData = z.infer<typeof userSchema>;
export type SignupFormData = z.infer<typeof signupSchema>;


// =================================================================
// MASTER TABLES (Using the corrected helpers)
// =================================================================

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
  email: z.email({ message: "Invalid email address." }).optional().or(z.literal('')),
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
  employee_email: z.email({ message: "Invalid email address." }).optional().or(z.literal('')),
  // dob/doj should not be future dates
  employee_dob: z.coerce.date().optional().nullable().refine(date => !date || (date < new Date()), {
    message: "Date of birth cannot be in the future.",
  }),
  employee_doj: z.coerce.date().optional().nullable().refine(date => !date || (date < new Date()), {
    message: "Date of joining cannot be in the future.",
  }),
  employee_designation_id: z.uuid().optional().nullable(),
  employee_addr: z.string().optional().nullable(),
  maintenance_terminal_id: z.uuid().optional().nullable(),
  remark: z.string().optional().nullable(),
  status: z.boolean().default(true).optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

// =================================================================
// CORE INFRASTRUCTURE
// =================================================================

export const ringSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().min(1, { message: "Ring name is required." }),
  ring_type_id: z.uuid().optional().nullable(),
  description: z.string().optional().nullable(),
  maintenance_terminal_id: z.uuid().optional().nullable(),
  total_nodes: z.number().int().default(0).optional(),
  status: z.boolean().default(true).optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const nodeSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().min(1, { message: "Node name is required." }),
  node_type_id: z.uuid().optional().nullable(),
  ip_address: ipValidation.optional().or(z.literal('')),
  latitude: emptyStringToNumber,
  longitude: emptyStringToNumber,
  vlan: z.string().optional().nullable(),
  site_id: z.string().optional().nullable(),
  builtup: z.string().optional().nullable(),
  maintenance_terminal_id: z.uuid().optional().nullable(),
  ring_id: z.uuid().optional().nullable(),
  order_in_ring: z.number().int().optional().nullable(),
  ring_status: z.string().default('ACTIVE').optional(),
  east_port: z.string().optional().nullable(),
  west_port: z.string().optional().nullable(),
  remark: z.string().optional().nullable(),
  status: z.boolean().default(true).optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const ofcCableSchema = z.object({
  id: z.uuid().optional(),
  route_name: z.string().min(1, { message: "Route name is required." }),
  starting_node_id: z.uuid({ message: "Starting node is required." }),
  ending_node_id: z.uuid({ message: "Ending node is required." }),
  ofc_type_id: z.uuid({ message: "OFC type is required." }),
  // capacity must be a positive integer
  capacity: requiredStringToNumber.pipe(z.number().int({ message: "Capacity must be an integer." }).refine(val => val > 0, { message: "Capacity must be a positive integer." })),
  // current_rkm must be a positive number
  current_rkm: emptyStringToNumber.pipe(z.number().refine(val => val >= 0, { message: "Current RKM must be a positive number." })),
  transnet_id: z.string().optional().nullable(),
  // transnet_rkm must be a positive number
  transnet_rkm: emptyStringToNumber.pipe(z.number().refine(val => val >= 0, { message: "Transnet RKM must be a positive number." })),
  asset_no: z.string().optional().nullable(),
  maintenance_terminal_id: z.uuid().optional().nullable(),
  commissioned_on: z.coerce.date().optional().nullable(),
  remark: z.string().optional().nullable(),
  status: z.boolean().default(true).optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
}).superRefine((data, ctx) => {
  const a = data.starting_node_id;
  const b = data.ending_node_id;
  // Run this check only when both IDs are present
  if (!a || !b) return;
  if (a === b) {
    ctx.addIssue({
      code: 'custom',
      message: "Ending node must be different from starting node.",
      path: ["ending_node_id"],
    });
  }
});

export const systemSchema = z.object({
  id: z.uuid().optional(),
  system_type_id: z.string().uuid({ message: "System type is required." }),
  node_id: z.string().uuid({ message: "Node is required." }),
  system_name: z.string().optional().nullable(),
  ip_address: ipValidation.optional().or(z.literal('')),
  maintenance_terminal_id: z.uuid().optional().nullable(),
  commissioned_on: z.coerce.date().optional().nullable(),
  remark: z.string().optional().nullable(),
  status: z.boolean().default(true).optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const ofcConnectionSchema = z.object({
  id: z.uuid().optional(),
  ofc_id: z.string().uuid({ message: "OFC Cable is required." }),
  node_a_id: z.string().uuid({ message: "Node A is required." }),
  fiber_no_ea: z.number().int().optional().nullable(),
  otdr_distance_ea_km: emptyStringToNumber,
  ea_dom: z.coerce.date().optional().nullable(),
  ea_power_dbm: emptyStringToNumber,
  system_a_id: z.uuid().optional().nullable(),
  node_b_id: z.string().uuid({ message: "Node B is required." }),
  fiber_no_eb: z.number().int().optional().nullable(),
  otdr_distance_eb_km: emptyStringToNumber,
  eb_dom: z.coerce.date().optional().nullable(),
  eb_power_dbm: emptyStringToNumber,
  route_loss_db: emptyStringToNumber,
  system_b_id: z.uuid().optional().nullable(),
  remark: z.string().optional().nullable(),
  status: z.boolean().default(true).optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const systemConnectionSchema = z.object({
  id: z.uuid().optional(),
  system_id: z.string().uuid({ message: "System is required." }),
  node_a_id: z.uuid().optional().nullable(),
  node_b_id: z.uuid().optional().nullable(),
  connected_system_id: z.uuid().optional().nullable(),
  ea_ip: ipValidation.optional().or(z.literal('')),
  ea_interface: z.string().optional().nullable(),
  eb_ip: ipValidation.optional().or(z.literal('')),
  eb_interface: z.string().optional().nullable(),
  media_type_id: z.uuid().optional().nullable(),
  bandwidth_mbps: z.number().int().optional().nullable(),
  vlan: z.string().optional().nullable(),
  commissioned_on: z.coerce.date().optional().nullable(),
  remark: z.string().optional().nullable(),
  status: z.boolean().default(true).optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const managementPortSchema = z.object({
  id: z.uuid().optional(),
  port_no: z.string().min(1, { message: "Port number is required." }),
  name: z.string().optional().nullable(),
  node_id: z.uuid().optional().nullable(),
  system_id: z.uuid().optional().nullable(),
  commissioned_on: z.coerce.date().optional().nullable(),
  remark: z.string().optional().nullable(),
  status: z.boolean().default(true).optional(),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

export const sdhNodeAssociationSchema = z.object({
  id: z.uuid().optional(),
  sdh_system_id: z.string().uuid({ message: "SDH System is required." }),
  node_id: z.string().uuid({ message: "Node is required." }),
  node_position: z.enum(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']).optional().nullable(),
  node_ip: ipValidation.optional().or(z.literal('')),
});

// =================================================================
// SYSTEM-SPECIFIC TABLES
// =================================================================

export const cpanSystemSchema = z.object({
  system_id: z.uuid(),
  ring_no: z.string().optional().nullable(),
  area: z.string().optional().nullable(),
});

export const maanSystemSchema = z.object({
  system_id: z.uuid(),
  ring_no: z.string().optional().nullable(),
  area: z.string().optional().nullable(),
});

export const sdhSystemSchema = z.object({
  system_id: z.uuid(),
  gne: z.string().optional().nullable(),
  make: z.string().optional().nullable(),
});

export const vmuxSystemSchema = z.object({
  system_id: z.uuid(),
  vm_id: z.string().optional().nullable(),
});

export const cpanConnectionSchema = z.object({
  system_connection_id: z.uuid(),
  sfp_port: z.string().optional().nullable(),
  sfp_type_id: z.uuid().optional().nullable(),
  sfp_capacity: z.string().optional().nullable(),
  sfp_serial_no: z.string().optional().nullable(),
  fiber_in: z.number().int().optional().nullable(),
  fiber_out: z.number().int().optional().nullable(),
  customer_name: z.string().optional().nullable(),
  bandwidth_allocated_mbps: z.number().int().optional().nullable(),
});

export const maanConnectionSchema = cpanConnectionSchema.extend({});

export const sdhConnectionSchema = z.object({
  system_connection_id: z.uuid(),
  stm_no: z.string().optional().nullable(),
  carrier: z.string().optional().nullable(),
  a_slot: z.string().optional().nullable(),
  a_customer: z.string().optional().nullable(),
  b_slot: z.string().optional().nullable(),
  b_customer: z.string().optional().nullable(),
});

export const vmuxConnectionSchema = z.object({
  system_connection_id: z.uuid(),
  subscriber: z.string().optional().nullable(),
  c_code: z.string().optional().nullable(),
  channel: z.string().optional().nullable(),
  tk: z.string().optional().nullable(),
});

// =================================================================
// USER MANAGEMENT
// =================================================================

export const userProfileSchema = z.object({
  id: z.uuid().optional(),
  first_name: z.string().min(1, { message: "First name cannot be empty." }),
  last_name: z.string().min(1, { message: "Last name cannot be empty." }),
  avatar_url: z.string().url({ message: "Invalid URL format." }).optional().or(z.literal('')),
  phone_number: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format.")
    .optional().or(z.literal('')),
  date_of_birth: z.coerce.date().optional().nullable()
    .refine(date => !date || (date > new Date("1900-01-01") && date < new Date()), {
      message: "Please enter a valid date of birth.",
    }),
  role: z.enum([
    'admin',
    'viewer',
    'cpan_admin',
    'maan_admin',
    'sdh_admin',
    'vmux_admin',
    'mng_admin'
  ]).default('viewer'),
  designation: z.string().optional().nullable(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip_code: z.string().optional(),
    country: z.string().optional(),
  }).default({}).optional(),
  preferences: z.record(z.string(), z.any()).default({}).optional(),
  status: z.enum(['active', 'inactive', 'suspended']).default('inactive'),
  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});


// =================================================================
// TYPE EXPORTS
// =================================================================
export type LookupType = z.infer<typeof lookupTypeSchema>;
export type MaintenanceArea = z.infer<typeof maintenanceAreaSchema>;
export type EmployeeDesignation = z.infer<typeof employeeDesignationSchema>;
export type Employee = z.infer<typeof employeeSchema>;
export type Ring = z.infer<typeof ringSchema>;
export type Node = z.infer<typeof nodeSchema>;
export type OfcCable = z.infer<typeof ofcCableSchema>;
export type System = z.infer<typeof systemSchema>;
export type OfcConnection = z.infer<typeof ofcConnectionSchema>;
export type SystemConnection = z.infer<typeof systemConnectionSchema>;
export type ManagementPort = z.infer<typeof managementPortSchema>;
export type SdhNodeAssociation = z.infer<typeof sdhNodeAssociationSchema>;
export type CpanSystem = z.infer<typeof cpanSystemSchema>;
export type MaanSystem = z.infer<typeof maanSystemSchema>;
export type SdhSystem = z.infer<typeof sdhSystemSchema>;
export type VmuxSystem = z.infer<typeof vmuxSystemSchema>;
export type CpanConnection = z.infer<typeof cpanConnectionSchema>;
export type MaanConnection = z.infer<typeof maanConnectionSchema>;
export type SdhConnection = z.infer<typeof sdhConnectionSchema>;
export type VmuxConnection = z.infer<typeof vmuxConnectionSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;