// schemas/custom-schemas.ts

import { z } from 'zod';
import {
  v_ofc_cables_completeRowSchema,
  cable_segmentsRowSchema,
  junction_closuresRowSchema,
  fiber_splicesRowSchema,
  nodesRowSchema,
} from '@/schemas/zod-schemas';
import { JsonSchema } from '@/types/custom';

// ============= AUTH & UI-SPECIFIC SCHEMAS =============

// --- Reusable Password Validation Schema ---
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(50, 'Password must not exceed 50 characters')
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    'Password must contain an uppercase letter, a lowercase letter, a number, and a special character.'
  );

export const passwordWithConfirmationSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords must match',
    path: ['confirmPassword'],
  });

export type PasswordSchema = z.infer<typeof passwordSchema>;
export type PasswordWithConfirmation = z.infer<typeof passwordWithConfirmationSchema>;

// ============= RPC & UI-SPECIFIC SCHEMAS (ROUTE MANAGER) =============

// --- For useOfcRoutesForSelection hook ---
export const ofcForSelectionSchema = v_ofc_cables_completeRowSchema
  .pick({
    id: true,
    route_name: true,
    capacity: true,
  })
  .extend({
    ofc_connections: z.array(z.object({ id: z.uuid() })).optional().default([]),
  });
export type OfcForSelection = z.infer<typeof ofcForSelectionSchema>;

// --- For useAutoSplice hook result ---
export const autoSpliceResultSchema = z.object({
  splices_created: z.number().int(),
});
export type AutoSpliceResult = z.infer<typeof autoSpliceResultSchema>;

// --- For JcSplicingDetails ---
const fiberAtSegmentSchema = z.object({
  fiber_no: z.number().int(),
  status: z.enum(['available', 'used_as_incoming', 'used_as_outgoing', 'terminated']),
  connected_to_segment: z.string().nullable(),
  connected_to_fiber: z.number().int().nullable(),
  splice_id: z.uuid().nullable(),
  loss_db: z.number().nullable(),
});

const segmentAtJcSchema = z.object({
  segment_id: z.uuid(),
  segment_name: z.string(),
  fiber_count: z.number().int(),
  fibers: z.array(fiberAtSegmentSchema),
  distance_km: z.number().nullable().optional(),
});

export const jcSplicingDetailsSchema = z.object({
  junction_closure: z.object({
    id: z.uuid(),
    name: z.string().nullable().optional(),
  }),
  segments_at_jc: z.array(segmentAtJcSchema),
});
export type JcSplicingDetails = z.infer<typeof jcSplicingDetailsSchema>;

// --- For RouteDetailsPayload and its constituent parts ---

// Helper for permissive date handling (string or null)
const dateStringSchema = z.string().nullable().optional();

// Helper for permissive number handling (can be string in some DB drivers, though Supabase usually sends numbers)
const numberSchema = z.union([z.number(), z.string()]).transform((val) => Number(val)).nullable().optional();

// 1. Cable Route Schema - Explicitly redefine critical fields to be safe for JSON transfer
const siteSchema = z.object({
  id: z.uuid().nullable(),
  name: z.string().nullable(),
});

export const cableRouteSchema = z.object({
  id: z.uuid().nullable(),
  route_name: z.string().nullable(),
  ofc_type_name: z.string().nullable(),
  capacity: z.number().nullable(),
  current_rkm: numberSchema,
  transnet_rkm: numberSchema,
  ofc_owner_name: z.string().nullable(),
  maintenance_area_name: z.string().nullable(),
  maintenance_area_code: z.string().nullable(),
  asset_no: z.string().nullable(),
  transnet_id: z.string().nullable(),
  remark: z.string().nullable().optional(),
  
  // ID fields
  sn_id: z.uuid().nullable(),
  en_id: z.uuid().nullable(),
  sn_name: z.string().nullable(),
  en_name: z.string().nullable(),
  
  // Timestamps
  commissioned_on: dateStringSchema,
  created_at: dateStringSchema,
  updated_at: dateStringSchema,
  last_activity_at: dateStringSchema,

  // Status
  status: z.boolean().nullable().optional(),
  
  // Derived/Joined fields
  start_site: siteSchema.optional(),
  end_site: siteSchema.optional(),
  evolution_status: z.enum(['simple', 'with_jcs', 'fully_segmented']).optional(),
  
  // Handle linked_cables jsonb safely
  linked_cables: JsonSchema.nullable().optional(),
}).loose(); // Allow extra fields from the view without crashing

export type CableRoute = z.infer<typeof cableRouteSchema>;

// 2. Joint Box Schema
export const jointBoxSchema = z.object({
  id: z.uuid().optional(), // Might be optional during creation flows
  node_id: z.uuid(),
  ofc_cable_id: z.uuid(),
  position_km: numberSchema,
  
  // Joined/Derived
  node: z.object({ name: z.string().nullable() }).nullable().optional(),
  status: z.enum(['existing', 'planned']).optional(),
  attributes: z.object({
    position_on_route: z.number(),
    name: z.string().optional(),
  }).optional(),
  
  created_at: dateStringSchema,
  updated_at: dateStringSchema,
}).loose();

export type JointBox = z.infer<typeof jointBoxSchema>;

// 3. Segment Schema
export const cableSegmentSchema = z.object({
  id: z.uuid().optional(),
  original_cable_id: z.uuid(),
  segment_order: z.number(),
  start_node_id: z.uuid(),
  end_node_id: z.uuid(),
  start_node_type: z.string(),
  end_node_type: z.string(),
  distance_km: z.number(),
  fiber_count: z.number(),
  
  created_at: dateStringSchema,
  updated_at: dateStringSchema,
}).loose();

export type CableSegment = z.infer<typeof cableSegmentSchema>;

// 4. Splice Schema
export const fiberSpliceSchema = fiber_splicesRowSchema.extend({
  created_at: dateStringSchema,
  updated_at: dateStringSchema,
}).loose();

export type FiberSplice = z.infer<typeof fiberSpliceSchema>;

// 5. Main Payload
export const routeDetailsPayloadSchema = z.object({
  route: cableRouteSchema,
  jointBoxes: z.array(jointBoxSchema),
  segments: z.array(cableSegmentSchema),
  splices: z.array(fiberSpliceSchema),
});
export type RouteDetailsPayload = z.infer<typeof routeDetailsPayloadSchema>;

// --- Schema for trace_fiber_path RPC ---
export const fiberTraceSegmentSchema = z.object({
  step_order: z.number(),
  element_type: z.string(),
  element_id: z.uuid(),
  element_name: z.string().nullable(),
  details: z.string().nullable(),
  fiber_in: z.number().nullable(),
  fiber_out: z.number().nullable(),
  distance_km: z.number().nullable(),
  loss_db: z.number().nullable(),
  original_cable_id: z.uuid().nullable(),
  start_node_id: z.uuid().nullable(),
  end_node_id: z.uuid().nullable(),
  capacity: z.number().nullable().optional(),
});
export type FiberTraceSegment = z.infer<typeof fiberTraceSegmentSchema>;

export const pathToUpdateSchema = z.object({
  p_id: z.uuid(),
  p_start_node_id: z.uuid(),
  p_end_node_id: z.uuid(),
  p_start_fiber_no: z.number(),
  p_end_fiber_no: z.number(),
});
export type PathToUpdate = z.infer<typeof pathToUpdateSchema>;

// --- BSNL Dashboard Search Filters ---
// MODIFIED: type, region, and nodeType can now be string OR array of strings
export const bsnlSearchFiltersSchema = z.object({
  query: z.string().optional(),
  status: z.string().optional(),
  type: z.union([z.string(), z.array(z.string())]).optional(),
  region: z.union([z.string(), z.array(z.string())]).optional(),
  nodeType: z.union([z.string(), z.array(z.string())]).optional(),
  priority: z.string().optional(),
});
export type BsnlSearchFilters = z.infer<typeof bsnlSearchFiltersSchema>;

export const linkedCableSchema = z.object({
  link_id: z.string(),
  cable_id: z.string(),
  route_name: z.string(),
  description: z.string().nullable().optional(),
});

export type LinkedCable = z.infer<typeof linkedCableSchema>;

// Extended Schema to include the JSONB aggregated column
// Use the redefined cableRouteSchema for consistency instead of extending the generated one again
export const extendedOfcCableSchema = cableRouteSchema.extend({
  linked_cables: z.array(linkedCableSchema).nullable().optional(),
});

export type ExtendedOfcCable = z.infer<typeof extendedOfcCableSchema>;