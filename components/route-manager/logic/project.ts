// components/route-manager/logic/project.ts

import { CableSegment, Equipment, FiberSplice, RouteDetailsPayload } from '../types';

export type BranchConfig = {
  target_id: string; // site or equipment id
  target_type: 'site' | 'equipment';
  distance_km: number; // length of the branch cable
  tap_fibers: number; // number of fibers to tap towards branch
};
export type BranchConfigMap = Record<string, BranchConfig>; // key: jc.id

// Project cable segments between start -> JCs -> end, ordered by position_on_route
export function projectSegments(
  route: RouteDetailsPayload['route'],
  equipment: Equipment[],
  branchConfig?: BranchConfigMap
): CableSegment[] {
  const sorted = [...equipment].sort(
    (a, b) => a.attributes.position_on_route - b.attributes.position_on_route
  );

  const points = [
    { id: route.start_site.id, type: 'site' as const, position: 0 },
    ...sorted.map((jc) => ({ id: jc.id, type: 'equipment' as const, position: jc.attributes.position_on_route })),
    { id: route.end_site.id, type: 'site' as const, position: 100 },
  ];

  const segments: CableSegment[] = [];
  let order = 1;
  for (let i = 0; i < points.length - 1; i++) {
    const start = points[i];
    const end = points[i + 1];
    const pct = Math.max(0, end.position - start.position) / 100;
    const distance = Math.round(route.distance_km * pct * 1000) / 1000; // km with 3 decimals
    segments.push({
      id: `proj-seg-${route.id}-${order}`,
      segment_order: order,
      start_point_id: start.id,
      end_point_id: end.id,
      start_point_type: start.type,
      end_point_type: end.type,
      fiber_count: route.capacity,
      distance_km: distance,
    });
    order++;
  }

  // Create branch segments based on provided config, fallback to small placeholder if branching without config
  const BRANCH_DEFAULT_KM = Math.max(0.2, Math.min(2, route.distance_km * 0.1)); // between 0.2 and 2 km
  for (const jc of equipment) {
    if (jc.attributes.jc_type === 'branching') {
      const cfg = branchConfig?.[jc.id];
      const endPointId = cfg?.target_id ?? `branch-end-${jc.id}`;
      const endPointType = cfg?.target_type ?? 'site';
      const distance = Math.round((cfg?.distance_km ?? BRANCH_DEFAULT_KM) * 1000) / 1000;
      segments.push({
        id: `proj-branch-${route.id}-${jc.id}`,
        segment_order: order++,
        start_point_id: jc.id,
        end_point_id: endPointId,
        start_point_type: 'equipment',
        end_point_type: endPointType,
        fiber_count: route.capacity,
        distance_km: distance,
      });
    }
  }
  return segments;
}

// Create default "through" splices as a placeholder; can be refined later.
export function projectDefaultSplices(
  route: RouteDetailsPayload['route'],
  segments: CableSegment[],
  equipment: Equipment[],
  branchConfig?: BranchConfigMap
): FiberSplice[] {
  const splices: FiberSplice[] = [];
  const DEFAULT_TAP_FIBERS = 2; // fallback

  // Build index of segments by their connection to speed lookups
  const segsByStart: Record<string, CableSegment[]> = {};
  const segsByEnd: Record<string, CableSegment[]> = {};
  for (const s of segments) {
    (segsByStart[s.start_point_id] ||= []).push(s);
    (segsByEnd[s.end_point_id] ||= []).push(s);
  }

  for (const jc of equipment) {
    const incoming = (segsByEnd[jc.id] || []).find(s => s.end_point_id === jc.id);
    const mainOutgoing = (segsByStart[jc.id] || []).find(s => s.start_point_id === jc.id && !s.id.startsWith('proj-branch-'));
    const branchOutgoing = (segsByStart[jc.id] || []).find(s => s.id.startsWith('proj-branch-'));

    if (!incoming || !mainOutgoing) continue; // need both to splice

    const fiberCount = Math.min(incoming.fiber_count, mainOutgoing.fiber_count);

    if (jc.attributes.jc_type === 'branching' && branchOutgoing) {
      const cfgTap = branchConfig?.[jc.id]?.tap_fibers ?? DEFAULT_TAP_FIBERS;
      // Through most fibers on the main, tap a few to the branch
      for (let i = 1; i <= fiberCount; i++) {
        if (i <= cfgTap) {
          splices.push({
            id: `sp-tap-${jc.id}-${i}`,
            equipment_id: jc.id,
            incoming_segment_id: incoming.id,
            incoming_fiber_number: i,
            outgoing_segment_id: branchOutgoing.id,
            outgoing_fiber_number: i,
            splice_type: 'tap',
            status: 'active',
          });
        } else {
          splices.push({
            id: `sp-through-${jc.id}-${i}`,
            equipment_id: jc.id,
            incoming_segment_id: incoming.id,
            incoming_fiber_number: i,
            outgoing_segment_id: mainOutgoing.id,
            outgoing_fiber_number: i,
            splice_type: 'through',
            status: 'active',
          });
        }
      }
    } else {
      // Inline: through all fibers by default
      for (let i = 1; i <= fiberCount; i++) {
        splices.push({
          id: `sp-through-${jc.id}-${i}`,
          equipment_id: jc.id,
          incoming_segment_id: incoming.id,
          incoming_fiber_number: i,
          outgoing_segment_id: mainOutgoing.id,
          outgoing_fiber_number: i,
          splice_type: 'through',
          status: 'active',
        });
      }
    }
  }

  return splices;
}
