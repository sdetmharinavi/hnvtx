/* eslint-disable @typescript-eslint/no-explicit-any */
import { useQuery, useInfiniteQuery, InfiniteData } from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Json } from '@/types/supabase-types';
import {
  TableOrViewName,
  TableName,
  Row,
  RowWithCount,
  DeduplicationOptions, // Still imported for backward compat in other files if needed, but unused here
  InfiniteQueryPage,
  UseTableQueryOptions,
  UseTableInfiniteQueryOptions,
  UseTableRecordOptions,
  PagedQueryResult,
  UseUniqueValuesOptions,
} from './queries-type-helpers';
import {
  applyFilters,
  applyOrdering,
  createQueryKey,
} from './utility-functions';
import { localDb } from '@/hooks/data/localDb';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

// Generic table query hook with enhanced features
export function useTableQuery<T extends TableOrViewName, TData = PagedQueryResult<Row<T>>>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  options?: Omit<UseTableQueryOptions<T, TData>, 'select'> & {
    select?: (data: PagedQueryResult<Row<T>>) => TData;
  }
) {
  const {
    columns = '*',
    filters,
    orderBy,
    limit,
    offset,
    performance,
    includeCount = false,
    ...queryOptions
  } = options || {};

  return useQuery({
    queryKey: createQueryKey(
      tableName,
      filters,
      columns,
      orderBy,
      undefined,
      limit,
      offset
    ),
    queryFn: async (): Promise<PagedQueryResult<Row<T>>> => {
      // Main query logic
      let query = supabase
        .from(tableName as any)
        .select(columns as string, { count: includeCount ? 'exact' : undefined });

      if (filters) query = applyFilters(query, filters);
      if (orderBy?.length) query = applyOrdering(query, orderBy);
      if (limit !== undefined) query = query.limit(limit);
      if (offset !== undefined) query = query.range(offset, offset + (limit || 1000) - 1);
      if (performance?.timeout) query = query.abortSignal(AbortSignal.timeout(performance.timeout));

      const { data, error, count } = await query;
      if (error) throw error;

      return {
        data: (data as unknown as Row<T>[]) || [],
        count: includeCount ? count ?? 0 : data?.length ?? 0,
      };
    },
    ...queryOptions,
  });
}

// Infinite scroll query hook for large datasets
export function useTableInfiniteQuery<
  T extends TableOrViewName,
  TData = InfiniteData<InfiniteQueryPage<T>>
>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  options?: UseTableInfiniteQueryOptions<T, TData>
) {
  const {
    columns = '*',
    filters,
    orderBy,
    pageSize = 20,
    performance,
    ...queryOptions
  } = options || {};

  return useInfiniteQuery({
    queryKey: createQueryKey(
      tableName,
      filters,
      columns,
      orderBy,
      undefined,
      pageSize
    ),
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase.from(tableName as any).select(columns, { count: 'exact' });

      if (filters) query = applyFilters(query, filters);
      if (orderBy?.length) query = applyOrdering(query, orderBy);

      const startIdx = pageParam * pageSize;
      query = query.range(startIdx, startIdx + pageSize - 1);

      if (performance?.timeout) query = query.abortSignal(AbortSignal.timeout(performance.timeout));

      const { data, error, count } = await query;
      if (error) throw error;

      const results = (data as unknown as Row<T>[]) || [];

      return {
        data: results,
        nextCursor: results.length === pageSize ? pageParam + 1 : undefined,
        count: count ?? 0,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: 0,
    ...queryOptions,
  });
}

/**
 * Generic single record query hook using RPC (Bypasses Table RLS for View logic)
 * Use this for Views where the user might not have direct table access.
 */
export function useRpcRecord<T extends TableOrViewName, TData = Row<T> | null>(
  supabase: SupabaseClient<Database>,
  viewName: T,
  id: string | null,
  options?: Omit<UseTableRecordOptions<T, TData>, 'columns'> // RPC returns all columns
) {
  const { ...queryOptions } = options || {};
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: ['rpc-record', viewName, id],
    queryFn: async (): Promise<Row<T> | null> => {
      if (!id) return null;

      // 1. Try Local First
      try {
        const table = localDb.table(viewName);
        if (table) {
          const localData = await table.get(id);
          if (localData) return localData as Row<T>;
        }
      } catch (e) {
        console.warn(`[useRpcRecord] Local fetch failed for ${viewName}:`, e);
      }

      // 2. If no local or online needed, try Network
      if (isOnline) {
        const { data, error } = await supabase.rpc('get_paged_data', {
          p_view_name: viewName,
          p_limit: 1,
          p_offset: 0,
          p_filters: { id: id },
          p_order_by: 'id', // Default sort
        });

        if (error) throw error;

        // get_paged_data returns { data: [...], ... }
        const rows = (data as any)?.data as Row<T>[];
        return rows?.[0] || null;
      }

      return null;
    },
    enabled: !!id && (queryOptions?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
    ...queryOptions,
  });
}

// Generic single record query hook (optimized & offline-capable)
export function useTableRecord<T extends TableOrViewName, TData = Row<T> | null>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  id: string | null,
  options?: UseTableRecordOptions<T, TData>
) {
  const { columns = '*', performance, ...queryOptions } = options || {};
  const isOnline = useOnlineStatus();

  return useQuery({
    queryKey: createQueryKey(tableName, { id: id as any }, columns),
    queryFn: async (): Promise<Row<T> | null> => {
      if (!id) return null;

      // 1. Try Local First
      try {
        // Dynamically access the table in Dexie
        const table = localDb.table(tableName);
        if (table) {
          const localData = await table.get(id);
          if (localData) {
            return localData as Row<T>;
          }
        }
      } catch (e) {
        console.warn(`[useTableRecord] Local lookup failed for ${tableName}:`, e);
      }

      // 2. Fallback to Online Fetch
      if (isOnline) {
        let query = supabase
          .from(tableName as any)
          .select(columns)
          .eq('id', id);

        if (performance?.timeout)
          query = query.abortSignal(AbortSignal.timeout(performance.timeout));

        const { data, error } = await query.maybeSingle();

        if (error) {
          if (error.code === 'PGRST116') return null; // Not found
          throw error;
        }
        return (data as unknown as Row<T>) || null;
      }

      // 3. Offline and not found locally
      return null;
    },
    enabled: !!id && (queryOptions?.enabled ?? true),
    staleTime: Infinity,
    ...queryOptions,
  });
}

// Get unique values for a specific column
export function useUniqueValues<T extends TableOrViewName, TData = unknown[]>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  column: string,
  options?: UseUniqueValuesOptions<T, TData>
) {
  const { filters, orderBy, limit, ...queryOptions } = options || {};

  return useQuery({
    queryKey: ['unique', tableName, column, { filters, orderBy }],
    queryFn: async (): Promise<unknown[]> => {
      // Basic implementation for server-side unique values
      const { data, error } = await supabase.rpc('get_unique_values', {
        p_table_name: tableName,
        p_column_name: column,
        p_filters: (filters || {}) as unknown as Json,
        p_order_by: (orderBy || []) as unknown as Json,
        p_limit_count: limit,
      });

      if (error) {
        // Fallback to simple select if RPC fails
        const { data: fbData } = await supabase.from(tableName as any).select(column);
        return Array.from(new Set(fbData?.map((item) => (item as any)[column])));
      }
      return (data as any)?.map((item: any) => item.value) || [];
    },
    staleTime: 10 * 60 * 1000,
    ...queryOptions,
  });
}

// Deduplicated rows hook
export function useDeduplicated<T extends TableName>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  deduplicationOptions: DeduplicationOptions,
  options?: Omit<UseTableQueryOptions<T>, 'deduplication'>
) {
  return useTableQuery(supabase, tableName, {
    ...options,
    // deduplication is removed from implementation, this hook acts as standard table query now.
    // If deduplication is needed, it should be handled by a specific RPC or view.
  });
}

// Relationship query hook with optimizations
export function useTableWithRelations<T extends TableName, TData = RowWithCount<Row<T>>[]>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  relations: string[],
  options?: UseTableQueryOptions<T, TData>
) {
  const columnsString = relations.length > 0 ? `*, ${relations.join(', ')}` : '*';

  return useTableQuery<T, TData>(supabase, tableName, {
    ...options,
    columns: columnsString,
  });
}