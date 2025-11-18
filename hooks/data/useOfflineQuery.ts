// hooks/data/useOfflineQuery.ts
import { useQuery, UseQueryOptions, QueryKey } from '@tanstack/react-query';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { toast } from 'sonner';

/**
 * A custom TanStack Query hook that provides an offline fallback mechanism.
 * It attempts to fetch data from the `onlineQueryFn`. If the network is unavailable
 * or the online fetch fails due to a network error, it automatically falls back
 * to the `offlineQueryFn` to retrieve data from a local source (e.g., IndexedDB).
 *
 * @param queryKey The unique key for the query.
 * @param onlineQueryFn An async function that fetches data from the primary (network) source.
 * @param offlineQueryFn An async function that fetches data from the fallback (local) source.
 * @param options Standard TanStack Query options.
 * @returns The result of the TanStack Query `useQuery` hook.
 */
export function useOfflineQuery<TData>(
  queryKey: QueryKey,
  onlineQueryFn: () => Promise<TData>,
  offlineQueryFn: () => Promise<TData>,
  options?: Omit<UseQueryOptions<TData, Error>, 'queryKey' | 'queryFn'>
) {
  const isOnline = useOnlineStatus();

  return useQuery<TData, Error>({
    queryKey,
    queryFn: async () => {
      if (isOnline) {
        try {
          // Attempt to fetch fresh data from the network
          const data = await onlineQueryFn();
          return data;
        } catch (error) {
          // If the network error occurs while online, it's a genuine failure.
          // We then fall back to the offline data.
          console.warn(`Online fetch for queryKey "${String(queryKey)}" failed. Falling back to offline data. Error:`, error);
          toast.warning("Could not fetch latest data. Displaying offline content.", { id: `offline-fallback-${String(queryKey)}` });
          return offlineQueryFn();
        }
      } else {
        // If offline from the start, go directly to the local database
        toast.info("You are offline. Displaying locally cached data.", { id: `offline-mode-${String(queryKey)}` });
        return offlineQueryFn();
      }
    },
    ...options,
    // Ensure the query re-runs when the online status changes
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
}