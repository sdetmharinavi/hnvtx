// hooks/database/queries-type-helpers.ts
import {
  UseQueryOptions,
} from '@tanstack/react-query';
import { Database } from '@/types/supabase-types';
import { tableNames } from '@/types/flattened-types';

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