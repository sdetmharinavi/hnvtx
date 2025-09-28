import { z } from 'zod';
import { systemsInsertSchema, sdh_systemsInsertSchema, vmux_systemsInsertSchema, ring_based_systemsInsertSchema } from './zod-schemas';

// THIS IS THE NEW, CORRECT SCHEMA FOR THE FORM.
// It allows for optional fields and uses strings for UUIDs, which matches the form's state.
export const systemFormValidationSchema = z.object({
  system_name: z.string().min(1, 'System Name is required.'),
  system_type_id: z.string().min(1, 'System Type is required.'),
  node_id: z.string().min(1, 'Node / Location is required.'),
  maintenance_terminal_id: z.string().uuid().nullable().optional(),
  ip_address: z.string().nullable().optional(),
  commissioned_on: z.date().nullable().optional(),
  remark: z.string().nullable().optional(),
  s_no: z.string().nullable().optional(),
  status: z.boolean().nullable().optional(),
  ring_id: z.string().uuid().nullable().optional(),
  gne: z.string().nullable().optional(),
  make: z.string().nullable().optional(),
  // CORRECTED: vm_id is a string, not a UUID. It inherits this from the base schema.
  vm_id: vmux_systemsInsertSchema.shape.vm_id.optional(),
});

// This is the type that will be used by the form state.
export type SystemFormData = z.infer<typeof systemFormValidationSchema>;