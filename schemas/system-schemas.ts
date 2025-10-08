// path: schemas/system-schemas.ts
import { z } from 'zod';
import {
  systemsInsertSchema,
  sdh_systemsInsertSchema,
  vmux_systemsInsertSchema,
  ring_based_systemsInsertSchema,
} from './zod-schemas';

// THIS IS THE FINAL, CORRECT SCHEMA FOR THE FORM.
// It uses .extend() and correctly marks the added fields as .optional()
// to match the form's data structure, resolving the TypeScript error.
export const systemFormValidationSchema = systemsInsertSchema
  .omit({
    created_at: true,
    updated_at: true,
    id: true,
  })
  .extend({
    ring_id: ring_based_systemsInsertSchema.shape.ring_id.transform((val) => (val === '' ? null : val)).optional(),
    gne: sdh_systemsInsertSchema.shape.gne.transform((val) => (val === '' ? null : val)).optional(),
    vm_id: vmux_systemsInsertSchema.shape.vm_id.transform((val) => (val === '' ? null : val)).optional(),
  });

// This is the type that will be used by the form state.
export type SystemFormData = z.infer<typeof systemFormValidationSchema>;