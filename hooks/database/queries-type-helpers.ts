// hooks/database/queries-type-helpers.ts

import { UseQueryOptions, UseMutationOptions, UseInfiniteQueryOptions, InfiniteData } from "@tanstack/react-query";
import { Database, Tables, TablesInsert, TablesUpdate, Json } from "@/types/supabase-types";

// --- TYPE HELPERS ---

// A table is a source that can be read from and written to.
export type TableName = keyof Database["public"]["Tables"];

// Auth tables are tables that can only be read from.
export type AuthTable = keyof Database["auth"]["Tables"];

// A view is a source that can only be read from.
export type ViewName = keyof Database["public"]["Views"];

// A generic type for any readable source (table or view).
export type TableOrViewName = TableName | ViewName;

// A generic type for any readable source (table or view).
export type AuthTableOrViewName = AuthTable | ViewName | TableName;

// Helper function to check if the table name is a table (not a view)
export const isTableName = (name: AuthTableOrViewName): name is TableName => {
  // List of view names - add your view names here
  const viewNames = [
    'v_nodes_complete',
    'v_ofc_cables_complete',
    'v_ofc_connections_complete',
    'v_system_connections_complete',
    'v_systems_complete',
    // 'vmux_connections',
    // 'vmux_systems',
    // Add other view names here
  ];
  const authViewNames = [
    'users',
  ];
  return !viewNames.includes(name as string) && !authViewNames.includes(name as string);
};

// Table-specific types for mutation operations (insert, update, delete).
export type TableRow<T extends TableName> = Tables<T>;
export type TableInsert<T extends TableName> = TablesInsert<T>;
export type TableUpdate<T extends TableName> = TablesUpdate<T>;

// A generic row type for any read operation (works with both tables and views).
export type Row<T extends AuthTableOrViewName> = T extends TableName ? Tables<T> : T extends ViewName ? Database["public"]["Views"][T]["Row"] : T extends AuthTable ? Database["auth"]["Tables"][T]["Row"] : never;

// RPC function type helpers.
export type RpcFunctionName = keyof Database["public"]["Functions"];
export type RpcFunctionArgs<T extends RpcFunctionName> = Database["public"]["Functions"][T]["Args"];
export type RpcFunctionReturns<T extends RpcFunctionName> = Database["public"]["Functions"][T]["Returns"];

// --- ADVANCED TYPES FOR HOOK OPTIONS ---

export type FilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in" | "contains" | "containedBy" | "overlaps" | "sl" | "sr" | "nxl" | "nxr" | "adj" | "is" | "isdistinct" | "fts" | "plfts" | "phfts" | "wfts" | "or";

export type FilterValue = string | number | boolean | null | string[] | number[] | { operator: FilterOperator; value: unknown };

export type Filters = Record<string, FilterValue>;

export type OrderBy = {
  column: string;
  ascending?: boolean;
  nullsFirst?: boolean;
  foreignTable?: string;
};

export type DeduplicationOptions = {
  columns: string[];
  orderBy?: OrderBy[];
};

export type AggregationOptions = {
  count?: boolean | string;
  sum?: string[];
  avg?: string[];
  min?: string[];
  max?: string[];
  groupBy?: string[];
};

export type PerformanceOptions = {
  useIndex?: string;
  explain?: boolean;
  timeout?: number;
  connection?: "read" | "write";
};

// The shape of data returned by queries, potentially with a total count.
export type RowWithCount<T> = T & { total_count?: number };

// --- HOOK OPTIONS INTERFACES ---

// Options for querying multiple records from tables OR views.
export interface UseTableQueryOptions<T extends TableOrViewName, TData = RowWithCount<Row<T>>[]> extends Omit<UseQueryOptions<RowWithCount<Row<T>>[], Error, TData>, "queryKey" | "queryFn"> {
  columns?: string;
  filters?: Filters;
  orderBy?: OrderBy[];
  limit?: number;
  offset?: number;
  deduplication?: DeduplicationOptions;
  aggregation?: AggregationOptions;
  performance?: PerformanceOptions;
  includeCount?: boolean;
}

// Options for infinite scrolling over tables OR views.
export type InfiniteQueryPage<T extends TableOrViewName> = {
  data: Row<T>[];
  nextCursor?: number;
  count?: number;
};

export interface UseTableInfiniteQueryOptions<T extends TableOrViewName, TData = InfiniteData<InfiniteQueryPage<T>>>
  extends Omit<UseInfiniteQueryOptions<InfiniteQueryPage<T>, Error, TData, readonly unknown[], number | undefined>, "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"> {
  columns?: string;
  filters?: Filters;
  orderBy?: OrderBy[];
  pageSize?: number;
  performance?: PerformanceOptions;
}

// Options for querying a single record from a table OR view.
export interface UseTableRecordOptions<T extends TableOrViewName, TData = Row<T> | null> extends Omit<UseQueryOptions<Row<T> | null, Error, TData>, "queryKey" | "queryFn"> {
  columns?: string;
  performance?: PerformanceOptions;
}

// Options for getting unique values from a table OR view.
export interface UseUniqueValuesOptions<T extends TableOrViewName, TData = unknown[]> extends Omit<UseQueryOptions<unknown[], Error, TData>, "queryKey" | "queryFn"> {
  filters?: Filters;
  orderBy?: OrderBy[];
  limit?: number;
  performance?: PerformanceOptions;
}

export interface UseRpcQueryOptions<T extends RpcFunctionName, TData = RpcFunctionReturns<T>> extends Omit<UseQueryOptions<RpcFunctionReturns<T>, Error, TData>, "queryKey" | "queryFn"> {
  performance?: PerformanceOptions;
}

// Options for mutations, which apply ONLY to tables.
export interface UseTableMutationOptions<TData = unknown, TVariables = unknown, TContext = unknown> extends Omit<UseMutationOptions<TData, Error, TVariables, TContext>, "mutationFn"> {
  invalidateQueries?: boolean;
  optimisticUpdate?: boolean;
  batchSize?: number;
}

export interface OptimisticContext {
  previousData?: [readonly unknown[], unknown][];
}

export type PagedSystemsCompleteResult = Array<Database["public"]["Functions"]["get_paged_v_systems_complete"]["Returns"][number]> | null;

export type UsePagedSystemsCompleteOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  filters?: Json;
  queryOptions?: Omit<UseQueryOptions<PagedSystemsCompleteResult>, "queryKey" | "queryFn">;
};

// --- TYPES FOR EXCEL UPLOAD HOOK ---

/**
 * Defines how to map a column from the Excel file to a database column.
 * @template T - The name of the table to upload to.
 */
export interface UploadColumnMapping<T extends TableName> {
  /** The exact header name in the Excel file (e.g., "Product Name"). */
  excelHeader: string;
  /** The corresponding key in the database table (e.g., "product_name"). */
  dbKey: keyof TableInsert<T> & string;
  /** An optional function to transform the cell's value before uploading. */
  transform?: (value: unknown) => unknown;
  /** If true, the value must be non-empty after transform; otherwise the row is rejected. */
  required?: boolean;
}

/**
 * Specifies the type of upload operation to perform.
 * - 'insert': Adds all rows as new records. Fails if a record violates a unique constraint.
 * - 'upsert': Inserts new records or updates existing ones based on a conflict column.
 */
export type UploadType = "insert" | "upsert";

/**
 * Options required to initiate an Excel file upload.
 * @template T - The name of the table to upload to.
 */
export interface UploadOptions<T extends TableName> {
  /** The file object from a file input element. */
  file: File;
  /** An array defining how to map Excel columns to database columns. */
  columns: UploadColumnMapping<T>[];
  /** The type of database operation to perform. Defaults to 'upsert'. */
  uploadType?: UploadType;
  /**
   * The database column to use for conflict resolution in an 'upsert' operation.
   * This is REQUIRED for 'upsert'.
   * e.g., 'id' or 'sku' if you want to update rows with matching IDs or SKUs.
   */
  conflictColumn?: keyof TableInsert<T> & string;
}

/**
 * The result of a successful upload operation.
 */
export interface UploadResult {
  successCount: number;
  errorCount: number;
  totalRows: number;
  errors: { rowIndex: number; data: unknown; error: string }[];
}

/**
 * Configuration options for the useExcelUpload hook itself.
 * @template T - The name of the table to upload to.
 */
export interface UseExcelUploadOptions<T extends TableName> {
  onSuccess?: (data: UploadResult, variables: UploadOptions<T>) => void;
  onError?: (error: Error, variables: UploadOptions<T>) => void;
  showToasts?: boolean;
  batchSize?: number;
}

// FIX: Add the return type for the new RPC function
export type PagedOfcCablesCompleteResult = 
  Array<Database["public"]["Functions"]["get_paged_ofc_cables_complete"]["Returns"][number]> | null;

// FIX: Add the options type for the new hook we will create
export type UsePagedOfcCablesCompleteOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  filters?: Json;
  queryOptions?: Omit<UseQueryOptions<PagedOfcCablesCompleteResult, Error>, "queryKey" | "queryFn">;
};

export type PagedNodesCompleteResult = Array<Database["public"]["Functions"]["get_paged_nodes_complete"]["Returns"][number]> | null;

export type UsePagedNodesCompleteOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  filters?: Json;
  queryOptions?: Omit<UseQueryOptions<PagedNodesCompleteResult, Error>, "queryKey" | "queryFn">;
};

export type PagedOfcConnectionsCompleteResult = 
  Array<Database["public"]["Functions"]["get_paged_ofc_connections_complete"]["Returns"][number]> | null;

// FIX: Add the options type for the new hook we will create
export type UsePagedOfcConnectionsCompleteOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  filters?: Json;
  queryOptions?: Omit<UseQueryOptions<PagedOfcConnectionsCompleteResult, Error>, "queryKey" | "queryFn">;
};

export type PagedSystemConnectionsCompleteResult = Array<Database["public"]["Functions"]["get_paged_system_connections_complete"]["Returns"][number]> | null;

export type UsePagedSystemConnectionsCompleteOptions = {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: "asc" | "desc";
  filters?: Json;
  queryOptions?: Omit<UseQueryOptions<PagedSystemConnectionsCompleteResult>, "queryKey" | "queryFn">;
};
