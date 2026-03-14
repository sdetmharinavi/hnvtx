// hooks/database/queries-type-helpers.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  InfiniteData,
  UseQueryOptions,
} from '@tanstack/react-query';
import { Database } from '@/types/supabase-types';
import { tableNames } from '@/types/flattened-types';

// MODIFIED: Added RpcFunctionName, RpcFunctionArgs, and RpcFunctionReturns types.
export type RpcFunctionName = keyof Database['public']['Functions'];

export type RpcFunctionArgs<T extends RpcFunctionName> =
  Database['public']['Functions'][T]['Args'];

export type RpcFunctionReturns<T extends RpcFunctionName> =
  Database['public']['Functions'][T]['Returns'];

export type PagedQueryResult<T> = {
  data: T[];
  count: number;
};

export type PublicTableName = keyof Database['public']['Tables'];
export type AuthTableName = keyof Database['auth']['Tables'];
export type TableName = PublicTableName | AuthTableName;
export type ViewName = keyof Database['public']['Views'];
export type PublicTableOrViewName = PublicTableName | ViewName;
export type TableOrViewName = TableName | ViewName;

export const isTableName = (name: TableOrViewName): name is TableName => {
  return (tableNames as readonly string[]).includes(name);
};

export type Row<T extends TableOrViewName> = T extends keyof Database['public']['Tables']
  ? Database['public']['Tables'][T]['Row']
  : T extends keyof Database['public']['Views']
  ? Database['public']['Views'][T]['Row']
  : T extends keyof Database['auth']['Tables']
  ? Database['auth']['Tables'][T]['Row']
  : never;

export type FilterOperator =
  | 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike'
  | 'in' | 'is' | 'fts' | 'or';

// Expanded to allow Record for 'or' filters without conflicting with the index signature
export type FilterValue = string | number | boolean | null | string[] | number[] | Record<string, string>;

export type Filters = {
  [key: string]: FilterValue | { operator: FilterOperator; value: FilterValue } | undefined;
  or?: string | Record<string, string>;
};

export type OrderBy = {
  column: string;
  ascending?: boolean;
  nullsFirst?: boolean;
  foreignTable?: string;
};

export interface UseTableQueryOptions<T extends TableOrViewName, TData = PagedQueryResult<Row<T>>>
  extends Omit<UseQueryOptions<PagedQueryResult<Row<T>>, Error, TData>, 'queryKey' | 'queryFn'> {
  columns?: string;
  filters?: Filters;
  orderBy?: OrderBy[];
  limit?: number;
  offset?: number;
  includeCount?: boolean;
}

export interface UseTableRecordOptions<T extends TableOrViewName, TData = Row<T> | null>
  extends Omit<UseQueryOptions<Row<T> | null, Error, TData>, 'queryKey' | 'queryFn'> {
  columns?: string;
  performance?: {
    timeout?: number;
  };
}

export interface UseUniqueValuesOptions<T extends TableOrViewName, TData = unknown[]>
  extends Omit<UseQueryOptions<TData, Error, TData>, 'queryKey' | 'queryFn'> {
  filters?: Filters;
  orderBy?: OrderBy[];
  limit?: number;
}

export interface ProcessingLog {
  rowIndex: number;
  excelRowNumber: number;
  originalData: Record<string, unknown>;
  processedData: Record<string, unknown>;
  validationErrors: ValidationError[];
  isSkipped: boolean;
  skipReason?: string;
}

export interface ValidationError {
  rowIndex: number;
  column: string;
  value: unknown;
  error: string;
  data?: Record<string, unknown>;
}

// NO OTHER CHANGES BELOW THIS LINE IN THIS FILE
// The rest of the file remains as it was.
// The only change is the addition of the three RPC-related types at the top.

// NOTE: The following types are not directly related to the fix but are included for file completeness.
export type EnhancedOrderBy = {
    column: string;
    direction: 'asc' | 'desc';
    nulls?: 'first' | 'last';
};

export type RowWithCount<T> = T & { _count: number };

export type DeduplicationOptions = {
    column: string;
    strategy?: 'first' | 'last' | ((items: any[]) => any);
};

export type InfiniteQueryPage<T extends TableOrViewName> = {
    data: Row<T>[];
    nextCursor?: number;
    count: number;
};

export interface UseTableInfiniteQueryOptions<
    T extends TableOrViewName,
    TData = InfiniteData<InfiniteQueryPage<T>>
> extends Omit<
        UseQueryOptions<InfiniteData<InfiniteQueryPage<T>>, Error, TData>,
        'queryKey' | 'queryFn' | 'getNextPageParam' | 'initialPageParam'
    > {
    columns?: string;
    filters?: Filters;
    orderBy?: OrderBy[];
    pageSize?: number;
    performance?: { timeout?: number };
}

export type UseRpcQueryOptions<
    T extends RpcFunctionName,
    TData = RpcFunctionReturns<T>
> = Omit<
    UseQueryOptions<RpcFunctionReturns<T>, Error, TData>,
    'queryKey' | 'queryFn'
> & {
    performance?: { timeout?: number };
};

export type UseTableMutationOptions<
    TData,
    TVariables
> = Omit<
    import('@tanstack/react-query').UseMutationOptions<TData, Error, TVariables>,
    'mutationFn'
> & {
    invalidateQueries?: boolean | string[];
};

export interface UploadColumnMapping<T extends TableOrViewName> {
    excelHeader: string;
    dbKey: keyof Row<T> & string;
    transform?: (value: any) => any;
    required?: boolean;
}