// path: schemas/system-schemas.ts
import { z } from 'zod';
import { systemsInsertSchema, ring_based_systemsInsertSchema } from './zod-schemas';

// THIS IS THE FINAL, CORRECT SCHEMA FOR THE FORM.
// It uses .extend() and correctly marks the added fields as .optional()
// to match the form's data structure.
export const systemFormValidationSchema = systemsInsertSchema
  .omit({
    created_at: true,
    updated_at: true,
    id: true,
  })
  .extend({
    // THE FIX: Override unique_id to be a string
    unique_id: z
      .string()
      .optional()
      .nullable()
      .transform(val => val === '' ? null : val),

    ring_id: z
      .union([z.uuid(), z.literal('')])
      .optional()
      .nullable()
      .transform((val) => val || null),

    order_in_ring: ring_based_systemsInsertSchema.shape.order_in_ring
      .transform((val) => {
        if (val == null) return null; 
        const stringVal = String(val);
        if (stringVal === '') return null;
        const num = Number(stringVal);
        return Number.isNaN(num) ? null : num;
      })
      .optional(),

    system_capacity_id: z
      .union([z.uuid(), z.literal('')])
      .optional()
      .nullable()
      .transform((val) => val || null),

    asset_no: z
      .string()
      .optional()
      .nullable()
      .transform(val => val === '' ? null : val),
  });

// This is the type that will be used by the form state.
export type SystemFormData = z.infer<typeof systemFormValidationSchema>;