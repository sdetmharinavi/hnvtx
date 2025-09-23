// path: hooks/database/rpc-queries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase-types';
import {
  RpcFunctionName,
  RpcFunctionArgs,
  RpcFunctionReturns,
  UseRpcQueryOptions,
  UseTableMutationOptions,
  PagedSystemsCompleteResult,
  PagedNodesCompleteResult,
  PagedOfcConnectionsCompleteResult,
  PagedSystemConnectionsCompleteResult,
  PagedLookupTypesWithCountResult,
  PagedMaintenanceAreasWithCountResult,
  PagedEmployeeDesignationsWithCountResult,
  PagedEmployeesWithCountResult,
  PagedRingsWithCountResult,
  PagedOfcCablesCompleteResult
} from './queries-type-helpers';
import { createRpcQueryKey } from './utility-functions';
import { createPagedRpcHook } from './rpc-hook-factory';

// =================================================================
// Section 1: Generated Hooks for Paginated Views
// =================================================================

// FIX: We no longer pass the <Paged...Result> generic.
// TypeScript now infers the return type automatically from the function name.
export const usePagedNodesComplete = createPagedRpcHook(
  'get_paged_nodes_complete', 'paged-nodes', 'name'
);

export const usePagedOfcCablesComplete = createPagedRpcHook(
  'get_paged_ofc_cables_complete', 'paged-ofc-cables', 'route_name'
);

export const usePagedOfcConnectionsComplete = createPagedRpcHook(
  'get_paged_ofc_connections_complete', 'paged-ofc-connections', 'fiber_no_sn'
);

export const usePagedSystemsComplete = createPagedRpcHook(
  'get_paged_systems_complete', 'paged-systems', 'system_name'
);

export const usePagedSystemConnectionsComplete = createPagedRpcHook(
  'get_paged_system_connections_complete', 'paged-system-connections', 'system_name'
);

export const usePagedLookupTypesWithCount = createPagedRpcHook(
  'get_paged_lookup_types_with_count', 'paged-lookup-types', 'name'
);

export const usePagedMaintenanceAreasWithCount = createPagedRpcHook(
  'get_paged_maintenance_areas_with_count', 'paged-maintenance-areas', 'name'
);

export const usePagedEmployeeDesignationsWithCount = createPagedRpcHook(
  'get_paged_employee_designations_with_count', 'paged-employee-designations', 'name'
);

export const usePagedEmployeesWithCount = createPagedRpcHook(
  'get_paged_employees_with_count', 'paged-employees', 'employee_name'
);

export const usePagedRingsWithCount = createPagedRpcHook(
  'get_paged_rings_with_count', 'paged-rings', 'name'
);

// =================================================================
// Section 2: Generic & Specific RPC Hooks (Non-Paginated)
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
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        // A generic mutation should invalidate all table and rpc data
        // as we don't know what it changed.
        queryClient.invalidateQueries({ queryKey: ['table'] });
        queryClient.invalidateQueries({ queryKey: ['rpc'] });
      }
      options?.onSuccess?.(data, variables, context);
    },
    ...mutationOptions,
  });
}

// Specific hook for the dashboard overview
export function useDashboardOverview(
  supabase: SupabaseClient<Database>,
  options?: UseRpcQueryOptions<'get_dashboard_overview'>
) {
  // Note: The third argument (args) is an empty object because this RPC takes no parameters.
  return useRpcQuery(supabase, 'get_dashboard_overview', {}, options);
}