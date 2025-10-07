/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  useQuery,
  useInfiniteQuery,
  InfiniteData,
} from '@tanstack/react-query';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database, Json } from '@/types/supabase-types';
import {
  TableOrViewName,
  TableName,
  Row,
  RowWithCount,
  DeduplicationOptions,
  InfiniteQueryPage,
  UseTableQueryOptions,
  UseTableInfiniteQueryOptions,
  UseTableRecordOptions,
  UseUniqueValuesOptions,
  PagedQueryResult,
} from './queries-type-helpers';
import {
  applyFilters,
  applyOrdering,
  buildDeduplicationQuery,
  createQueryKey,
  createUniqueValuesKey,
} from './utility-functions';

// Generic table query hook with enhanced features
export function useTableQuery<
  T extends TableOrViewName,
  // UPDATED: The default data type is now the new PagedQueryResult
  TData = PagedQueryResult<Row<T>>
>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  // UPDATED: The options type now reflects the new return shape
  options?: Omit<UseTableQueryOptions<T, TData>, 'select'> & { select?: (data: PagedQueryResult<Row<T>>) => TData }
) {
  const {
    columns = '*',
    filters,
    orderBy,
    limit,
    offset,
    deduplication,
    aggregation,
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
      deduplication,
      aggregation,
      undefined,
      limit,
      offset
    ),
    // UPDATED: The query function now returns the PagedQueryResult shape
    queryFn: async (): Promise<PagedQueryResult<Row<T>>> => {
      // Deduplication and aggregation logic remains the same but would need adjustment if they also need counts.
      // For now, we assume they return a simple array.
      if (deduplication) {
        const sql = buildDeduplicationQuery(tableName as string, deduplication, filters, orderBy);
        const { data: rpcData, error: rpcError } = await supabase.rpc('execute_sql', { sql_query: sql });
        if (rpcError) throw rpcError;
        if (rpcData && (rpcData as any).error) throw new Error(`Database RPC Error: ${(rpcData as any).error}`);
        return { data: (rpcData as any)?.result || [], count: ((rpcData as any)?.result || []).length };
      }

      if (aggregation) {
        const { data, error } = await supabase.rpc('aggregate_query', {
          table_name: tableName,
          aggregation_options: aggregation as unknown as Json,
          filters: (filters || {}) as unknown as Json,
          order_by: (orderBy || []) as unknown as Json,
        });
        if (error) throw error;
        const resultData = (data as any)?.result || [];
        return { data: resultData, count: resultData.length };
      }

      // Main query logic
      let query = supabase.from(tableName as any).select(columns as string, { count: includeCount ? 'exact' : undefined });

      if (filters) query = applyFilters(query, filters);
      if (orderBy?.length) query = applyOrdering(query, orderBy);
      if (limit !== undefined) query = query.limit(limit);
      if (offset !== undefined) query = query.range(offset, offset + (limit || 1000) - 1);
      if (performance?.timeout) query = query.abortSignal(AbortSignal.timeout(performance.timeout));

      const { data, error, count } = await query;
      if (error) throw error;

      // UPDATED: Return the new structured object instead of attaching count to each row.
      return {
        data: (data as unknown as Row<T>[]) || [],
        count: includeCount ? (count ?? 0) : (data?.length ?? 0),
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
      undefined,
      undefined,
      pageSize
    ),
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from(tableName as any)
        .select(columns, { count: 'exact' });

      if (filters) query = applyFilters(query, filters);
      if (orderBy?.length) query = applyOrdering(query, orderBy);

      const startIdx = pageParam * pageSize;
      query = query.range(startIdx, startIdx + pageSize - 1);

      if (performance?.timeout)
        query = query.abortSignal(AbortSignal.timeout(performance.timeout));

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

// Generic single record query hook (optimized)
export function useTableRecord<
  T extends TableOrViewName,
  TData = Row<T> | null
>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  id: string | null,
  options?: UseTableRecordOptions<T, TData>
) {
  const { columns = '*', performance, ...queryOptions } = options || {};

  return useQuery({
    queryKey: createQueryKey(tableName, { id: id as any }, columns),
    queryFn: async (): Promise<Row<T> | null> => {
      if (!id) return null;

      let query = supabase
        .from(tableName as any)
        .select(columns)
        .eq('id', id);

      if (performance?.timeout)
        query = query.abortSignal(AbortSignal.timeout(performance.timeout));

      const { data, error } = await query.maybeSingle();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found, which is a valid null result
        throw error;
      }
      return (data as unknown as Row<T>) || null;
    },
    enabled: !!id && (queryOptions?.enabled ?? true),
    staleTime: 5 * 60 * 1000,
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
    queryKey: createUniqueValuesKey(tableName, column, filters, orderBy),
    queryFn: async (): Promise<unknown[]> => {
      const { data, error } = await supabase.rpc('get_unique_values', {
        p_table_name: tableName,
        p_column_name: column,
        p_filters: (filters || {}) as unknown as Json,
        p_order_by: (orderBy || []) as unknown as Json,
        p_limit_count: limit,
      });
      if (error) {
        console.error(
          'RPC unique values failed, falling back to direct query',
          error
        );
        // Fallback implementation
        let fallbackQuery = supabase.from(tableName as any).select(column);
        if (filters) fallbackQuery = applyFilters(fallbackQuery, filters);
        if (orderBy?.length)
          fallbackQuery = applyOrdering(fallbackQuery, orderBy);
        if (limit) fallbackQuery = fallbackQuery.limit(limit);

        const { data: fallbackData, error: fallbackError } =
          await fallbackQuery;
        if (fallbackError) throw fallbackError;
        return [
          ...new Set(
            (fallbackData as any[])?.map((item) => item[column]) || []
          ),
        ];
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
    deduplication: deduplicationOptions,
  });
}

// Relationship query hook with optimizations
export function useTableWithRelations<
  T extends TableName,
  TData = RowWithCount<Row<T>>[]
>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  relations: string[],
  options?: UseTableQueryOptions<T, TData>
) {
  const columnsString =
    relations.length > 0 ? `*, ${relations.join(', ')}` : '*';

  return useTableQuery<T, TData>(supabase, tableName, {
    ...options,
    columns: columnsString,
  });
}
