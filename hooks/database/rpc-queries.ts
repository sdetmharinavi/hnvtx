// path: hooks/database/rpc-queries.ts
import { useQuery, useMutation, useQueryClient, UseQueryOptions } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase-types';
import {
  RpcFunctionName,
  RpcFunctionArgs,
  RpcFunctionReturns,
  UseRpcQueryOptions,
  UseTableMutationOptions,
} from './queries-type-helpers';
import { buildRpcFilters, createRpcQueryKey, RpcFilters } from './utility-functions';
import { DEFAULTS } from '@/config/constants';

// =================================================================
// Section 1: Generic & Specific RPC Hooks (Non-Paginated)
// =================================================================

// Generic RPC query hook for any non-paginated function
export function useRpcQuery<
  T extends RpcFunctionName,
  TData = RpcFunctionReturns<T>
>(
  supabase: SupabaseClient<Database>,
  functionName: T,
  args?: RpcFunctionArgs<T>,
  options?: UseRpcQueryOptions<T, TData>
) {
  const { performance, ...queryOptions } = options || {};

  return useQuery({
    queryKey: createRpcQueryKey(functionName, args, performance),
    queryFn: async (): Promise<RpcFunctionReturns<T>> => {
      const { data, error } = await supabase.rpc(
        functionName,
        args || ({} as RpcFunctionArgs<T>)
      );
      if (error) throw error;
      return data as RpcFunctionReturns<T>;
    },
    staleTime: 3 * 60 * 1000, // Default stale time for RPCs
    ...queryOptions,
  });
}

// Generic RPC mutation hook
export function useRpcMutation<T extends RpcFunctionName>(
  supabase: SupabaseClient<Database>,
  functionName: T,
  options?: UseTableMutationOptions<RpcFunctionReturns<T>, RpcFunctionArgs<T>>
) {
  const queryClient = useQueryClient();
  const { invalidateQueries = true, ...mutationOptions } = options || {};

  return useMutation({
    mutationFn: async (
      args: RpcFunctionArgs<T>
    ): Promise<RpcFunctionReturns<T>> => {
      const { data, error } = await supabase.rpc(
        functionName,
        args || ({} as RpcFunctionArgs<T>)
      );
      if (error) throw error;
      return data as RpcFunctionReturns<T>;
    },
    onSuccess: (data, variables, context, mutation) => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ['table'] });
        queryClient.invalidateQueries({ queryKey: ['rpc'] });
      }
      options?.onSuccess?.(data, variables, context, mutation);
    },
    ...mutationOptions,
  });
}

// Specific hook for the dashboard overview
export function useDashboardOverview(
  supabase: SupabaseClient<Database>,
  options?: UseRpcQueryOptions<'get_dashboard_overview'>
) {
  return useRpcQuery(supabase, 'get_dashboard_overview', {}, options);
}

// =================================================================
// Section 2: Efficient Generic Pagination Hook
// =================================================================

// Define the shape of the JSONB object returned by the efficient `get_paged_data` SQL function
export interface PagedDataResult<T> {
  data: T[];
  total_count: number;
  active_count: number;
  inactive_count: number;
}

// Hook options for our new generic paged hook
interface UsePagedDataOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  filters?: RpcFilters;
}

// A type guard to safely check if the RPC response is valid.
function isPagedDataResult<T>(obj: unknown): obj is PagedDataResult<T> {
  if (typeof obj !== 'object' || obj === null) return false;
  const o = obj as Record<string, unknown>;
  return (
    Array.isArray(o['data']) &&
    typeof o['total_count'] === 'number' &&
    typeof o['active_count'] === 'number' &&
    typeof o['inactive_count'] === 'number'
  );
}

/**
 * A generic hook to fetch paginated data from any view using the efficient 'get_paged_data' RPC.
 * @param viewName The name of the table or view to query.
 * @param hookOptions Pagination, ordering, and filtering options.
 * @param queryOptions Standard TanStack Query options.
 */
export function usePagedData<T>(
  supabase: SupabaseClient<Database>,
  viewName: string | null,
  hookOptions: UsePagedDataOptions = {},
  queryOptions: Omit<UseQueryOptions<PagedDataResult<T>, Error>, 'queryKey' | 'queryFn'> = {}
) {
  const {
    limit = DEFAULTS.PAGE_SIZE,
    offset = 0,
    orderBy = 'name',
    orderDir = 'asc',
    filters = {},
  } = hookOptions;

  const rpcFilters = buildRpcFilters(filters);
  const queryKey = ['paged-data', viewName, { limit, offset, orderBy, orderDir, filters: rpcFilters }];

  const queryFn = async (): Promise<PagedDataResult<T>> => {
    const defaultValue: PagedDataResult<T> = {
      data: [],
      total_count: 0,
      active_count: 0,
      inactive_count: 0,
    };

    if (!viewName) {
      return defaultValue;
    }

    const { data, error } = await supabase.rpc('get_paged_data', {
      p_view_name: viewName,
      p_limit: limit,
      p_offset: offset,
      p_order_by: orderBy,
      p_order_dir: orderDir,
      p_filters: rpcFilters,
    });

    if (error) {
      console.error(`Error fetching paginated data for '${viewName}':`, error);
      throw new Error(error.message);
    }

    if (isPagedDataResult<T>(data)) {
      return data;
    } else {
      console.warn(`Unexpected response structure for 'get_paged_data' on view '${viewName}'.`, data);
      return defaultValue;
    }
  };

  return useQuery<PagedDataResult<T>, Error>({
    queryKey,
    queryFn,
    enabled: !!viewName && (queryOptions.enabled ?? true),
    ...queryOptions,
  });
}