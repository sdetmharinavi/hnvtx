// path: schemas/system-schemas.ts
import { z } from 'zod';
import { systemsInsertSchema, ring_based_systemsInsertSchema } from './zod-schemas';

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
    // THE FIX: Allow empty string (default state) or valid UUID.
    // Transform empty string to null for the backend.
    ring_id: z
      .union([z.uuid(), z.literal('')])
      .optional()
      .nullable()
      .transform((val) => val || null),

    // ADDED: order_in_ring with transformation to handle empty form inputs
    order_in_ring: ring_based_systemsInsertSchema.shape.order_in_ring
      .transform((val) => {
        if (val == null) return null; // This catches both null and undefined
        const stringVal = String(val);
        if (stringVal === '') return null;
        const num = Number(stringVal);
        return Number.isNaN(num) ? null : num;
      })
      .optional(),

    // ADDED: System Capacity
    system_capacity_id: z
      .union([z.uuid(), z.literal('')])
      .optional()
      .nullable()
      .transform((val) => val || null),
  });

// This is the type that will be used by the form state.
export type SystemFormData = z.infer<typeof systemFormValidationSchema>;
