// utils/mapUtils.ts
import { MapNode } from "@/components/map/ClientRingMap/types";
import L from "leaflet";
import { localDb } from "@/hooks/data/localDb";

// --- 1. JITTER LOGIC (Map Display) ---

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
    if (typeof lat === "number" && typeof lng === "number") {
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
      // Increased radius slightly to make clusters more distinct at zoom 13
      const radius = 0.0003; 
      const angleStep = (2 * Math.PI) / nodesAtLoc.length;
      // Offset start angle so the first node isn't always directly north
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

// --- 2. ORS RATE LIMITER ---

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
      return { distance_km: cached.distance_km, source: "cache" };
    }
  } catch (e) {
    console.warn("Failed to read route cache", e);
  }

  const makeRequest = async () => {
    const response = await fetch("/api/ors-distance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
          source: data.source || "api",
          timestamp: Date.now(),
        })
        .catch((err) => console.error("Failed to cache route distance", err));
    }

    return data;
  };

  const resultPromise = orsFetchChain.then(makeRequest);
  
  orsFetchChain = resultPromise
    .then(() => new Promise<void>((res) => setTimeout(res, ORS_REQUEST_DELAY)))
    .catch(() => new Promise<void>((res) => setTimeout(res, ORS_REQUEST_DELAY)));

  return resultPromise;
};

// --- 3. LEAFLET HELPERS ---

export const fixLeafletIcons = () => {
  if (typeof window === "undefined") return;

  // @ts-expect-error - Accessing internal Leaflet prototype
  delete L.Icon.Default.prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
    iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
    shadowUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
  });
};

// --- 4. VISUALIZATION UTILS ---

export const getConnectionColor = (id: string) => {
  // Consistent palette matching Tailwind classes used elsewhere
  const colors = [
    '#dc2626', // Strong Red
    '#ea580c', // Deep Orange
    '#ca8a04', // Golden Amber
    '#16a34a', // Green
    '#059669', // Emerald Green
    '#0891b2', // Cyan
    '#0284c7', // Sky Blue
    '#2563eb', // Royal Blue
    '#4f46e5', // Indigo
    '#7c3aed', // Violet
    '#c026d3', // Fuchsia
    '#be123c', // Rose
  ];

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const getCurvedPath = (
    start: L.LatLng, 
    end: L.LatLng, 
    offsetMultiplier: number = 0.15
) => {
  const lat1 = start.lat;
  const lng1 = start.lng;
  const lat2 = end.lat;
  const lng2 = end.lng;

  // Midpoint
  const midLat = (lat1 + lat2) / 2;
  const midLng = (lng1 + lng2) / 2;

  // Vector
  const dLat = lat2 - lat1;
  const dLng = lng2 - lng1;

  // Normal Vector (Perpendicular): Rotate 90 degrees
  const normLat = -dLng;
  const normLng = dLat;

  // Offset point
  const curveLat = midLat + normLat * offsetMultiplier;
  const curveLng = midLng + normLng * offsetMultiplier;

  return [start, new L.LatLng(curveLat, curveLng), end];
};

/**
 * Calculates curve parameters for multiple parallel lines between two points.
 * @param index The 0-based index of this line among the parallel group.
 * @param total The total number of parallel lines.
 * @returns The offset multiplier to use with getCurvedPath.
 */
export const getMultiLineCurveOffset = (index: number, total: number): number => {
    if (total <= 1) return 0;
    
    // Spread evenly around 0
    // e.g. Total 2: -0.1, 0.1
    // e.g. Total 3: -0.15, 0, 0.15
    const spread = 0.3; // Maximum arc amplitude
    const step = spread / (total - 1 || 1);
    const start = -spread / 2;
    
    return start + (index * step);
};

export const isColocated = (p1: L.LatLng, p2: L.LatLng, threshold = 0.0005) => {
    const dLat = p1.lat - p2.lat;
    const dLng = p1.lng - p2.lng;
    return Math.sqrt(dLat*dLat + dLng*dLng) < threshold;
}