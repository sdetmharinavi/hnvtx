// path: hooks/useORSRouteDistances.ts
import { useQueries } from '@tanstack/react-query';
import { RingMapNode } from '@/components/map/ClientRingMap/types';
import { useMemo } from 'react';

// --- Module-level Singleton for Rate-Limited Fetching ---

// A promise chain that ensures requests are sent one after another with a delay.
// THE FIX: Initialize as a resolved promise of type void.
let fetchChain: Promise<void> = Promise.resolve();
const requestDelay = 1600; // 1.6 seconds delay to stay well below 40 requests/minute.

/**
 * A rate-limited fetch wrapper that chains promises to serialize API calls.
 * @param url The URL to fetch.
 * @param options The fetch options.
 * @returns A promise that resolves with the JSON response.
 */
const rateLimitedFetch = (url: string, options: RequestInit) => {
  // THE FIX: This is a simpler, type-safe way to create a sequential promise queue.
  
  // 1. Create the function that will perform the actual fetch.
  const makeRequest = async () => {
    const response = await fetch(url, options);
    if (!response.ok) {
      console.error(`API error for ${url}: ${response.statusText}`);
      throw new Error(`API error: ${response.statusText}`);
    }
    return response.json();
  };

  // 2. Chain the request to the existing fetchChain.
  // `resultPromise` will hold the promise for the JSON data.
  const resultPromise = fetchChain.then(makeRequest);
  
  // 3. Update the global fetchChain for the *next* caller.
  // This new chain waits for the current request to settle (succeed or fail)
  // and then adds the delay. Since this `.then()` returns nothing,
  // the type of fetchChain remains `Promise<void>`, resolving the TS error.
  fetchChain = resultPromise
  .then(() => new Promise<void>(res => setTimeout(res, requestDelay)))
  .catch(() => new Promise<void>(res => setTimeout(res, requestDelay)));

  // 4. Return the promise for the actual data, without the delay.
  return resultPromise;
};


// --- The React Hook ---

export default function useORSRouteDistances(pairs: Array<[RingMapNode, RingMapNode]>) {

  const uniquePairs = useMemo(() => {
    const map = new Map<string, [RingMapNode, RingMapNode]>();
    pairs.forEach(([startNode, endNode]) => {
      // Create a consistent key by sorting IDs
      const key = [startNode.id, endNode.id].sort().join('-');
      if (!map.has(key)) {
        map.set(key, [startNode, endNode]);
      }
    });
    return Array.from(map.values());
  }, [pairs]);

  // `useQueries` subscribes to the results of multiple, independent queries.
  const results = useQueries({
    queries: uniquePairs.map(([startNode, endNode]) => {
      const key = [startNode.id, endNode.id].sort().join('-');
      return {
        queryKey: ['ors-distance', key],
        queryFn: async () => {
          try {
            const data = await rateLimitedFetch('/api/ors-distance', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ a: startNode, b: endNode }),
            });
            return data.distance_km ? `${data.distance_km} km` : 'N/A';
          } catch (error) {
            console.error(`Fetch failed for pair ${key}:`, error);
            throw error;
          }
        },
        staleTime: Infinity,
        retry: 2,
      };
    }),
  });

  // Re-assemble the results into the dictionary format the component expects.
  const distances = useMemo(() => {
    const distDict: Record<string, string> = {};
    results.forEach((result, index) => {
      const [startNode, endNode] = uniquePairs[index];
      let distance: string;

      if (result.isLoading) {
        distance = '...';
      } else if (result.isError) {
        distance = 'Error';
      } else {
        distance = result.data as string;
      }
      distDict[`${startNode.id}-${endNode.id}`] = distance;
      distDict[`${endNode.id}-${startNode.id}`] = distance;
    });
    return distDict;
  }, [results, uniquePairs]);

  const isLoading = useMemo(() => {
    return results.some(r => r.isLoading);
  }, [results]);

  return { distances, isLoading };
}