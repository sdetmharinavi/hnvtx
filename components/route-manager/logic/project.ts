import { z } from 'zod';
import { 
    v_ofc_cables_completeRowSchema, 
    cable_segmentsRowSchema, 
    junction_closuresRowSchema,
    fiber_splicesRowSchema 
} from '@/schemas/zod-schemas';

// --- TYPE DEFINITIONS INFERRED FROM ZOD SCHEMAS ---
type CableRoute = z.infer<typeof v_ofc_cables_completeRowSchema>;
type Equipment = z.infer<typeof junction_closuresRowSchema> & { 
  node?: { name: string | null; } | null;
  status: 'existing' | 'planned'; 
  attributes: { position_on_route: number; name?: string; } 
};
type CableSegment = z.infer<typeof cable_segmentsRowSchema>;
type FiberSplice = z.infer<typeof fiber_splicesRowSchema>;

// --- STRICT LOCAL TYPES (NO 'any') ---
interface BranchConfig {
  target_id: string;
  target_type: 'site' | 'equipment';
  distance_km: number;
  tap_fibers: number;
}
export type BranchConfigMap = Record<string, BranchConfig>;

export function projectSegments(
  route: CableRoute,
  equipment: Equipment[],
): CableSegment[] {
  if (!route || !route.sn_id || !route.en_id) {
    return [];
  }

  const sorted = [...equipment].sort(
    (a, b) => a.attributes.position_on_route - b.attributes.position_on_route
  );

  const points = [
    { id: route.sn_id, type: 'site' as const, position: 0 },
    ...sorted.map((jc) => ({ id: jc.id, type: 'equipment' as const, position: jc.attributes.position_on_route })),
    { id: route.en_id, type: 'site' as const, position: 100 },
  ];

  const segments: CableSegment[] = [];
  let order = 1;
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    const pct = Math.max(0, end.position - start.position) / 100;
    const distance = Math.round((route.current_rkm || 0) * pct * 1000) / 1000;
    
    segments.push({
      id: `proj-seg-${route.id}-${order}`,
      segment_order: order,
      start_node_id: start.id,
      end_node_id: end.id,
      start_node_type: start.type,
      end_node_type: end.type,
      fiber_count: route.capacity || 0,
      distance_km: distance,
      original_cable_id: route.id!,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    order++;
  }

  return segments;
}

export function projectDefaultSplices(
  route: CableRoute,
  segments: CableSegment[],
  equipment: Equipment[],
): FiberSplice[] {
    // Placeholder for future implementation
    console.log(route, segments, equipment);
    
    return [];
}