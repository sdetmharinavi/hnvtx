// utils/mapUtils.ts
import { BsnlNode } from "@/components/bsnl/types";
import { MapNode } from "@/components/map/types/node";
import L from "leaflet";
import { localDb } from "@/hooks/data/localDb";

// --- 1. JITTER LOGIC (Map Display) ---

export interface DisplayNode extends BsnlNode {
  displayLat: number;
  displayLng: number;
}

/**
 * Applies a spiral jitter to nodes that share the exact same coordinates.
 * This prevents markers from overlapping perfectly, ensuring all are clickable.
 *
 * @param nodes List of nodes to process
 * @returns Nodes with modified displayLat/displayLng
 */
export const applyJitterToNodes = (nodes: BsnlNode[]): DisplayNode[] => {
  const groupedNodes = new Map<string, BsnlNode[]>();

  // Group nodes by exact coordinate
  nodes.forEach((node) => {
    if (node.latitude && node.longitude) {
      // Create a key based on coordinates (rounded slightly to catch very close nodes)
      const key = `${node.latitude.toFixed(6)},${node.longitude.toFixed(6)}`;
      if (!groupedNodes.has(key)) groupedNodes.set(key, []);
      groupedNodes.get(key)!.push(node);
    }
  });

  const results: DisplayNode[] = [];

  groupedNodes.forEach((nodesAtLoc) => {
    if (nodesAtLoc.length === 1) {
      // No overlap, keep original position
      results.push({
        ...nodesAtLoc[0],
        displayLat: nodesAtLoc[0].latitude!,
        displayLng: nodesAtLoc[0].longitude!,
      });
    } else {
      // Overlap detected: Spiral them out
      // 0.00015 degrees is roughly 15-20 meters
      const radius = 0.00015;
      const angleStep = (2 * Math.PI) / nodesAtLoc.length;

      nodesAtLoc.forEach((node, i) => {
        const angle = i * angleStep;
        results.push({
          ...node,
          displayLat: node.latitude! + radius * Math.sin(angle),
          displayLng: node.longitude! + radius * Math.cos(angle),
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
 *
 * OPTIMIZATIONS:
 * 1. Checks IndexedDB (localDb) first.
 * 2. If cached, returns immediately (no network, no delay).
 * 3. If missing, queues request in singleton chain (1.6s delay).
 * 4. Saves result to IndexedDB for future use.
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
