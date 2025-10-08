// schemas/custom-schemas.ts

import { z } from 'zod';
import {
  v_ofc_cables_completeRowSchema,
  cable_segmentsRowSchema,
  junction_closuresRowSchema,
  fiber_splicesRowSchema,
  nodesRowSchema,
  user_profilesUpdateSchema,
} from '@/schemas/zod-schemas';

// ============= AUTH & UI-SPECIFIC SCHEMAS =============

// --- Reusable Password Validation Schema ---
export const passwordSchema = z.string()
  .min(8, "Password must be at least 8 characters long")
  .max(50, "Password must not exceed 50 characters")
  .regex(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    "Password must contain an uppercase letter, a lowercase letter, a number, and a special character."
  );

export const passwordWithConfirmationSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string()
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords must match",
  path: ["confirmPassword"],
});

export type PasswordSchema = z.infer<typeof passwordSchema>;
export type PasswordWithConfirmation = z.infer<typeof passwordWithConfirmationSchema>;

// --- Onboarding Form Specific Schema ---
// THE FIX: Define the detailed object shapes for our JSONB fields.
const addressSchema = z
  .object({
    street: z.string().optional().nullable(),
    city: z.string().optional().nullable(),
    state: z.string().optional().nullable(),
    zip_code: z.string().optional().nullable(),
    country: z.string().optional().nullable(),
  })
  .nullable()
  .optional();

const preferencesSchema = z
  .object({
    language: z.string().optional().nullable(),
    theme: z.string().optional().nullable(),
    needsOnboarding: z.boolean().optional().nullable(),
    showOnboardingPrompt: z.boolean().optional().nullable(),
  })
  .nullable()
  .optional();

export const onboardingFormSchema = user_profilesUpdateSchema.extend({
  address: addressSchema,
  preferences: preferencesSchema,
});

// THE FIX: Use z.input<> to get the type that the form will produce,
// which is different from the fully parsed output type.
export type OnboardingFormData = z.input<typeof onboardingFormSchema>;

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
  updated_at: z.string().nullable()
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
  distance_km: z.number().nullable(),
  loss_db: z.number().nullable(),
  original_cable_id: z.uuid().nullable(),
  start_node_id: z.uuid().nullable(),
  end_node_id: z.uuid().nullable(),
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
export const bsnlSearchFiltersSchema = z.object({
  query: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  region: z.string().optional(),
  nodeType: z.string().optional(),
  priority: z.string().optional(),
});
export type BsnlSearchFilters = z.infer<typeof bsnlSearchFiltersSchema>;