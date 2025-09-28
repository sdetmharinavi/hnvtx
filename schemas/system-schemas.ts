// path: schemas/system-schemas.ts

import { z } from 'zod';
import { systemsInsertSchema, sdh_systemsInsertSchema, vmux_systemsInsertSchema, ring_based_systemsInsertSchema } from './zod-schemas';

// Base schema for common fields, using the auto-generated one.
// This forms the core of the form data.
const baseSystemSchema = systemsInsertSchema.pick({
    system_name: true,
    system_type_id: true,
    node_id: true,
    maintenance_terminal_id: true,
    ip_address: true,
    commissioned_on: true,
    remark: true,
    status: true,
    s_no: true,
});

// A general form schema that includes all possible subtype fields as optional.
// This is perfect for the form's state before the final validation.
export const generalSystemFormSchema = baseSystemSchema.extend({
    gne: sdh_systemsInsertSchema.shape.gne.optional(),
    make: sdh_systemsInsertSchema.shape.make.optional(),
    vm_id: vmux_systemsInsertSchema.shape.vm_id.optional(),
    ring_id: ring_based_systemsInsertSchema.shape.ring_id.optional(),
});

export type SystemFormData = z.infer<typeof generalSystemFormSchema>;

/**
 * DYNAMIC SCHEMA VALIDATION FUNCTION
 *
 * This function should be used inside your form's `onSubmit` handler.
 * It takes the form data and a map of actual system type UUIDs (fetched from the DB)
 * and returns a strictly validated object ready for submission.
 * This approach removes the need for hardcoded UUIDs.
 *
 * @param formData - The raw data from the react-hook-form.
 * @param typeUUIDs - An object mapping system type names to their actual UUIDs.
 *                    Example: { SDH: 'uuid-for-sdh', VMUX: 'uuid-for-vmux', ... }
 * @returns A validated object or throws a Zod validation error.
 */
export const validateSystemForm = (
  formData: SystemFormData,
  typeUUIDs: Record<string, string>
) => {
  const { system_type_id } = formData;
  
  // Schemas for specific system subtypes
  const sdhSchema = baseSystemSchema.extend({
    system_type_id: z.literal(typeUUIDs.SDH),
    gne: sdh_systemsInsertSchema.shape.gne,
    make: sdh_systemsInsertSchema.shape.make,
  });

  const vmuxSchema = baseSystemSchema.extend({
    system_type_id: z.literal(typeUUIDs.VMUX),
    vm_id: vmux_systemsInsertSchema.shape.vm_id,
  });

  const ringBasedSchema = baseSystemSchema.extend({
    system_type_id: z.union([
      z.literal(typeUUIDs.CPAN),
      z.literal(typeUUIDs.MAAN),
    ]),
    ring_id: ring_based_systemsInsertSchema.shape.ring_id,
  });

  // Determine which schema to use based on the selected system_type_id
  if (system_type_id === typeUUIDs.SDH) {
    return sdhSchema.parse(formData);
  }
  if (system_type_id === typeUUIDs.VMUX) {
    return vmuxSchema.parse(formData);
  }
  if (system_type_id === typeUUIDs.CPAN || system_type_id === typeUUIDs.MAAN) {
    return ringBasedSchema.parse(formData);
  }
  
  // Default validation for any other system type that doesn't have special fields
  return baseSystemSchema.parse(formData);
};