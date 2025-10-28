// path: hooks/useORSRouteDistances.ts
import { useQuery } from '@tanstack/react-query';
import { RingMapNode } from '@/components/map/types/node';
import { useMemo } from 'react';

async function fetchRouteDistances(pairs: Array<[RingMapNode, RingMapNode]>): Promise<Record<string, string>> {
  if (pairs.length === 0) {
    return {};
  }

  // Use a Map to ensure unique pairs, preventing duplicate API calls
  const uniquePairs = new Map<string, [RingMapNode, RingMapNode]>();
  pairs.forEach(([startNode, endNode]) => {
    // Sort IDs to create a consistent key regardless of order
    const key = [startNode.id, endNode.id].sort().join('-');
    if (!uniquePairs.has(key)) {
      uniquePairs.set(key, [startNode, endNode]);
    }
  });

  const distancePromises = Array.from(uniquePairs.values()).map(async ([startNode, endNode]) => {
    try {
      const response = await fetch('/api/ors-distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a: startNode, b: endNode }),
      });

      if (!response.ok) {
        // Log the error but don't throw, so other requests can succeed.
        console.error(`API error for pair ${startNode.id}-${endNode.id}: ${response.statusText}`);
        return null;
      }
      
      const data = await response.json();
      return {
        startId: startNode.id,
        endId: endNode.id,
        distance: data.distance_km ? `${data.distance_km} km` : 'N/A',
      };
    } catch (error) {
      console.error(`Fetch failed for pair ${startNode.id}-${endNode.id}:`, error);
      return null;
    }
  });

  const results = await Promise.all(distancePromises);
  const distances: Record<string, string> = {};

  results.forEach(result => {
    if (result) {
      //  Create keys for both directions so the map can look up A-B or B-A
      distances[`${result.startId}-${result.endId}`] = result.distance;
      distances[`${result.endId}-${result.startId}`] = result.distance;
    }
  });

  return distances;
}

export default function useORSRouteDistances(pairs: Array<[RingMapNode, RingMapNode]>) {
  // The queryKey should also be consistently sorted to ensure caching works correctly.
  const sortedUniqueKeys = useMemo(() => {
    const keys = pairs.map(p => [p[0].id, p[1].id].sort().join('-'));
    // Use a Set to get unique keys, then sort them to ensure the query key is stable.
    return [...new Set(keys)].sort();;
  }, [pairs]);

  return useQuery({
    queryKey: ['ors-distances', sortedUniqueKeys],
    queryFn: () => fetchRouteDistances(pairs),
    staleTime: Infinity, // Distances are static, no need to refetch unless keys change.
    enabled: pairs.length > 0,
  });
}