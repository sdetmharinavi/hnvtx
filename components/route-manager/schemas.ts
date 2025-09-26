// components/route-manager/schemas.ts
// Lightweight runtime validators (type guards) to avoid extra deps.

import { RouteDetailsPayload, Equipment, CableSegment, FiberSplice, EvolutionCommitPayload, Site } from './types';

function isSite(x: any): x is Site {
  return x && typeof x.id === 'string' && typeof x.name === 'string';
}

function isEquipment(x: any): x is Equipment {
  return (
    x && typeof x.id === 'string' && typeof x.name === 'string' &&
    x.equipment_type === 'junction_closure' &&
    typeof x.latitude === 'number' && typeof x.longitude === 'number' &&
    (x.status === 'existing' || x.status === 'planned') &&
    x.attributes &&
    (x.attributes.jc_type === 'inline' || x.attributes.jc_type === 'branching' || x.attributes.jc_type === 'terminal') &&
    typeof x.attributes.capacity === 'number' &&
    typeof x.attributes.position_on_route === 'number'
  );
}

export function isRouteDetailsPayload(x: any): x is RouteDetailsPayload {
  return (
    x && x.route && typeof x.route.id === 'string' && typeof x.route.name === 'string' &&
    isSite(x.route.start_site) && isSite(x.route.end_site) &&
    typeof x.route.capacity === 'number' && typeof x.route.distance_km === 'number' &&
    (x.route.evolution_status === 'simple' || x.route.evolution_status === 'with_jcs' || x.route.evolution_status === 'fully_segmented') &&
    Array.isArray(x.equipment) && x.equipment.every(isEquipment)
  );
}

export function isCableSegment(x: any): x is CableSegment {
  return (
    x && typeof x.segment_order === 'number' &&
    typeof x.start_point_id === 'string' && typeof x.end_point_id === 'string' &&
    (x.start_point_type === 'site' || x.start_point_type === 'equipment') &&
    (x.end_point_type === 'site' || x.end_point_type === 'equipment') &&
    typeof x.fiber_count === 'number' && typeof x.distance_km === 'number'
  );
}

export function isFiberSplice(x: any): x is FiberSplice {
  return (
    x && typeof x.equipment_id === 'string' && typeof x.incoming_segment_id === 'string' &&
    typeof x.incoming_fiber_number === 'number' && typeof x.outgoing_segment_id === 'string' &&
    typeof x.outgoing_fiber_number === 'number' &&
    (x.splice_type === 'through' || x.splice_type === 'tap' || x.splice_type === 'split') &&
    (x.status === 'active' || x.status === 'spare' || x.status === 'faulty')
  );
}

export function isEvolutionCommitPayload(x: any): x is EvolutionCommitPayload {
  const ok = (
    x && Array.isArray(x.plannedEquipment) &&
    Array.isArray(x.plannedSegments) &&
    Array.isArray(x.plannedSplices)
  );
  if (!ok) return false;

  // We validate shapes of elements loosely as they are Omit<...>
  const equipOk = x.plannedEquipment.every((e: any) => (
    e && typeof e.name === 'string' && e.equipment_type === 'junction_closure' &&
    typeof e.latitude === 'number' && typeof e.longitude === 'number' &&
    e.attributes && (e.attributes.jc_type === 'inline' || e.attributes.jc_type === 'branching' || e.attributes.jc_type === 'terminal') &&
    typeof e.attributes.capacity === 'number' && typeof e.attributes.position_on_route === 'number'
  ));

  const segOk = x.plannedSegments.every((s: any) => isCableSegment({ ...s, id: 'x' }));
  const spOk = x.plannedSplices.every((sp: any) => isFiberSplice({ ...sp, id: 'x' }));

  return equipOk && segOk && spOk;
}
