import { useQueryClient, QueryClient } from '@tanstack/react-query';
import {
  Filters,
  RpcFunctionArgs,
  RpcFunctionName,
  RpcFunctionReturns,
  PublicTableName,
  TableRow,
  UseTableQueryOptions,
} from './queries-type-helpers';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase-types';
import {
  applyFilters,
  applyOrdering,
  createQueryKey,
  createRpcQueryKey,
} from './utility-functions';
import { DEFAULTS } from '@/constants/constants';

// Performance monitoring hook
export function useQueryPerformance() {
  const queryClient = useQueryClient();

  const getQueryStats = () => {
    const cache = queryClient.getQueryCache();
    const queries = cache.getAll();

    return {
      totalQueries: queries.length,
      staleQueries: queries.filter((q) => q.isStale()).length,
      inactiveQueries: queries.filter((q) => q.getObserversCount() === 0).length,
      fetchingQueries: queries.filter((q) => q.state.status === 'pending').length,
      cacheSizeBytes: JSON.stringify(cache).length,
    };
  };

  const clearStaleQueries = () => {
    queryClient.removeQueries({
      predicate: (query) => query.isStale() && query.state.status !== 'pending',
    });
  };

  const prefetchCriticalData = async (
    supabase: SupabaseClient<Database>,
    criticalTables: PublicTableName[]
  ) => {
    const promises = criticalTables.map((tableName) =>
      queryClient.prefetchQuery({
        queryKey: ['table', tableName],
        queryFn: async () => {
          const { data, error } = await supabase
            .from(tableName)
            .select('*')
            .limit(DEFAULTS.PAGE_SIZE);
          if (error) throw error;
          return data;
        },
        staleTime: DEFAULTS.CACHE_TIME,
      })
    );

    await Promise.all(promises);
  };

  return {
    getQueryStats,
    clearStaleQueries,
    prefetchCriticalData,
  };
}

// Specialized hooks for RPC functions (keeping existing ones)
// This type is generated automatically by the Supabase CLI!
// Define the return type with more precision
// Use `Array<T>` syntax for clarity and add `| null` to handle initial/error states.

// Enhanced cache utilities with performance optimizations
export const tableQueryUtils = {
  invalidateTable: (queryClient: QueryClient, tableName: string) => {
    queryClient.invalidateQueries({ queryKey: ['table', tableName] });
    queryClient.invalidateQueries({ queryKey: ['unique', tableName] });
  },

  invalidateAllTables: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['table'] });
    queryClient.invalidateQueries({ queryKey: ['unique'] });
  },

  invalidateRpc: (queryClient: QueryClient, functionName: string) => {
    queryClient.invalidateQueries({ queryKey: ['rpc', functionName] });
  },

  invalidateAllRpc: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: ['rpc'] });
  },

  prefetchTable: async <T extends PublicTableName>(
    queryClient: QueryClient,
    supabase: SupabaseClient<Database>,
    tableName: T,
    options?: UseTableQueryOptions<T>
  ) => {
    return queryClient.prefetchQuery({
      queryKey: createQueryKey(
        tableName,
        options?.filters,
        options?.columns,
        options?.orderBy,
        options?.deduplication, // 5th argument
        options?.aggregation, // 6th argument
        undefined, // 7th argument (enhancedOrderBy is not used in prefetch)
        options?.limit, // 8th argument
        options?.offset // 9th argument
      ),
      queryFn: async (): Promise<TableRow<T>[]> => {
        let query = supabase.from(tableName).select(options?.columns || '*');

        if (options?.filters) {
          query = applyFilters(query, options.filters);
        }

        if (options?.orderBy) {
          query = applyOrdering(query, options.orderBy);
        }

        if (options?.limit) {
          query = query.limit(options.limit);
        }

        const { data, error } = await query;
        if (error) throw error;
        return (data as TableRow<T>[]) || [];
      },
      staleTime: 5 * 60 * 1000,
    });
  },

  prefetchRpc: async <T extends RpcFunctionName>(
    queryClient: QueryClient,
    supabase: SupabaseClient<Database>,
    functionName: T,
    args?: RpcFunctionArgs<T>
  ) => {
    return queryClient.prefetchQuery({
      queryKey: createRpcQueryKey(functionName, args),
      queryFn: async (): Promise<RpcFunctionReturns<T>> => {
        const { data, error } = await supabase.rpc(
          functionName,
          args || ({} as RpcFunctionArgs<T>)
        );
        if (error) throw error;
        return data as RpcFunctionReturns<T>;
      },
      staleTime: 3 * 60 * 1000,
    });
  },

  // Optimized cache management
  setQueryData: <T extends PublicTableName>(
    queryClient: QueryClient,
    tableName: T,
    data: TableRow<T>[],
    filters?: Filters,
    columns?: string
  ) => {
    queryClient.setQueryData(createQueryKey(tableName, filters, columns), data);
  },

  getQueryData: <T extends PublicTableName>(
    queryClient: QueryClient,
    tableName: T,
    filters?: Filters,
    columns?: string
  ): TableRow<T>[] | undefined => {
    return queryClient.getQueryData(createQueryKey(tableName, filters, columns));
  },

  // Performance monitoring
  getTableCacheStats: (queryClient: QueryClient, tableName: string) => {
    const cache = queryClient.getQueryCache();
    const tableQueries = cache.findAll({
      queryKey: ['table', tableName],
    });

    return {
      queryCount: tableQueries.length,
      staleCount: tableQueries.filter((q) => q.isStale()).length,
      fetchingCount: tableQueries.filter((q) => q.state.status === 'pending').length,
      errorCount: tableQueries.filter((q) => q.state.status === 'error').length,
      totalDataSize: tableQueries.reduce((acc, query) => {
        const data = query.state.data;
        return acc + (data ? JSON.stringify(data).length : 0);
      }, 0),
    };
  },

  // Cleanup utilities
  removeStaleQueries: (
    queryClient: QueryClient,
    maxAge = 10 * 60 * 1000 // 10 minutes
  ) => {
    queryClient.removeQueries({
      predicate: (query) => {
        const isOld = Date.now() - query.state.dataUpdatedAt > maxAge;
        return isOld && query.isStale() && query.state.status !== 'pending';
      },
    });
  },

  // Batch operations
  batchInvalidate: (
    queryClient: QueryClient,
    operations: Array<{ type: 'table' | 'rpc'; name: string }>
  ) => {
    operations.forEach(({ type, name }) => {
      queryClient.invalidateQueries({ queryKey: [type, name] });
    });
  },
};
