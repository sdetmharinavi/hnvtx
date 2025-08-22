import { useQuery, useMutation, useQueryClient, UseQueryResult } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { RpcFunctionName, RpcFunctionArgs, RpcFunctionReturns, UseRpcQueryOptions, UseTableMutationOptions, PagedSystemsCompleteResult, UsePagedSystemsCompleteOptions, UsePagedNodesCompleteOptions, PagedNodesCompleteResult, PagedOfcConnectionsCompleteResult, UsePagedOfcConnectionsCompleteOptions, UsePagedSystemConnectionsCompleteOptions, PagedSystemConnectionsCompleteResult } from "./queries-type-helpers";
import { createRpcQueryKey } from "./utility-functions";
import { PagedOfcCablesCompleteResult, UsePagedOfcCablesCompleteOptions } from "@/hooks/database/queries-type-helpers";

// RPC query hook with performance enhancements
export function useRpcQuery<T extends RpcFunctionName, TData = RpcFunctionReturns<T>>(supabase: SupabaseClient<Database>, functionName: T, args?: RpcFunctionArgs<T>, options?: UseRpcQueryOptions<T, TData>) {
  const { performance, ...queryOptions } = options || {};

  return useQuery({
    queryKey: createRpcQueryKey(functionName, args, performance),
    queryFn: async (): Promise<RpcFunctionReturns<T>> => {
      const { data, error } = await supabase.rpc(functionName, args || ({} as RpcFunctionArgs<T>));
      if (error) throw error;
      return data as RpcFunctionReturns<T>;
    },
    staleTime: 3 * 60 * 1000,
    ...queryOptions,
  });
}

// Enhanced RPC mutation hook
export function useRpcMutation<T extends RpcFunctionName>(supabase: SupabaseClient<Database>, functionName: T, options?: UseTableMutationOptions<RpcFunctionReturns<T>, RpcFunctionArgs<T>>) {
  const queryClient = useQueryClient();
  const { invalidateQueries = true, ...mutationOptions } = options || {};

  return useMutation({
    mutationFn: async (args: RpcFunctionArgs<T>): Promise<RpcFunctionReturns<T>> => {
      const { data, error } = await supabase.rpc(functionName, args || ({} as RpcFunctionArgs<T>));
      if (error) throw error;
      return data as RpcFunctionReturns<T>;
    },
    onSuccess: (data, variables, context) => {
      if (invalidateQueries) {
        queryClient.invalidateQueries({ queryKey: ["rpc", functionName] });
        queryClient.invalidateQueries({ queryKey: ["table"] });
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
export function usePagedSystemsComplete(supabase: SupabaseClient<Database>, options: UsePagedSystemsCompleteOptions) {
  const { limit = 20, offset = 0, orderBy = "system_name", orderDir = "asc", filters = {}, queryOptions } = options;

  return useQuery<PagedSystemsCompleteResult, Error>({
    queryKey: ["v_systems_complete", { limit, offset, orderBy, orderDir, filters }],

    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_paged_v_systems_complete", {
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_filters: filters,
      });

      if (error) {
        console.error("Error fetching paged systems:", error);
        throw new Error(error.message);
      }

      return data ?? null;
    },
    ...queryOptions,
  });
}

/**
 * Custom hook to fetch paginated, sorted, and filtered data from the v_system_connections_complete view.
 *
 * @param supabase - The Supabase client instance.
 * @param options - Options for pagination, sorting, filtering, and other React Query settings.
 */
export function usePagedSystemConnectionsComplete(
  supabase: SupabaseClient<Database>,
  options: UsePagedSystemConnectionsCompleteOptions
): UseQueryResult<PagedSystemConnectionsCompleteResult, Error> {
  const {
    limit = 10,
    offset = 0,
    orderBy = "system_name", // Default order_by is a valid column
    orderDir = "asc",
    filters = {},
    queryOptions,
  } = options;

  return useQuery<PagedSystemConnectionsCompleteResult, Error>({
    // Query key includes all parameters to ensure uniqueness and refetching when they change.
    queryKey: ["v_system_connections_complete", { limit, offset, orderBy, orderDir, filters }],

    queryFn: async () => {
      // Call the Supabase RPC function with the specified parameters.
      const { data, error } = await supabase.rpc("get_paged_system_connections_complete", {
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_filters: filters,
      });

      if (error) {
        console.error("Error fetching paged system connections:", error);
        throw new Error(error.message);
      }

      return data ?? null;
    },
    // Spread any additional react-query options for flexibility (e.g., enabled, staleTime).
    ...queryOptions,
  });
}

/**
 * A specialized hook to fetch paginated and filtered data from the 
 * `v_ofc_cables_complete` view using the high-performance RPC function.
 */
export function usePagedOfcCablesComplete(supabase: SupabaseClient<Database>, options: UsePagedOfcCablesCompleteOptions): UseQueryResult<PagedOfcCablesCompleteResult, Error> {
  const { 
    limit = 10, 
    offset = 0, 
    orderBy = "route_name", 
    orderDir = "asc", 
    filters = {}, 
    queryOptions 
  } = options;

  return useQuery<PagedOfcCablesCompleteResult, Error>({
    // Query key includes all parameters to ensure uniqueness
    queryKey: ["v_ofc_cables_complete", { limit, offset, orderBy, orderDir, filters }],

    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_paged_ofc_cables_complete", {
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_filters: filters,
      });

      if (error) {
        console.error("Error fetching paged OFC cables:", error);
        throw new Error(error.message);
      }

      return data ?? null;
    },
    // Spread any additional react-query options
    ...queryOptions,
  });
}

/**
 * Custom hook to fetch paginated, sorted, and filtered data from the v_ofc_connections_complete view.
 *
 * @param supabase - The Supabase client instance.
 * @param options - Options for pagination, sorting, filtering, and other React Query settings.
 */
export function usePagedOfcConnectionsComplete(
  supabase: SupabaseClient<Database>,
  options: UsePagedOfcConnectionsCompleteOptions
): UseQueryResult<PagedOfcConnectionsCompleteResult, Error> {
  const {
    limit = 10,
    offset = 0,
    orderBy = "ofc_route_name", // Default order_by is a valid column
    orderDir = "asc",
    filters = {},
    queryOptions,
  } = options;

  return useQuery<PagedOfcConnectionsCompleteResult, Error>({
    // Query key includes all parameters to ensure uniqueness and refetching when they change.
    queryKey: ["v_ofc_connections_complete", { limit, offset, orderBy, orderDir, filters }],

    queryFn: async () => {
      // Call the Supabase RPC function with the specified parameters.
      const { data, error } = await supabase.rpc("get_paged_ofc_connections_complete", {
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_filters: filters,
      });

      if (error) {
        console.error("Error fetching paged OFC connections:", error);
        throw new Error(error.message);
      }

      return data ?? null;
    },
    // Spread any additional react-query options for flexibility (e.g., enabled, staleTime).
    ...queryOptions,
  });
}


export function usePagedNodesComplete(supabase: SupabaseClient<Database>, options: UsePagedNodesCompleteOptions) {
  const { limit = 10, offset = 0, orderBy = "name", orderDir = "asc", filters = {}, queryOptions } = options;

  return useQuery<PagedNodesCompleteResult, Error>({
    // Query key includes all parameters to ensure uniqueness
    queryKey: ["v_nodes_complete", { limit, offset, orderBy, orderDir, filters }],

    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_paged_nodes_complete", {
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_filters: filters,
      });

      if (error) {
        console.error("Error fetching paged nodes:", error);
        throw new Error(error.message);
      }

      return data ?? null;
    },
    // Spread any additional react-query options
    ...queryOptions,
  });
}

// Lookup type hooks
export function useGetLookupTypeId(supabase: SupabaseClient<Database>, category: string, name: string, options?: UseRpcQueryOptions<"get_lookup_type_id">) {
  return useRpcQuery(supabase, "get_lookup_type_id", { p_category: category, p_name: name }, options);
}

export function useGetLookupTypesByCategory(supabase: SupabaseClient<Database>, category: string, options?: UseRpcQueryOptions<"get_lookup_types_by_category">) {
  return useRpcQuery(supabase, "get_lookup_types_by_category", { p_category: category }, options);
}

export function useAddLookupType(supabase: SupabaseClient<Database>, options?: UseTableMutationOptions<string, RpcFunctionArgs<"add_lookup_type">>) {
  return useRpcMutation(supabase, "add_lookup_type", options);
}

// User-related hooks
export function useGetMyUserDetails(supabase: SupabaseClient<Database>, options?: UseRpcQueryOptions<"get_my_user_details">) {
  return useRpcQuery(supabase, "get_my_user_details", {}, options);
}

export function useGetMyRole(supabase: SupabaseClient<Database>, options?: UseRpcQueryOptions<"get_my_role">) {
  return useRpcQuery(supabase, "get_my_role", {}, options);
}

export function useIsSuperAdmin(supabase: SupabaseClient<Database>, options?: UseRpcQueryOptions<"is_super_admin">) {
  return useRpcQuery(supabase, "is_super_admin", {}, options);
}

// Admin function hooks
export function useAdminGetAllUsers(supabase: SupabaseClient<Database>, args?: RpcFunctionArgs<"admin_get_all_users">, options?: UseRpcQueryOptions<"admin_get_all_users">) {
  return useRpcQuery(supabase, "admin_get_all_users", args, options);
}

export function useAdminGetAllUsersExtended(supabase: SupabaseClient<Database>, args?: RpcFunctionArgs<"admin_get_all_users_extended">, options?: UseRpcQueryOptions<"admin_get_all_users_extended">) {
  return useRpcQuery(supabase, "admin_get_all_users_extended", args, options);
}

export function useAdminUpdateUserProfile(supabase: SupabaseClient<Database>, options?: UseTableMutationOptions<boolean, RpcFunctionArgs<"admin_update_user_profile">>) {
  return useRpcMutation(supabase, "admin_update_user_profile", options);
}

export function useAdminBulkUpdateRole(supabase: SupabaseClient<Database>, options?: UseTableMutationOptions<boolean, RpcFunctionArgs<"admin_bulk_update_role">>) {
  return useRpcMutation(supabase, "admin_bulk_update_role", options);
}

export function useAdminBulkUpdateStatus(supabase: SupabaseClient<Database>, options?: UseTableMutationOptions<boolean, RpcFunctionArgs<"admin_bulk_update_status">>) {
  return useRpcMutation(supabase, "admin_bulk_update_status", options);
}

export function useAdminBulkDeleteUsers(supabase: SupabaseClient<Database>, options?: UseTableMutationOptions<boolean, RpcFunctionArgs<"admin_bulk_delete_users">>) {
  return useRpcMutation(supabase, "admin_bulk_delete_users", options);
}
