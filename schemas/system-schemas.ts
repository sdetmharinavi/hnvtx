import { z } from 'zod';
import { systemsInsertSchema, sdh_systemsInsertSchema, vmux_systemsInsertSchema, ring_based_systemsInsertSchema } from './zod-schemas';

// THIS IS THE NEW, CORRECT SCHEMA FOR THE FORM.
// It allows for optional fields and uses strings for UUIDs, which matches the form's state.
export const systemFormValidationSchema = systemsInsertSchema.omit({
  created_at: true,
  updated_at: true,
  id: true,
}) & ({
  ring_id: ring_based_systemsInsertSchema.pick({ ring_id: true }),
  gne: sdh_systemsInsertSchema.pick({ gne: true }),
  vm_id: vmux_systemsInsertSchema.pick({ vm_id: true }),
});

// This is the type that will be used by the form state.
export type SystemFormData = z.infer<typeof systemFormValidationSchema>;
