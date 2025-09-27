// path: schemas/system-schemas.ts

import { z } from 'zod';
import { systemsInsertSchema, sdh_systemsInsertSchema, vmux_systemsInsertSchema, ring_based_systemsInsertSchema } from './zod-schemas';

// Base schema for common fields, using the auto-generated one
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

// Schemas for the system subtypes, derived from auto-generated schemas
const sdhSchema = baseSystemSchema.extend({
    system_type_id: z.literal('SDH_TYPE_UUID_PLACEHOLDER'), // We'll replace this with the actual UUID
    ...sdh_systemsInsertSchema.pick({ gne: true, make: true }).shape,
});

const vmuxSchema = baseSystemSchema.extend({
    system_type_id: z.literal('VMUX_TYPE_UUID_PLACEHOLDER'),
    ...vmux_systemsInsertSchema.pick({ vm_id: true }).shape,
});

const ringBasedSchema = baseSystemSchema.extend({
    system_type_id: z.union([
        z.literal('CPAN_TYPE_UUID_PLACEHOLDER'),
        z.literal('MAAN_TYPE_UUID_PLACEHOLDER')
    ]),
    ...ring_based_systemsInsertSchema.pick({ ring_id: true }).shape,
});

const defaultSystemSchema = baseSystemSchema.extend({
    system_type_id: z.string().uuid().refine(val => 
        ![
            'SDH_TYPE_UUID_PLACEHOLDER', 
            'VMUX_TYPE_UUID_PLACEHOLDER', 
            'CPAN_TYPE_UUID_PLACEHOLDER',
            'MAAN_TYPE_UUID_PLACEHOLDER'
        ].includes(val), { message: "Invalid system type for default schema" }
    )
});

// The final discriminated union schema.
// NOTE: The UUID placeholders will be replaced dynamically in the modal.
export const systemFormSchema = z.discriminatedUnion("system_type_id", [
  sdhSchema,
  vmuxSchema,
  ringBasedSchema,
  defaultSystemSchema,
]);

// We also need a more general type for the form state before discrimination
export const generalSystemFormSchema = baseSystemSchema.extend({
    gne: sdh_systemsInsertSchema.shape.gne.optional(),
    make: sdh_systemsInsertSchema.shape.make.optional(),
    vm_id: vmux_systemsInsertSchema.shape.vm_id.optional(),
    ring_id: ring_based_systemsInsertSchema.shape.ring_id.optional(),
});

export type SystemFormData = z.infer<typeof generalSystemFormSchema>;