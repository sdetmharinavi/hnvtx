import {
  useQuery,
  useMutation,
  useQueryClient,
  UseQueryResult,
} from '@tanstack/react-query';
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
} from './queries-type-helpers';
import { createRpcQueryKey } from './utility-functions';
import {
  PagedOfcCablesCompleteResult,
} from '@/hooks/database/queries-type-helpers';
import { createPagedRpcHook } from '@/hooks/database/rpc-hook-factory';

// RPC query hook with performance enhancements
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
    staleTime: 3 * 60 * 1000,
    ...queryOptions,
  });
}

// Enhanced RPC mutation hook
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
        queryClient.invalidateQueries({ queryKey: ['rpc', functionName] });
        queryClient.invalidateQueries({ queryKey: ['table'] });
      }
      options?.onSuccess?.(data, variables, context);
    },
    ...mutationOptions,
  });
}

/**
 * A specialized hook to fetch paginated data from the `v_systems_complete` view
 * using the high-performance RPC function.
 */
export const usePagedSystemsComplete =
  createPagedRpcHook<PagedSystemsCompleteResult>(
    'get_paged_v_systems_complete', // RPC function name
    'v_systems_complete', // Unique query key
    'system_name' // Default sort column
  );

export const usePagedSystemConnectionsComplete =
  createPagedRpcHook<PagedSystemConnectionsCompleteResult>(
    'get_paged_system_connections_complete',
    'v_system_connections_complete',
    'system_name' // *** CORRECTLY USES "system_name" AS DEFAULT ***
  );

export const usePagedOfcCablesComplete =
  createPagedRpcHook<PagedOfcCablesCompleteResult>(
    'get_paged_ofc_cables_complete',
    'v_ofc_cables_complete',
    'route_name'
  );

export const usePagedOfcConnectionsComplete =
  createPagedRpcHook<PagedOfcConnectionsCompleteResult>(
    'get_paged_ofc_connections_complete',
    'v_ofc_connections_complete',
    'fiber_no_sn'
  );

export const usePagedNodesComplete =
  createPagedRpcHook<PagedNodesCompleteResult>(
    'get_paged_nodes_complete',
    'v_nodes_complete',
    'name'
  );

export const usePagedLookupTypesWithCount =
  createPagedRpcHook<PagedLookupTypesWithCountResult>(
    'get_paged_lookup_types_with_count',
    'v_lookup_types_with_count',
    'name'
  );

export const usePagedMaintenanceAreasWithCount =
  createPagedRpcHook<PagedMaintenanceAreasWithCountResult>(
    'get_paged_maintenance_areas_with_count',
    'v_maintenance_areas_with_count',
    'name'
  );

export const usePagedEmployeeDesignationsWithCount =
  createPagedRpcHook<PagedEmployeeDesignationsWithCountResult>(
    'get_paged_employee_designations_with_count',
    'v_employee_designations_with_count',
    'name'
  );

export const usePagedEmployeesWithCount =
  createPagedRpcHook<PagedEmployeesWithCountResult>(
    'get_paged_employees_with_count',
    'v_employees_with_count',
    'employee_name'
  );

export const usePagedRingsWithCount =
  createPagedRpcHook<PagedRingsWithCountResult>(
    'get_paged_rings_with_count',
    'v_rings_with_count',
    'name'
  );

export function useDashboardOverview(
  supabase: SupabaseClient<Database>,
  options: UseRpcQueryOptions<'get_dashboard_overview'>
) {
  return useRpcQuery(supabase, 'get_dashboard_overview', {}, options);
}

// Lookup type hooks
export function useGetLookupTypeId(
  supabase: SupabaseClient<Database>,
  category: string,
  name: string,
  options?: UseRpcQueryOptions<'get_lookup_type_id'>
) {
  return useRpcQuery(
    supabase,
    'get_lookup_type_id',
    { p_category: category, p_name: name },
    options
  );
}

export function useGetLookupTypesByCategory(
  supabase: SupabaseClient<Database>,
  category: string,
  options?: UseRpcQueryOptions<'get_lookup_types_by_category'>
) {
  return useRpcQuery(
    supabase,
    'get_lookup_types_by_category',
    { p_category: category },
    options
  );
}

export function useAddLookupType(
  supabase: SupabaseClient<Database>,
  options?: UseTableMutationOptions<string, RpcFunctionArgs<'add_lookup_type'>>
) {
  return useRpcMutation(supabase, 'add_lookup_type', options);
}

// User-related hooks
export function useGetMyUserDetails(
  supabase: SupabaseClient<Database>,
  options?: UseRpcQueryOptions<'get_my_user_details'>
) {
  return useRpcQuery(supabase, 'get_my_user_details', {}, options);
}

export function useGetMyRole(
  supabase: SupabaseClient<Database>,
  options?: UseRpcQueryOptions<'get_my_role'>
) {
  return useRpcQuery(supabase, 'get_my_role', {}, options);
}

export function useIsSuperAdmin(
  supabase: SupabaseClient<Database>,
  options?: UseRpcQueryOptions<'is_super_admin'>
) {
  return useRpcQuery(supabase, 'is_super_admin', {}, options);
}

// Admin function hooks
export function useAdminGetAllUsers(
  supabase: SupabaseClient<Database>,
  args?: RpcFunctionArgs<'admin_get_all_users'>,
  options?: UseRpcQueryOptions<'admin_get_all_users'>
) {
  return useRpcQuery(supabase, 'admin_get_all_users', args, options);
}

export function useAdminGetAllUsersExtended(
  supabase: SupabaseClient<Database>,
  args?: RpcFunctionArgs<'admin_get_all_users_extended'>,
  options?: UseRpcQueryOptions<'admin_get_all_users_extended'>
) {
  return useRpcQuery(supabase, 'admin_get_all_users_extended', args, options);
}

export function useAdminUpdateUserProfile(
  supabase: SupabaseClient<Database>,
  options?: UseTableMutationOptions<
    boolean,
    RpcFunctionArgs<'admin_update_user_profile'>
  >
) {
  return useRpcMutation(supabase, 'admin_update_user_profile', options);
}

export function useAdminBulkUpdateRole(
  supabase: SupabaseClient<Database>,
  options?: UseTableMutationOptions<
    boolean,
    RpcFunctionArgs<'admin_bulk_update_role'>
  >
) {
  return useRpcMutation(supabase, 'admin_bulk_update_role', options);
}

export function useAdminBulkUpdateStatus(
  supabase: SupabaseClient<Database>,
  options?: UseTableMutationOptions<
    boolean,
    RpcFunctionArgs<'admin_bulk_update_status'>
  >
) {
  return useRpcMutation(supabase, 'admin_bulk_update_status', options);
}

export function useAdminBulkDeleteUsers(
  supabase: SupabaseClient<Database>,
  options?: UseTableMutationOptions<
    boolean,
    RpcFunctionArgs<'admin_bulk_delete_users'>
  >
) {
  return useRpcMutation(supabase, 'admin_bulk_delete_users', options);
}
