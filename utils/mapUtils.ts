// utils/mapUtils.ts
import { BsnlNode } from '@/components/bsnl/types';
import { MapNode } from '@/components/map/types/node';
import L from 'leaflet';

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
  nodes.forEach(node => {
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
        displayLng: nodesAtLoc[0].longitude!
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
          displayLat: node.latitude! + (radius * Math.sin(angle)),
          displayLng: node.longitude! + (radius * Math.cos(angle))
        });
      });
    }
  });

  return results;
};


// --- 2. ORS RATE LIMITER (Routing) ---

// Singleton promise chain to enforce sequential execution across the entire app
let orsFetchChain: Promise<void> = Promise.resolve();
const ORS_REQUEST_DELAY = 1600; // 1.6s delay to respect ~40 req/min limits

/**
 * Fetches driving distance from OpenRouteService via our internal API proxy.
 * Enforces a strict rate limit to stay within free tier quotas using a singleton promise chain.
 */
export const fetchOrsDistance = async (start: MapNode, end: MapNode): Promise<{ distance_km: number; source: string }> => {
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

  // Chain the request to the singleton
  const resultPromise = orsFetchChain.then(makeRequest);

  // Append a delay to the chain after this request completes (success or fail)
  orsFetchChain = resultPromise
    .then(() => new Promise<void>(res => setTimeout(res, ORS_REQUEST_DELAY)))
    .catch(() => new Promise<void>(res => setTimeout(res, ORS_REQUEST_DELAY)));

  return resultPromise;
};

// --- 3. LEAFLET HELPERS ---

/**
 * Fixes the issue where Leaflet default markers are not found in Next.js/Webpack builds.
 * Should be called inside a useEffect on map components.
 */
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