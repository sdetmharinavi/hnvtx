// path: hooks/database/rpc-hook-factory.ts
import { useQuery, UseQueryOptions, UseQueryResult } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database, Json } from "@/types/supabase-types";
import { RpcFunctionName, RpcFunctionArgs, RpcFunctionReturns } from "./queries-type-helpers";
import { DEFAULTS } from "@/constants/constants";

// Define a specific interface for the arguments our paged RPC functions accept.
// This solves the "is not assignable to type 'never'" error.
interface PagedRpcArgs {
  p_limit: number;
  p_offset: number;
  p_order_by: string;
  p_order_dir: 'asc' | 'desc';
  p_filters: Json;
}

// Type for the options our hook will accept. It's clean and simple.
type PagedRpcHookOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  filters?: Json;
};

// Generic type for the actual query options passed to TanStack Query.
// This allows users to pass standard options like `staleTime`, `enabled`, etc.
type PagedRpcQueryOptions<TResult> = Omit<
  UseQueryOptions<TResult, Error>,
  'queryKey' | 'queryFn'
>;

/**
 * A factory function that creates a reusable and type-safe TanStack Query hook
 * for any of your paginated RPC functions.
 * @param functionName The name of the PostgreSQL RPC function.
 * @param queryKeyPrefix A unique prefix for the query key.
 * @param defaultOrderBy The default column to sort by.
 */
export function createPagedRpcHook<
  TName extends RpcFunctionName,
  TResult = RpcFunctionReturns<TName> // The result type is now correctly INFERRED from the function name
>(
  functionName: TName, // TName is now constrained to be a valid RpcFunctionName
  queryKeyPrefix: string,
  defaultOrderBy: string
) {
  // This is the returned custom hook
  return function usePagedRpc(
    supabase: SupabaseClient<Database>,
    hookOptions: PagedRpcHookOptions = {},
    queryOptions: PagedRpcQueryOptions<TResult> = {}
  ): UseQueryResult<TResult, Error> {
    const {
      limit = DEFAULTS.PAGE_SIZE,
      offset = 0,
      orderBy = defaultOrderBy,
      orderDir = "asc",
      filters = {},
    } = hookOptions;

    const queryKey = [queryKeyPrefix, { limit, offset, orderBy, orderDir, filters }];

    const queryFn = async (): Promise<TResult> => {
      const rpcArgs: PagedRpcArgs = {
        p_limit: limit,
        p_offset: offset,
        p_order_by: orderBy,
        p_order_dir: orderDir,
        p_filters: filters,
      };

      const { data, error } = await supabase.rpc(
        functionName,
        rpcArgs as RpcFunctionArgs<TName>
      );

      if (error) {
        console.error(`Error fetching from RPC '${String(functionName)}':`, error);
        throw new Error(error.message);
      }
      
      return (data ?? []) as TResult;
    };

    return useQuery<TResult, Error>({
      queryKey,
      queryFn,
      ...queryOptions,
    });
  };
}