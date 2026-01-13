// providers/QueryProvider.tsx
'use client';

import { QueryClient, QueryClientProvider, useIsRestoring, Query } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useState, ReactNode, useEffect } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';
import { PageSpinner } from '@/components/common/ui';

function HydrationGate({ children }: { children: ReactNode }) {
  const isRestoring = useIsRestoring();
  const [showAnyway, setShowAnyway] = useState(false);

  useEffect(() => {
    // SAFETY VALVE: If restoration takes > 3 seconds, unblock the UI.
    // This prevents the app from getting stuck on the spinner if IndexedDB hangs.
    if (isRestoring) {
      const timer = setTimeout(() => {
        console.warn('Hydration took too long, showing app anyway.');
        setShowAnyway(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isRestoring]);

  if (isRestoring && !showAnyway) {
    return <PageSpinner text="Restoring session..." />;
  }

  return <>{children}</>;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            gcTime: 1000 * 60 * 60 * 24, // 24 hours
            retry: (failureCount, error: Error) => {
              // Don't retry on 4xx client errors
              if (
                'status' in error &&
                typeof error.status === 'number' &&
                error.status >= 400 &&
                error.status < 500
              ) {
                return false;
              }
              return failureCount < 3;
            },
            refetchOnWindowFocus: false,
          },
          mutations: {
            retry: 1,
          },
        },
      })
  );

  const [buster, setBuster] = useState('v1');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedBuster = localStorage.getItem('query_cache_buster');
      if (storedBuster) {
        setBuster(storedBuster);
      }
    }
  }, []);

  const asyncStorage = {
    getItem: (key: string) => get(key),
    setItem: (key: string, value: unknown) => set(key, value),
    removeItem: (key: string) => del(key),
  };

  const persister = createAsyncStoragePersister({
    storage: asyncStorage,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: persister,
          buster: buster,
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days

          dehydrateOptions: {
            shouldDehydrateQuery: (query: Query) => {
              const queryKey = query.queryKey;

              if (!Array.isArray(queryKey) || queryKey.length === 0) return false;

              const firstKey = String(queryKey[0]);

              // LIST OF KEYS MANAGED BY DEXIE (Do Not Persist in React Query)
              const DEXIE_MANAGED_KEYS = [
                'table', 
                'rpc', 
                'paged-data', 
                'rpc-record', 
                'systems-data',
                'nodes-data',
                'rings-manager-data',
                'ofc_cables-data',
                'ofc_connections-data',
                'system_connections-data',
                'ports_management-data',
                'inventory_items-data',
                'employees-data',
                'user_profiles-data',
                'maintenance_areas-data',
                'lookup_types-data',
                'e-files',
                'diary_data-for-month',
                'dashboard-overview',
                'ring-systems-data',
                'ring-connection-paths',
                'topology-cables',
                'topology-nodes',
                'categories-data-all',
                'active-system-connections-list',
                'ofc-routes-for-selection',
              ];

              if (DEXIE_MANAGED_KEYS.some((k) => firstKey.includes(k))) {
                return false;
              }

              return true;
            },
          },
        }}
      >
        <HydrationGate>{children}</HydrationGate>
        <ReactQueryDevtools initialIsOpen={false} />
      </PersistQueryClientProvider>
    </QueryClientProvider>
  );
}