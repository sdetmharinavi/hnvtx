'use client'

import { QueryClient, QueryClientProvider, useIsRestoring } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState, ReactNode } from 'react'
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { get, set, del } from 'idb-keyval'
import { PageSpinner } from '@/components/common/ui'

// This gate component remains correct and is essential.
function HydrationGate({ children }: { children: ReactNode }) {
  const isRestoring = useIsRestoring();
  
  if (isRestoring) {
    return <PageSpinner text="Restoring session..." />;
  }
  
  return <>{children}</>;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 1000 * 60 * 60 * 24, // 24 hours
        retry: (failureCount, error: Error) => {
          if ('status' in error && typeof error.status === 'number' && error.status >= 400 && error.status < 500) {
            return false
          }
          return failureCount < 3
        },
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: 1,
      },
    },
  }))

  // Create the async storage interface for idb-keyval. This is correct.
  const asyncStorage = {
    getItem: (key: string) => get(key),
    setItem: (key: string, value: unknown) => set(key, value),
    removeItem: (key: string) => del(key),
  }

  // THE FIX: Use the correctly imported createAsyncStoragePersister.
  const persister = createAsyncStoragePersister({
    storage: asyncStorage,
  })

  return (
    <QueryClientProvider client={queryClient}>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{
          persister: persister,
          buster: 'v1',
          maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
        }}
      >
        <HydrationGate>
          {children}
        </HydrationGate>
        <ReactQueryDevtools initialIsOpen={false} />
      </PersistQueryClientProvider>
    </QueryClientProvider>
  )
}