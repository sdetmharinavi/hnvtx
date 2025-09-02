// hooks/database/rpc-hook-factory.ts
import {
    useQuery,
    UseQueryResult,
    UseQueryOptions, // Import the base options type
  } from "@tanstack/react-query";
  import { SupabaseClient } from "@supabase/supabase-js";
  import { Database, Json } from "@/types/supabase-types";
  import { RpcFunctionName } from "./queries-type-helpers";
import { DEFAULTS } from "@/config/constants";
  
  // --- START OF FIX ---
  
  // This type is now more accurate. The data returned by the hook can be `TResult` or `null`.
  type PagedRpcQueryResult<TResult> = TResult | null;
  
  // Use Omit to create the options type. We're omitting the keys that our factory provides.
  // This tells TypeScript that the user can pass any *other* valid `useQuery` option.
  type PagedRpcQueryOptions<TResult> = Omit<
    UseQueryOptions<PagedRpcQueryResult<TResult>, Error, PagedRpcQueryResult<TResult>, readonly unknown[]>,
    'queryKey' | 'queryFn'
  >;
  
  // The options for the hook itself
  type PagedRpcHookOptions<TResult> = {
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDir?: "asc" | "desc";
    filters?: Json;
    queryOptions?: PagedRpcQueryOptions<TResult>; // Use the precise, new type
  };
  
  // --- END OF FIX ---
  
  
  export function createPagedRpcHook<TResult>(
    functionName: RpcFunctionName,
    viewName: string,
    defaultOrderBy: string
  ) {
    return function usePagedData(
      supabase: SupabaseClient<Database>,
      options: PagedRpcHookOptions<TResult>
    ): UseQueryResult<PagedRpcQueryResult<TResult>, Error> { // The hook's return type also includes `null`
      const {
        limit = DEFAULTS.PAGE_SIZE,
        offset = 0,
        orderBy = defaultOrderBy,
        orderDir = "asc",
        filters = {},
        queryOptions,
      } = options;
  
      return useQuery<PagedRpcQueryResult<TResult>, Error, PagedRpcQueryResult<TResult>, readonly unknown[]>({
        queryKey: [viewName, { limit, offset, orderBy, orderDir, filters }],
        queryFn: async (): Promise<PagedRpcQueryResult<TResult>> => { // The queryFn's promise now correctly includes `null`
          const { data, error } = await supabase.rpc(functionName, {
            p_limit: limit,
            p_offset: offset,
            p_order_by: orderBy,
            p_order_dir: orderDir,
            p_filters: filters,
          });
  
          if (error) {
            console.error(`Error fetching from RPC function '${String(functionName)}':`, error);
            throw new Error(error.message);
          }
  
          return (data as TResult) ?? null;
        },
        ...queryOptions,
      });
    };
  }