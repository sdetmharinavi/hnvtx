// utils/mapUtils.ts
import { MapNode } from "@/components/map/types/node";
import L from "leaflet";
import { localDb } from "@/hooks/data/localDb";

// --- 1. JITTER LOGIC (Map Display) ---

// Define a union type for inputs that have coordinates
export type CoordinateNode = {
  id: string | null;
  // Support both naming conventions
  lat?: number | null;
  long?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  [key: string]: unknown; // Allow other props to pass through
};

// Generic Display Node Type
export type DisplayNode<T = CoordinateNode> = T & {
  displayLat: number;
  displayLng: number;
  jitterAngle: number;
  isCluster: boolean;
};

/**
 * Applies a spiral jitter to nodes that share the exact same coordinates.
 * Handles inputs with either lat/long or latitude/longitude properties.
 */
export const applyJitterToNodes = <T extends CoordinateNode>(nodes: T[]): DisplayNode<T>[] => {
  const groupedNodes = new Map<string, T[]>();

  // Helper to extract coords regardless of property name
  const getCoords = (node: T): [number, number] | null => {
    const lat = node.lat ?? node.latitude;
    const lng = node.long ?? node.longitude;
    if (typeof lat === "number" && typeof lng === "number") {
      return [lat, lng];
    }
    return null;
  };

  // Group nodes by exact coordinate
  nodes.forEach((node) => {
    const coords = getCoords(node);
    if (coords) {
      // Create a key based on coordinates (rounded slightly to catch very close nodes)
      const key = `${coords[0].toFixed(6)},${coords[1].toFixed(6)}`;
      if (!groupedNodes.has(key)) groupedNodes.set(key, []);
      groupedNodes.get(key)!.push(node);
    }
  });

  const results: DisplayNode<T>[] = [];

  groupedNodes.forEach((nodesAtLoc) => {
    const coords = getCoords(nodesAtLoc[0]);
    if (!coords) return; // Should not happen given the filter above
    const [baseLat, baseLng] = coords;

    if (nodesAtLoc.length === 1) {
      // No overlap, keep original position
      results.push({
        ...nodesAtLoc[0],
        displayLat: baseLat,
        displayLng: baseLng,
        jitterAngle: 0,
        isCluster: false,
      });
    } else {
      // Overlap detected: Spiral them out
      // 0.00020 degrees is roughly 20-25 meters
      const radius = 0.0002;
      const angleStep = (2 * Math.PI) / nodesAtLoc.length;
      const startAngle = Math.PI / 2; // Start from top

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

// --- 2. ORS RATE LIMITER WITH PERSISTENT CACHE ---

// Singleton promise chain to enforce sequential execution across the entire app
let orsFetchChain: Promise<void> = Promise.resolve();
const ORS_REQUEST_DELAY = 1600; // 1.6s delay

// Generate a stable key for two coordinates regardless of direction
const getDistanceKey = (start: MapNode, end: MapNode) => {
  const lat1 = start.lat!.toFixed(6);
  const lng1 = start.long!.toFixed(6);
  const lat2 = end.lat!.toFixed(6);
  const lng2 = end.long!.toFixed(6);

  // Sort pairs so A->B and B->A use the same cache key
  const p1 = `${lat1},${lng1}`;
  const p2 = `${lat2},${lng2}`;
  return p1 < p2 ? `${p1}-${p2}` : `${p2}-${p1}`;
};

/**
 * Fetches driving distance from OpenRouteService.
 */
export const fetchOrsDistance = async (
  start: MapNode,
  end: MapNode
): Promise<{ distance_km: number; source: string }> => {
  const cacheKey = getDistanceKey(start, end);

  // 1. Check Local Cache (Async)
  try {
    const cached = await localDb.route_distances.get(cacheKey);
    // Valid for 30 days
    if (cached && Date.now() - cached.timestamp < 1000 * 60 * 60 * 24 * 30) {
      return { distance_km: cached.distance_km, source: "cache" };
    }
  } catch (e) {
    console.warn("Failed to read route cache", e);
  }

  // 2. Define Network Request
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

    // 3. Save to Cache (Fire and forget)
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

  // 4. Chain the request
  const resultPromise = orsFetchChain.then(makeRequest);

  // 5. Update the chain to include the delay
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

// --- 4. COLOR GENERATION UTILS ---

/**
 * Generates a consistent HSL color based on a string ID.
 * Used for matching connection lines with port indicators.
 */
export const getConnectionColor = (id: string) => {
  const colors = [
    '#dc2626', // Strong Red
    '#ea580c', // Deep Orange
    '#ca8a04', // Golden Amber
    '#65a30d', // Lime Green
    '#059669', // Emerald Green
    '#0f766e', // Teal
    '#0284c7', // Cyan Blue
    '#1d4ed8', // Royal Blue
    '#4f46e5', // Indigo
    '#7c3aed', // Violet
    '#c026d3', // Fuchsia
    '#be123c', // Rose / Magenta Red
  ];

  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};


// --- 5. CURVE UTILS (NEW) ---

/**
 * Generates a curved path (Quadratic Bezier approximation) between two points.
 * Useful for separating overlapping lines (e.g. A->B and B->A).
 */
export const getCurvedPath = (start: L.LatLng, end: L.LatLng, offsetMultiplier: number = 0.15) => {
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

  // Normal Vector (Perpendicular)
  // Rotate 90 degrees: (x, y) -> (-y, x)
  const normLat = -dLng;
  const normLng = dLat;

  // Offset point
  const curveLat = midLat + normLat * offsetMultiplier;
  const curveLng = midLng + normLng * offsetMultiplier;

  return [start, new L.LatLng(curveLat, curveLng), end];
};

/**
 * Simple euclidean distance check for co-location detection in map coordinates.
 */
export const isColocated = (p1: L.LatLng, p2: L.LatLng, threshold = 0.0005) => {
    const dLat = p1.lat - p2.lat;
    const dLng = p1.lng - p2.lng;
    return Math.sqrt(dLat*dLat + dLng*dLng) < threshold;
}