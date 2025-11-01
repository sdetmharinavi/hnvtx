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
  Filters,
} from './queries-type-helpers';
import { buildRpcFilters, createRpcQueryKey } from './utility-functions';
import { DEFAULTS } from '@/constants/constants';

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
  options?: Omit<UseQueryOptions<RpcFunctionReturns<T>, Error, TData>, 'queryKey' | 'queryFn'>
) {
  const { performance, ...queryOptions } = (options || {}) as UseRpcQueryOptions<T, TData>;

  return useQuery<RpcFunctionReturns<T>, Error, TData>({
    queryKey: createRpcQueryKey(functionName, args, performance),
    queryFn: async (): Promise<RpcFunctionReturns<T>> => {
      const { data, error } = await supabase.rpc(
        functionName,
        args || ({} as RpcFunctionArgs<T>)
      );
      if (error) throw error;
      return data as RpcFunctionReturns<T>;
    },
    staleTime: 3 * 60 * 1000,
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
    //  The onSuccess callback now correctly accepts all four arguments
    onSuccess: (data, variables, context, mutation) => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ['table'] });
        queryClient.invalidateQueries({ queryKey: ['rpc'] });
      }
      // The original onSuccess is called with the correct signature
      if (options?.onSuccess) {
        options.onSuccess(data, variables, context, mutation);
      }
    },
    ...mutationOptions,
  });
}

// Specific hook for the dashboard overview
export function useDashboardOverview(
  supabase: SupabaseClient<Database>,
  options?: UseRpcQueryOptions<'get_dashboard_overview'>
) {
  return useRpcQuery(supabase, 'get_dashboard_overview', undefined, options);
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

// CORRECTED: The options now correctly use the `Filters` type
interface UsePagedDataOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  filters?: Filters; // <-- This now uses the correct, complex Filters type
}

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

  // The hook internally converts the complex Filters object to the simple JSON the RPC expects
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
    placeholderData: (previousData) => previousData,
    ...queryOptions,
  });
}