// path: hooks/useORSRouteDistances.ts
import { useQueries, useQueryClient } from '@tanstack/react-query';
import { RingMapNode } from '@/components/map/types/node';
import { useMemo, useEffect } from 'react';

// --- Module-level Singleton for Rate-Limited Fetching ---

interface FetchJob {
  key: string; // "node1-id-node2-id"
  queryKey: readonly unknown[]; // ['ors-distance', 'node1-id-node2-id']
  startNode: RingMapNode;
  endNode: RingMapNode;
}

// Global queue and processing flag to ensure only one fetch runs at a time.
let isProcessing = false;
const fetchQueue: FetchJob[] = [];
const requestDelay = 1600; // 1.6 seconds to stay well below 40 requests/minute.

async function processQueue(queryClient: ReturnType<typeof useQueryClient>) {
  if (isProcessing) return;
  isProcessing = true;

  while (fetchQueue.length > 0) {
    const job = fetchQueue.shift();
    if (!job) continue;

    try {
      // Set placeholder data to indicate loading for this specific query
      queryClient.setQueryData(job.queryKey, '...');

      const response = await fetch('/api/ors-distance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ a: job.startNode, b: job.endNode }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.statusText}`);
      }

      const data = await response.json();
      const distance = data.distance_km ? `${data.distance_km} km` : 'N/A';

      // Cache the successful result indefinitely
      queryClient.setQueryData(job.queryKey, distance);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed';
      console.log('errorMessage: ', errorMessage);

      console.error(`Fetch failed for pair ${job.key}:`, error);
      // Cache the error state
      queryClient.setQueryData(job.queryKey, 'Error');
    }

    // Wait before the next request
    if (fetchQueue.length > 0) {
      await new Promise((resolve) => setTimeout(resolve, requestDelay));
    }
  }

  isProcessing = false;
}

function queueDistanceFetch(
  queryClient: ReturnType<typeof useQueryClient>,
  startNode: RingMapNode,
  endNode: RingMapNode
) {
  const key = [startNode.id, endNode.id].sort().join('-');
  const queryKey = ['ors-distance', key];

  // Do not queue if already in the cache or currently in the queue
  if (queryClient.getQueryData(queryKey) || fetchQueue.some((job) => job.key === key)) {
    return;
  }

  fetchQueue.push({ key, queryKey, startNode, endNode });

  // Trigger the processing function if it's not already running
  if (!isProcessing) {
    void processQueue(queryClient);
  }
}

// --- The React Hook ---

export default function useORSRouteDistances(pairs: Array<[RingMapNode, RingMapNode]>) {
  const queryClient = useQueryClient();

  // Memoize the unique pairs to work with
  const uniquePairs = useMemo(() => {
    const map = new Map<string, [RingMapNode, RingMapNode]>();
    pairs.forEach(([startNode, endNode]) => {
      const key = [startNode.id, endNode.id].sort().join('-');
      if (!map.has(key)) {
        map.set(key, [startNode, endNode]);
      }
    });
    return Array.from(map.values());
  }, [pairs]);

  // When the component needs pairs, queue up any that aren't already cached/queued
  useEffect(() => {
    uniquePairs.forEach(([startNode, endNode]) => {
      queueDistanceFetch(queryClient, startNode, endNode);
    });
  }, [uniquePairs, queryClient]);

  // `useQueries` is the key to subscribing to all the individual cache entries
  const results = useQueries({
    queries: uniquePairs.map(([startNode, endNode]) => {
      const key = [startNode.id, endNode.id].sort().join('-');
      return {
        queryKey: ['ors-distance', key],
        // No queryFn needed here; we just want to subscribe to cache changes
        // that our `processQueue` function will make.
        staleTime: Infinity, // This data never goes stale
        // We set initialData so that if a value is not in the cache yet, it defaults to '...'
        initialData: '...',
      };
    }),
  });

  // Re-assemble the results into the dictionary format the component expects
  const distances = useMemo(() => {
    const distDict: Record<string, string> = {};
    results.forEach((result, index) => {
      const [startNode, endNode] = uniquePairs[index];
      const distance = (result.data as string) ?? '...';
      distDict[`${startNode.id}-${endNode.id}`] = distance;
      distDict[`${endNode.id}-${startNode.id}`] = distance;
    });
    return distDict;
  }, [results, uniquePairs]);

  // The overall loading state is true if any of the subscribed queries are fetching.
  // Note: Since we don't have a `queryFn`, `isFetching` won't work as expected.
  // We can derive loading state by checking for the '...' placeholder.
  const isLoading = useMemo(() => {
    return Object.values(distances).some((d) => d === '...');
  }, [distances]);

  return { distances, isLoading };
}
