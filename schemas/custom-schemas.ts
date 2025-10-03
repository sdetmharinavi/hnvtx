// schemas/custom-schemas.ts

import { z } from 'zod';
import {
  v_ofc_cables_completeRowSchema,
  cable_segmentsRowSchema,
  junction_closuresRowSchema,
  fiber_splicesRowSchema,
  nodesRowSchema,
} from '@/schemas/zod-schemas';

// ============= RPC & UI-SPECIFIC SCHEMAS (ROUTE MANAGER) =============

// --- For useOfcRoutesForSelection hook ---
export const ofcForSelectionSchema = v_ofc_cables_completeRowSchema.pick({
  id: true,
  route_name: true,
  capacity: true,
}).extend({
  ofc_connections: z.array(z.object({ id: z.uuid() })),
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
  segment_id: cable_segmentsRowSchema.shape.id,
  segment_name: z.string(),
  fiber_count: cable_segmentsRowSchema.shape.fiber_count,
  fibers: z.array(fiberAtSegmentSchema),
});

export const jcSplicingDetailsSchema = z.object({
  junction_closure: z.object({
    id: junction_closuresRowSchema.shape.id,
    name: nodesRowSchema.shape.name,
  }),
  segments_at_jc: z.array(segmentAtJcSchema),
});
export type JcSplicingDetails = z.infer<typeof jcSplicingDetailsSchema>;

// --- For RouteDetailsPayload and its constituent parts ---

const relaxed_v_ofc_cables_completeRowSchema = v_ofc_cables_completeRowSchema.extend({
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
  transnet_id: z.string().nullable(),
});

const relaxed_junction_closuresRowSchema = junction_closuresRowSchema.extend({
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

const relaxed_cable_segmentsRowSchema = cable_segmentsRowSchema.extend({
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export const cableSegmentSchema = relaxed_cable_segmentsRowSchema;
export type CableSegment = z.infer<typeof cableSegmentSchema>;

export const fiberSpliceSchema = fiber_splicesRowSchema;
export type FiberSplice = z.infer<typeof fiberSpliceSchema>;

const siteSchema = z.object({
  id: nodesRowSchema.shape.id.nullable(),
  name: nodesRowSchema.shape.name.nullable(),
});

export const cableRouteSchema = relaxed_v_ofc_cables_completeRowSchema.extend({
    start_site: siteSchema,
    end_site: siteSchema,
    evolution_status: z.enum(['simple', 'with_jcs', 'fully_segmented']),
});
export type CableRoute = z.infer<typeof cableRouteSchema>;

export const jointBoxSchema = relaxed_junction_closuresRowSchema.extend({
    node: z.object({ name: nodesRowSchema.shape.name.nullable() }).nullable(),
    status: z.enum(['existing', 'planned']),
    attributes: z.object({
        position_on_route: z.number(),
        name: z.string().optional(),
    }),
});
export type JointBox = z.infer<typeof jointBoxSchema>;

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
  element_name: z.string(),
  details: z.string(),
  fiber_in: z.number().nullable(),
  fiber_out: z.number().nullable(),
  distance_km: z.number(),
  loss_db: z.number().nullable(),
});
export type FiberTraceSegment = z.infer<typeof fiberTraceSegmentSchema>;


// --- For the new trace_fiber_path RPC ---
export const bsnlSearchFiltersSchema = z.object({
  query: z.string(),
  status: z.array(z.string()),
  type: z.array(z.string()),
  region: z.array(z.string()),
  nodeType: z.array(z.string()),
  priority: z.array(z.string()),
});
export type BsnlSearchFilters = z.infer<typeof bsnlSearchFiltersSchema>;