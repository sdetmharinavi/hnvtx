import z from "zod";

// helpers are not needed for this schema anymore, but might be for others.
import { requiredStringToNumber, emptyStringToNumber } from './helpers';

export const logicalFiberPathSchema = z.object({
    id: z.uuid().optional(),
    path_name: z.string().min(1, "Path name is required."),
    path_type_id: z.uuid({ message: "Path type is required." }).nullable(),
    source_system_id: z.uuid(),
    destination_system_id: z.uuid().optional().nullable(),
    source_port: z.string().optional().nullable(),
    destination_port: z.string().optional().nullable(),
    operational_status_id: z.uuid({ message: "Operational status is required." }).nullable(),
    total_distance_km: z.number().optional().nullable(),
    remark: z.string().optional().nullable(),
  });

// THE DEFINITIVE FIX: Schema for Junction Closures
export const junctionClosureSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().min(1, "JC name is required."),
  jc_type_id: z.string().uuid("Please select a valid JC type.").nullable(),
  
  // Inline preprocessing to ensure correct type inference for react-hook-form
  capacity: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number("Capacity is required.").int().positive("Capacity must be a positive integer.")
  ),
  latitude: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z.number().min(-90, "Invalid latitude.").max(90, "Invalid latitude.").nullable().optional()
  ),
  longitude: z.preprocess(
    (val) => (val === "" || val === null ? null : Number(val)),
    z.number().min(-180, "Invalid longitude.").max(180, "Invalid longitude.").nullable().optional()
  ),
  position_km: z.preprocess(
    (val) => (val === "" || val === null || val === undefined ? undefined : Number(val)),
    z.number("Position on route is required.").min(0, "Position must be a positive number.")
  ),
  
  // REMOVED: ofc_cable_id is contextual data, not form data.
  // It will be added back in the submit handler.

  created_at: z.coerce.date().optional(),
  updated_at: z.coerce.date().optional(),
});

// ... (fiberSpliceSchema remains the same)
export const fiberSpliceSchema = z.object({
    id: z.uuid().optional(),
    jc_id: z.string().uuid("Junction Closure is required."),
    incoming_cable_id: z.string().uuid("Incoming cable is required."),
    incoming_fiber_no: z.number().int().positive("Incoming fiber number is required."),
    outgoing_cable_id: z.string().uuid("Outgoing cable is required.").optional().nullable(),
    outgoing_fiber_no: z.number().int().positive("Outgoing fiber number is required.").optional().nullable(),
    splice_type: z.enum(['pass_through', 'branch', 'termination']).default('pass_through'),
    status: z.enum(['active', 'faulty', 'reserved']).default('active'),
    logical_path_id: z.string().uuid().optional().nullable(),
    loss_db: emptyStringToNumber.pipe(z.number().min(0)).nullable(),
    otdr_length_km: emptyStringToNumber.pipe(z.number().min(0)).nullable(),
    created_at: z.coerce.date().optional(),
    updated_at: z.coerce.date().optional(),
  }).refine(data => {
      if (data.splice_type !== 'termination') {
          return data.outgoing_cable_id && data.outgoing_fiber_no;
      }
      return true;
  }, {
      message: "Outgoing cable and fiber number are required for non-termination splices.",
      path: ["outgoing_cable_id"],
  });