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
import { localDb } from '@/hooks/data/localDb'; // THE FIX: Import localDb for fallback logic

// =================================================================
// Section 1: Generic & Specific RPC Hooks (Non-Paginated)
// =================================================================

// Generic RPC query hook
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
    onSuccess: (data, variables, context, mutation) => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ['table'] });
        queryClient.invalidateQueries({ queryKey: ['rpc'] });
      }
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

export interface PagedDataResult<T> {
  data: T[];
  total_count: number;
  active_count: number;
  inactive_count: number;
}

interface UsePagedDataOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'asc' | 'desc';
  filters?: Filters;
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

  const rpcFilters = buildRpcFilters(filters);
  const queryKey = ['paged-data', viewName, { limit, offset, orderBy, orderDir, filters: rpcFilters }];

  const queryFn = async (): Promise<PagedDataResult<T>> => {
    const defaultValue: PagedDataResult<T> = {
      data: [], total_count: 0, active_count: 0, inactive_count: 0,
    };

    if (!viewName) return defaultValue;

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
      console.warn(`Unexpected response structure for 'get_paged_data'.`, data);
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

// THE FIX: Define the stats interface
export interface RingManagerStats {
    total_rings: number;
    spec_issued: number;
    spec_pending: number;
    ofc_ready: number;
    ofc_partial_ready: number;
    ofc_pending: number;
    on_air_nodes: number;
    configured_in_maan: number;
}

// THE FIX: Offline-Capable Stats Hook
export function useRingManagerStats(supabase: SupabaseClient<Database>) {
    return useQuery({
        queryKey: ['ring-manager-stats'],
        queryFn: async (): Promise<RingManagerStats> => {
            // 1. Try Online RPC
            try {
              const { data, error } = await supabase.rpc('get_ring_manager_stats');
              if (error) throw error;
              if (data) return data as unknown as RingManagerStats;
            } catch (e) {
              console.warn("Online stats fetch failed, falling back to local:", e);
            }

            // 2. Offline Fallback Calculation
            try {
                const rings = await localDb.rings.toArray();
                
                const stats: RingManagerStats = {
                    total_rings: 0, spec_issued: 0, spec_pending: 0,
                    ofc_ready: 0, ofc_partial_ready: 0, ofc_pending: 0,
                    on_air_nodes: 0, configured_in_maan: 0
                };

                stats.total_rings = rings.filter(r => r.status).length;
                
                rings.forEach(r => {
                    if (!r.status) return;
                    
                    if (r.spec_status === 'Issued') stats.spec_issued++;
                    else stats.spec_pending++;
                    
                    if (r.ofc_status === 'Ready') stats.ofc_ready++;
                    else if (r.ofc_status === 'Partial Ready') stats.ofc_partial_ready++;
                    else stats.ofc_pending++;
                    
                    if (r.bts_status === 'Configured') stats.configured_in_maan++;
                });

                // Note: on_air_nodes is hard to calculate offline without heavy joins across 3 tables.
                // We default to 0 for offline mode to avoid performance hit.
                return stats;

            } catch (e) {
                console.error("Local stats calc failed:", e);
                return {
                    total_rings: 0, spec_issued: 0, spec_pending: 0,
                    ofc_ready: 0, ofc_partial_ready: 0, ofc_pending: 0,
                    on_air_nodes: 0, configured_in_maan: 0
                };
            }
        },
        staleTime: 5 * 60 * 1000 // Cache for 5 minutes
    });
}