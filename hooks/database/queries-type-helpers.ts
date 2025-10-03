// hooks/database/queries-type-helpers.ts
import { UseQueryOptions, UseMutationOptions, UseInfiniteQueryOptions, InfiniteData } from "@tanstack/react-query";
import { Database } from "@/types/supabase-types";
import { tableNames } from '@/types/flattened-types'; // Import auto-generated names

// --- TYPE HELPERS DERIVED FROM SUPABASE ---

export type PublicTableName = keyof Database["public"]["Tables"];
export type AuthTableName = keyof Database["auth"]["Tables"];
export type TableName = PublicTableName | AuthTableName;
export type PublicTableOrViewName = PublicTableName | ViewName;
export type ViewName = keyof Database["public"]["Views"];
export type TableOrViewName = TableName | ViewName;

// Helper to check if a name is a table (and not a view)
export const isTableName = (name: TableOrViewName): name is TableName => {
  return (tableNames as readonly string[]).includes(name);
};


// Generic row types for any read operation
export type Row<T extends TableOrViewName> = T extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][T]["Row"]
  : T extends keyof Database["public"]["Views"]
  ? Database["public"]["Views"][T]["Row"]
  : T extends keyof Database["auth"]["Tables"]
  ? Database["auth"]["Tables"][T]["Row"]
  : never;

export type TableRow<T extends TableName> = T extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][T]["Row"]
  : T extends keyof Database["auth"]["Tables"]
  ? Database["auth"]["Tables"][T]["Row"]
  : never;

export type TableInsert<T extends TableName> = T extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][T]["Insert"]
  : T extends keyof Database["auth"]["Tables"]
  ? Database["auth"]["Tables"][T]["Insert"]
  : never;

export type TableUpdate<T extends TableName> = T extends keyof Database["public"]["Tables"]
  ? Database["public"]["Tables"][T]["Update"]
  : T extends keyof Database["auth"]["Tables"]
  ? Database["auth"]["Tables"][T]["Update"]
  : never;

// These types now correctly infer from the robust types above.
export type TableInsertWithDates<T extends TableName> = { [K in keyof TableInsert<T>]?: TableInsert<T>[K] | Date | null; };
export type TableUpdateWithDates<T extends TableName> = { [K in keyof TableUpdate<T>]?: TableUpdate<T>[K] | Date | null; };

// RPC function type helpers (unchanged)
export type RpcFunctionName = keyof Database["public"]["Functions"];
export type RpcFunctionArgs<T extends RpcFunctionName> = Database["public"]["Functions"][T]["Args"];
export type RpcFunctionReturns<T extends RpcFunctionName> = Database["public"]["Functions"][T]["Returns"];

// --- ADVANCED TYPES FOR HOOK OPTIONS (Unchanged) ---

export type FilterOperator = "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "like" | "ilike" | "in" | "not.in" | "contains" | "containedBy" | "overlaps" | "sl" | "sr" | "nxl" | "nxr" | "adj" | "is" | "isdistinct" | "fts" | "plfts" | "phfts" | "wfts" | "or";
export type FilterValue = string | number | boolean | null | string[] | number[] | { operator: FilterOperator; value: unknown };
export type Filters = {
  or?: Record<string, string> | string;
  [key: string]: FilterValue | Record<string, string> | string | undefined;
};
export type OrderBy = { column: string; ascending?: boolean; nullsFirst?: boolean; foreignTable?: string; };
export interface EnhancedOrderBy { column: string; ascending?: boolean; nullsFirst?: boolean; foreignTable?: string; dataType?: 'text' | 'numeric' | 'date' | 'timestamp' | 'boolean' | 'json'; }
export type DeduplicationOptions = { columns: string[]; orderBy?: OrderBy[]; };
export type AggregationOptions = { count?: boolean | string; sum?: string[]; avg?: string[]; min?: string[]; max?: string[]; groupBy?: string[]; };
export type PerformanceOptions = { useIndex?: string; explain?: boolean; timeout?: number; connection?: "read" | "write"; };
export type RowWithCount<T> = T & { total_count?: number };

// --- HOOK OPTIONS INTERFACES (Unchanged) ---
export interface UseTableQueryOptions<T extends TableOrViewName, TData = RowWithCount<Row<T>>[]> extends Omit<UseQueryOptions<RowWithCount<Row<T>>[], Error, TData>, "queryKey" | "queryFn"> {
  columns?: string; filters?: Filters; orderBy?: OrderBy[]; limit?: number; offset?: number; deduplication?: DeduplicationOptions; aggregation?: AggregationOptions; performance?: PerformanceOptions; includeCount?: boolean;
}
export type InfiniteQueryPage<T extends TableOrViewName> = { data: Row<T>[]; nextCursor?: number; count?: number; };
export interface UseTableInfiniteQueryOptions<T extends TableOrViewName, TData = InfiniteData<InfiniteQueryPage<T>>> extends Omit<UseInfiniteQueryOptions<InfiniteQueryPage<T>, Error, TData, readonly unknown[], number | undefined>, "queryKey" | "queryFn" | "getNextPageParam" | "initialPageParam"> {
  columns?: string; filters?: Filters; orderBy?: OrderBy[]; pageSize?: number; performance?: PerformanceOptions;
}
export interface UseTableRecordOptions<T extends TableOrViewName, TData = Row<T> | null> extends Omit<UseQueryOptions<Row<T> | null, Error, TData>, "queryKey" | "queryFn"> {
  columns?: string; performance?: PerformanceOptions;
}
export interface UseUniqueValuesOptions<T extends TableOrViewName, TData = unknown[]> extends Omit<UseQueryOptions<unknown[], Error, TData>, "queryKey" | "queryFn"> {
  tableName: T; filters?: Filters; orderBy?: OrderBy[]; limit?: number; performance?: PerformanceOptions;
}
export interface UseRpcQueryOptions<T extends RpcFunctionName, TData = RpcFunctionReturns<T>> extends Omit<UseQueryOptions<RpcFunctionReturns<T>, Error, TData>, "queryKey" | "queryFn"> {
  performance?: PerformanceOptions;
}
export interface UseTableMutationOptions<TData = unknown, TVariables = unknown, TContext = unknown> extends Omit<UseMutationOptions<TData, Error, TVariables, TContext>, "mutationFn"> {
  invalidateQueries?: boolean; optimisticUpdate?: boolean; batchSize?: number;
}
export interface OptimisticContext { previousData?: [readonly unknown[], unknown][]; }

// ... (Excel Upload types remain the same) ...
export interface UploadColumnMapping<T extends TableName> {
    excelHeader: string;
    dbKey: keyof TableInsert<T> & string;
    transform?: (value: unknown) => unknown;
    required?: boolean;
}
export type UploadType = "insert" | "upsert";
export interface UploadOptions<T extends TableName> {
    file: File;
    columns: UploadColumnMapping<T>[];
    uploadType?: UploadType;
    conflictColumn?: keyof TableInsert<T> & string;
}
export interface UploadResult {
    successCount: number;
    errorCount: number;
    totalRows: number;
    errors: { rowIndex: number; data: unknown; error: string }[];
}
export interface UseExcelUploadOptions<T extends TableName> {
    onSuccess?: (data: UploadResult, variables: UploadOptions<T>) => void;
    onError?: (error: Error, variables: UploadOptions<T>) => void;
    showToasts?: boolean;
    batchSize?: number;
}
export type DashboardOverviewData = {
  system_status_counts: { [key: string]: number };
  node_status_counts: { [key: string]: number };
  path_operational_status: { [key: string]: number };
  cable_utilization_summary: {
    average_utilization_percent: number;
    high_utilization_count: number;
    total_cables: number;
  };
  user_activity_last_30_days: {
    date: string;
    count: number;
  }[];
  systems_per_maintenance_area: { [key: string]: number };
};