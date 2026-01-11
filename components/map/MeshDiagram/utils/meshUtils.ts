// components/map/MeshDiagram/utils/meshUtils.ts
import { useMemo } from 'react';
import { RingMapNode } from '@/components/map/ClientRingMap/types';
import L from 'leaflet';

export interface MeshLayoutResult {
  nodePositions: Map<string, L.LatLng>;
  bounds: L.LatLngBoundsExpression;
}

export const computeMeshLayout = (nodes: RingMapNode[]): MeshLayoutResult => {
  const positions = new Map<string, L.LatLng>();
  const CENTER_X = 1000;
  const CENTER_Y = 1000;
  const RING_RADIUS = 400;
  const SPUR_LENGTH = 200;

  // Sorting ensures deterministic layout
  const sortedNodes = [...nodes].sort((a, b) => (a.order_in_ring || 0) - (b.order_in_ring || 0));

  const backboneNodes: RingMapNode[] = [];
  const spurNodes: RingMapNode[] = [];

  sortedNodes.forEach((node) => {
    const order = node.order_in_ring || 0;
    // Check if integer (Hub) or decimal (Spur)
    if (Math.abs(order - Math.round(order)) < 0.01) {
      backboneNodes.push(node);
    } else {
      spurNodes.push(node);
    }
  });

  // Fallback: If everything is a spur or everything is a hub (rare edge cases)
  if (backboneNodes.length === 0 && spurNodes.length === 0) {
    backboneNodes.push(...nodes);
  }

  const angleStep = (2 * Math.PI) / Math.max(1, backboneNodes.length);
  const startAngle = -Math.PI / 2;

  backboneNodes.forEach((node, index) => {
    const angle = startAngle + index * angleStep;
    const lat = CENTER_Y + RING_RADIUS * Math.sin(angle);
    const lng = CENTER_X + RING_RADIUS * Math.cos(angle);
    positions.set(node.id!, new L.LatLng(lat, lng));
  });

  const spursByParent = new Map<number, RingMapNode[]>();
  spurNodes.forEach((node) => {
    const parentOrder = Math.floor(node.order_in_ring || 0);
    if (!spursByParent.has(parentOrder)) spursByParent.set(parentOrder, []);
    spursByParent.get(parentOrder)!.push(node);
  });

  spursByParent.forEach((children, parentOrder) => {
    const parentNode = backboneNodes.find((n) => Math.round(n.order_in_ring || 0) === parentOrder);
    if (!parentNode) return;
    const parentPos = positions.get(parentNode.id!);
    if (!parentPos) return;

    const vecX = parentPos.lng - CENTER_X;
    const vecY = parentPos.lat - CENTER_Y;
    const mag = Math.sqrt(vecX * vecX + vecY * vecY);
    const dirX = mag === 0 ? 1 : vecX / mag;
    const dirY = mag === 0 ? 0 : vecY / mag;
    const fanAngle = Math.PI / 4;
    const totalSpurs = children.length;

    children.forEach((child, idx) => {
      let rotation = 0;
      if (totalSpurs > 1) {
        const step = fanAngle / (totalSpurs - 1);
        rotation = -fanAngle / 2 + idx * step;
      }
      const rotatedX = dirX * Math.cos(rotation) - dirY * Math.sin(rotation);
      const rotatedY = dirX * Math.sin(rotation) + dirY * Math.cos(rotation);
      const childLng = parentPos.lng + rotatedX * SPUR_LENGTH;
      const childLat = parentPos.lat + rotatedY * SPUR_LENGTH;
      positions.set(child.id!, new L.LatLng(childLat, childLng));
    });
  });

  const lats = Array.from(positions.values()).map((p) => p.lat);
  const lngs = Array.from(positions.values()).map((p) => p.lng);

  // Default bounds if no nodes
  if (lats.length === 0) {
    return {
      nodePositions: positions,
      bounds: [
        [CENTER_Y - 100, CENTER_X - 100],
        [CENTER_Y + 100, CENTER_X + 100],
      ],
    };
  }

  const minLat = Math.min(...lats) - 100;
  const maxLat = Math.max(...lats) + 100;
  const minLng = Math.min(...lngs) - 100;
  const maxLng = Math.max(...lngs) + 100;

  const bounds: L.LatLngBoundsExpression = [
    [minLat, minLng],
    [maxLat, maxLng],
  ];

  return { nodePositions: positions, bounds };
};

export const useMeshLayout = (nodes: RingMapNode[]) => {
  // THE FIX: Memoize the calculation based on the nodes input.
  // Since 'nodes' comes from a React Query / Memoized parent source, this reference check is stable.
  return useMemo(() => computeMeshLayout(nodes), [nodes]);
};
