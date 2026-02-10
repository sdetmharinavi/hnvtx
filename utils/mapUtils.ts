// utils/mapUtils.ts
import { MapNode } from '@/components/map/ClientRingMap/types';
import L from 'leaflet';
import { localDb } from '@/hooks/data/localDb';

// ... (Existing Jitter Logic - Unchanged) ...
export type CoordinateNode = {
  id: string | null;
  lat?: number | null;
  long?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  [key: string]: unknown;
};

export type DisplayNode<T = CoordinateNode> = T & {
  displayLat: number;
  displayLng: number;
  jitterAngle: number;
  isCluster: boolean;
};

export const applyJitterToNodes = <T extends CoordinateNode>(nodes: T[]): DisplayNode<T>[] => {
  const groupedNodes = new Map<string, T[]>();

  const getCoords = (node: T): [number, number] | null => {
    const lat = node.lat ?? node.latitude;
    const lng = node.long ?? node.longitude;
    if (typeof lat === 'number' && typeof lng === 'number') {
      return [lat, lng];
    }
    return null;
  };

  nodes.forEach((node) => {
    const coords = getCoords(node);
    if (coords) {
      const key = `${coords[0].toFixed(6)},${coords[1].toFixed(6)}`;
      if (!groupedNodes.has(key)) groupedNodes.set(key, []);
      groupedNodes.get(key)!.push(node);
    }
  });

  const results: DisplayNode<T>[] = [];

  groupedNodes.forEach((nodesAtLoc) => {
    const coords = getCoords(nodesAtLoc[0]);
    if (!coords) return;
    const [baseLat, baseLng] = coords;

    if (nodesAtLoc.length === 1) {
      results.push({
        ...nodesAtLoc[0],
        displayLat: baseLat,
        displayLng: baseLng,
        jitterAngle: 0,
        isCluster: false,
      });
    } else {
      const radius = 0.0003;
      const angleStep = (2 * Math.PI) / nodesAtLoc.length;
      const startAngle = Math.PI / 4;

      nodesAtLoc.forEach((node, i) => {
        const angle = startAngle + i * angleStep;
        results.push({
          ...node,
          displayLat: baseLat + radius * Math.sin(angle),
          displayLng: baseLng + radius * Math.cos(angle),
          jitterAngle: angle,
          isCluster: true,
        });
      });
    }
  });

  return results;
};

// ... (Existing ORS Logic - Unchanged) ...
let orsFetchChain: Promise<void> = Promise.resolve();
const ORS_REQUEST_DELAY = 1600;

const getDistanceKey = (start: MapNode, end: MapNode) => {
  const lat1 = start.lat!.toFixed(6);
  const lng1 = start.long!.toFixed(6);
  const lat2 = end.lat!.toFixed(6);
  const lng2 = end.long!.toFixed(6);
  const p1 = `${lat1},${lng1}`;
  const p2 = `${lat2},${lng2}`;
  return p1 < p2 ? `${p1}-${p2}` : `${p2}-${p1}`;
};

export const fetchOrsDistance = async (
  start: MapNode,
  end: MapNode
): Promise<{ distance_km: number; source: string }> => {
  const cacheKey = getDistanceKey(start, end);

  try {
    const cached = await localDb.route_distances.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < 1000 * 60 * 60 * 24 * 30) {
      return { distance_km: cached.distance_km, source: 'cache' };
    }
  } catch (e) {
    console.warn('Failed to read route cache', e);
  }

  const makeRequest = async () => {
    const response = await fetch('/api/ors-distance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: start, b: end }),
    });

    if (!response.ok) {
      throw new Error(`ORS API failed: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.distance_km) {
      localDb.route_distances
        .put({
          id: cacheKey,
          distance_km: parseFloat(data.distance_km),
          source: data.source || 'api',
          timestamp: Date.now(),
        })
        .catch((err) => console.error('Failed to cache route distance', err));
    }

    return data;
  };

  const resultPromise = orsFetchChain.then(makeRequest);

  orsFetchChain = resultPromise
    .then(() => new Promise<void>((res) => setTimeout(res, ORS_REQUEST_DELAY)))
    .catch(() => new Promise<void>((res) => setTimeout(res, ORS_REQUEST_DELAY)));

  return resultPromise;
};

// ... (Existing Leaflet Logic - Unchanged) ...
export const fixLeafletIcons = () => {
  if (typeof window === 'undefined') return;
  // @ts-expect-error - Accessing internal Leaflet prototype
  delete L.Icon.Default.prototype._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
    iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
  });
};

export const getConnectionColor = (id: string) => {
  const colors = [
    '#dc2626', '#ea580c', '#ca8a04', '#16a34a',
    '#059669', '#0891b2', '#0284c7', '#2563eb',
    '#4f46e5', '#7c3aed', '#c026d3', '#be123c',
  ];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

function getQuadraticBezierPoints(p0: L.LatLng, p1: L.LatLng, p2: L.LatLng, numPoints: number = 40): L.LatLng[] {
  const points: L.LatLng[] = [];
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const invT = 1 - t;
    const lat = invT * invT * p0.lat + 2 * invT * t * p1.lat + t * t * p2.lat;
    const lng = invT * invT * p0.lng + 2 * invT * t * p1.lng + t * t * p2.lng;
    points.push(new L.LatLng(lat, lng));
  }
  return points;
}

function getCubicBezierPoints(p0: L.LatLng, p1: L.LatLng, p2: L.LatLng, p3: L.LatLng, numPoints: number = 50): L.LatLng[] {
  const points: L.LatLng[] = [];
  for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const invT = 1 - t;
      const f0 = invT * invT * invT;
      const f1 = 3 * invT * invT * t;
      const f2 = 3 * invT * t * t;
      const f3 = t * t * t;
      const lat = f0 * p0.lat + f1 * p1.lat + f2 * p2.lat + f3 * p3.lat;
      const lng = f0 * p0.lng + f1 * p1.lng + f2 * p2.lng + f3 * p3.lng;
      points.push(new L.LatLng(lat, lng));
  }
  return points;
}

export const getCurvedPath = (start: L.LatLng, end: L.LatLng, offsetMultiplier: number = 0.15) => {
  if (offsetMultiplier === 0) return [start, end];
  const lat1 = start.lat;
  const lng1 = start.lng;
  const lat2 = end.lat;
  const lng2 = end.lng;
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;
  const normLat = -dLng;
  const normLng = dLat;
  const controlLat = midLat + normLat * offsetMultiplier;
  const controlLng = midLng + normLng * offsetMultiplier;
  const controlPoint = new L.LatLng(controlLat, controlLng);
  return getQuadraticBezierPoints(start, controlPoint, end);
};

export const getLoopPath = (position: L.LatLng, offsetIndex: number = 0, loopSize: number = 100) => {
  const { lat, lng } = position;
  const spread = offsetIndex * 20; 
  const p1 = new L.LatLng(lat + loopSize + spread, lng + (loopSize * 0.4));
  const p2 = new L.LatLng(lat + (loopSize * 0.4), lng + loopSize + spread);
  return getCubicBezierPoints(position, p1, p2, position);
};

/**
 * Calculates the offset multiplier for parallel curved lines.
 * UPDATED: Increased spread to visually separate overlapping lines better.
 */
export const getMultiLineCurveOffset = (index: number, total: number): number => {
  if (total <= 1) return 0;

  // INCREASED SPREAD: 0.3 -> 0.6 to separate lines more aggressively
  // This value is relative to the straight-line distance between nodes.
  const spread = 0.6; 
  
  // Calculate step to distribute lines evenly around the center (0)
  const step = spread / (total - 1);
  const start = -spread / 2;

  // e.g. Total 2: -0.3, +0.3 (Separated)
  // e.g. Total 3: -0.3, 0, +0.3 (One straight, two curved)
  return start + index * step;
};

export const isColocated = (p1: L.LatLng, p2: L.LatLng, threshold = 0.0005) => {
  const dLat = p1.lat - p2.lat;
  const dLng = p1.lng - p2.lng;
  return Math.sqrt(dLat * dLat + dLng * dLng) < threshold;
};