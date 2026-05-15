// utils/mapUtils.ts
import { MapNode } from '@/components/map/ClientRingMap/types';
import L from 'leaflet';

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

// --- BANDWIDTH PARSING & WEIGHT LOGIC ---

export const parseBandwidthGbps = (bwString?: string | null, bwGbps?: number | null): number => {
  if (bwGbps != null) return bwGbps; 
  if (!bwString) return 1; // Default fallback to 1G to avoid invisible lines
  
  const upper = bwString.toUpperCase();
  if (upper.includes('100G') || upper.includes('100 G')) return 100;
  if (upper.includes('10G') || upper.includes('10 G')) return 10;
  if (upper.includes('2.5G') || upper.includes('2.5 G') || upper.includes('STM16')) return 2.5;
  if (upper.includes('1G') || upper.includes('1000M')) return 1;
  if (upper.includes('STM1')) return 0.155; // 155 Mbps
  
  const match = upper.match(/([\d\.]+)\s*(G|M|K)/);
  if (match) {
     const val = parseFloat(match[1]);
     const unit = match[2];
     if (unit === 'G') return val;
     if (unit === 'M') return val / 1000;
     if (unit === 'K') return val / 1000000;
  }
  return 1;
};

export const getDynamicLineWeight = (bandwidthGbps: number | null | undefined, baseWeight: number): number => {
  if (bandwidthGbps == null) return baseWeight;
  
  // THE FIX: Exaggerated weight differences for clear visual contrast on the map
  if (bandwidthGbps >= 100) return baseWeight + 6; // e.g., 4 -> 8 (Massive)
  if (bandwidthGbps >= 10) return baseWeight + 3;  // e.g., 4 -> 4 (Double thickness)
  if (bandwidthGbps > 1) return baseWeight + 1.5;  // e.g., 4 -> 5.5 (Noticeably thicker)
  if (bandwidthGbps === 1) return baseWeight;      // e.g., 4 (Standard)
  
  // Low capacity (<1G) -> Thinner
  return Math.max(1.5, baseWeight - 1.5);
};

// -------------------------------------------

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

  const PRECISION_MULTIPLIER = 100000;

  nodes.forEach((node) => {
    const coords = getCoords(node);
    if (coords) {
      const hashLat = Math.round(coords[0] * PRECISION_MULTIPLIER);
      const hashLng = Math.round(coords[1] * PRECISION_MULTIPLIER);
      const key = `${hashLat}_${hashLng}`;
      
      let group = groupedNodes.get(key);
      if (!group) {
        group = [];
        groupedNodes.set(key, group);
      }
      group.push(node);
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

let orsFetchChain: Promise<void> = Promise.resolve();
const ORS_REQUEST_DELAY = 1600;

export const fetchOrsDistance = async (
  start: MapNode,
  end: MapNode
): Promise<{ distance_km: number; source: string }> => {
  const makeRequest = async () => {
    const response = await fetch('/api/ors-distance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ a: start, b: end }),
    });

    if (!response.ok) {
      throw new Error(`ORS API failed: ${response.statusText}`);
    }

    return response.json();
  };

  const resultPromise = orsFetchChain.then(makeRequest);

  orsFetchChain = resultPromise
    .then(() => new Promise<void>((res) => setTimeout(res, ORS_REQUEST_DELAY)))
    .catch(() => new Promise<void>((res) => setTimeout(res, ORS_REQUEST_DELAY)));

  return resultPromise;
};

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

export const getMultiLineCurveOffset = (index: number, total: number): number => {
  if (total <= 1) return 0;
  const spread = 0.6;
  const step = spread / (total - 1);
  const start = -spread / 2;
  return start + index * step;
};

export const isColocated = (p1: L.LatLng, p2: L.LatLng, threshold = 0.0005) => {
  const dLat = p1.lat - p2.lat;
  const dLng = p1.lng - p2.lng;
  return Math.sqrt(dLat * dLat + dLng * dLng) < threshold;
};