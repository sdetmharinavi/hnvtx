// path: schemas/system-schemas.ts
import { z } from 'zod';
import {
  systemsInsertSchema,
  sdh_systemsInsertSchema,
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
    ring_id: ring_based_systemsInsertSchema.shape.ring_id.transform((val) => val || null).optional(),
    // ADDED: order_in_ring with transformation to handle empty form inputs
    order_in_ring: ring_based_systemsInsertSchema.shape.order_in_ring.transform(val => {
      if (val == null) return null; // This catches both null and undefined
      const stringVal = String(val);
      if (stringVal === '') return null;
      const num = Number(stringVal);
      return Number.isNaN(num) ? null : num;
    }).optional(),
    gne: sdh_systemsInsertSchema.shape.gne.transform((val) => val || null).optional(),
  });

// This is the type that will be used by the form state.
export type SystemFormData = z.infer<typeof systemFormValidationSchema>;