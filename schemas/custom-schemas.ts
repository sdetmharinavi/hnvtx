// path: schemas/custom-schemas.ts
// This file is for custom, composed, or derived Zod schemas.
// It IMPORTS from the auto-generated `zod-schemas.ts` to maintain a single source of truth.

import { z } from 'zod';
import {
  v_ofc_cables_completeRowSchema,
  cable_segmentsRowSchema,
  junction_closuresRowSchema,
  fiber_splicesRowSchema
} from '@/schemas/zod-schemas';

// ============= RPC & UI-SPECIFIC SCHEMAS (ROUTE MANAGER) =============

// --- For useOfcRoutesForSelection hook ---
export const ofcForSelectionSchema = v_ofc_cables_completeRowSchema.pick({
  id: true,
  route_name: true,
  capacity: true,
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
  splice_id: z.string().uuid().nullable(),
});

const segmentAtJcSchema = z.object({
  segment_id: cable_segmentsRowSchema.shape.id,
  segment_name: z.string(),
  fiber_count: cable_segmentsRowSchema.shape.fiber_count,
  fibers: z.array(fiberAtSegmentSchema),
});

export const jcSplicingDetailsSchema = z.object({
  junction_closure: z.object({
    id: z.uuid(),
    name: z.string(),
  }),
  segments_at_jc: z.array(segmentAtJcSchema),
});
export type JcSplicingDetails = z.infer<typeof jcSplicingDetailsSchema>;

// --- For RouteDetailsPayload and its constituent parts ---

// CORRECTED: Create "relaxed" versions of the base schemas to handle data inconsistencies.
const relaxed_v_ofc_cables_completeRowSchema = v_ofc_cables_completeRowSchema.extend({
  created_at: z.string().nullable(), // Was z.iso.datetime()
  updated_at: z.string().nullable(), // Was z.iso.datetime()
  transnet_id: z.string().nullable(), // Was z.uuid().nullable()
});

const relaxed_junction_closuresRowSchema = junction_closuresRowSchema.extend({
  created_at: z.string().nullable(), // Was z.iso.datetime()
  updated_at: z.string().nullable(), // Was z.iso.datetime()
});

const relaxed_cable_segmentsRowSchema = cable_segmentsRowSchema.extend({
  created_at: z.string().nullable(), // Was z.iso.datetime()
  updated_at: z.string().nullable(), // Was z.iso.datetime()
});

export const cableSegmentSchema = relaxed_cable_segmentsRowSchema;
export type CableSegment = z.infer<typeof cableSegmentSchema>;

export const fiberSpliceSchema = fiber_splicesRowSchema;
export type FiberSplice = z.infer<typeof fiberSpliceSchema>;

const siteSchema = z.object({
  id: z.string().uuid().nullable(),
  name: z.string().nullable(),
});

export const cableRouteSchema = relaxed_v_ofc_cables_completeRowSchema.extend({
    start_site: siteSchema,
    end_site: siteSchema,
    evolution_status: z.enum(['simple', 'with_jcs', 'fully_segmented']),
});
export type CableRoute = z.infer<typeof cableRouteSchema>;

export const equipmentSchema = relaxed_junction_closuresRowSchema.extend({
    node: z.object({ name: z.string().nullable() }).nullable(),
    status: z.enum(['existing', 'planned']),
    attributes: z.object({
        position_on_route: z.number(),
        name: z.string().optional(),
    }),
});
export type Equipment = z.infer<typeof equipmentSchema>;

export const routeDetailsPayloadSchema = z.object({
    route: cableRouteSchema,
    equipment: z.array(equipmentSchema),
    segments: z.array(cableSegmentSchema),
    splices: z.array(fiberSpliceSchema),
});
export type RouteDetailsPayload = z.infer<typeof routeDetailsPayloadSchema>;

// --- For the new trace_fiber_path RPC ---
export const fiberTraceSegmentSchema = z.object({
  step_order: z.number().int(),
  element_type: z.string(), // e.g., 'SEGMENT'
  element_id: z.string().uuid(),
  element_name: z.string(),
  details: z.string(), // e.g., "Node A -> Node B"
  fiber_in: z.number().int(),
  fiber_out: z.number().int().nullable(),
  distance_km: z.number().nullable(),
  loss_db: z.number().nullable(),
});
export type FiberTraceSegment = z.infer<typeof fiberTraceSegmentSchema>;