import { useMemo, ReactNode } from "react";
import { Database, Tables } from "@/types/supabase-types";
import { TABLE_COLUMN_KEYS } from "@/config/table-column-keys";

// =================================================================
// 1. FINAL TYPE DEFINITIONS
// These types now perfectly align with your existing Column interface.
// =================================================================

type TableName = keyof Database["public"]["Tables"];

/**
 * This is the final, compatible Column Configuration type.
 * It is generic and includes all properties from your `Column<T>` interface.
 */
export interface ColumnConfig<T extends TableName> {
  /** The unique, type-safe column name. Used as the React key. */
  key: keyof Tables<T> & string;
  /** The human-readable title for the column header. */
  title: string;
  /** The key for accessing data from a row object. We set it to be the same as `key`. */
  dataIndex: keyof Tables<T> & string;
  /** Optional: The data format for Excel exports. */
  excelFormat?: "text" | "number" | "date" | "currency" | "percentage";
  /** Optional: Flag to hide the column in the UI. */
  hidden?: boolean;
  /** Optional: Column width for UI tables. */
  width?: number | string;
  /** Optional: Allow sorting on this column. */
  sortable?: boolean;
  /** Optional: Allow searching on this column. */
  searchable?: boolean;
  /** Optional: Allow filtering on this column. */
  filterable?: boolean;
  /** Optional: A custom render function for the cell. */
  render?: (value: unknown, record: Tables<T>, index: number) => ReactNode;
  // ... and any other properties from your master Column<T> type.
}

// A type for providing custom overrides for generated columns.
// Users should not override `key` or `dataIndex`.
type ColumnOverrides<T extends TableName> = {
  [K in keyof Tables<T>]?: Partial<Omit<ColumnConfig<T>, "key" | "dataIndex">>;
};

// Helper functions
function toTitleCase(str: string): string {
  if (!str) return "";
  return str
    .replace(/_/g, " ")
    .replace(/([A-Z])/g, " $1")
    .replace(/\b\w/g, (char) => char.toUpperCase())
    .trim();
}

function inferExcelFormat(
  columnName: string
): "text" | "number" | "date" | "currency" | "percentage" {
  const name = columnName.toLowerCase();
  if (name.endsWith("_at") || name.endsWith("_on") || name.includes("date")) return "date";
  if (name.includes("amount") || name.includes("price") || name.includes("total") || name.includes("rkm") || name.includes("mbps")) return "number";
  if (name.includes("percent")) return "percentage";
  return "text";
}

/**
 * Infers appropriate column width based on column name patterns
 */
function inferColumnWidth(columnName: string): number {
  const name = columnName.toLowerCase();
  
  // ID columns get 240px width
  if (name === 'id' || name.endsWith('_id') || name.includes('id_')) {
    return 240;
  }
  
  // Status columns get 100px width
  if (name === 'status' || name.includes('status')) {
    return 80;
  }
  
  // Date/time columns
  if (name.endsWith('_at') || name.endsWith('_on') || name.includes('date') || name.includes('time')) {
    return 160;
  }
  
  // Boolean/flag columns
  if (name.startsWith('is_') || name.startsWith('has_') || name.startsWith('can_') || 
      name.includes('enabled') || name.includes('active') || name.includes('visible')) {
    return 80;
  }
  
  // Email columns
  if (name.includes('email')) {
    return 200;
  }
  
  // Phone columns
  if (name.includes('phone') || name.includes('mobile')) {
    return 140;
  }
  
  // Name columns
  if (name.includes('name') || name.includes('title')) {
    return 220;
  }
  
  // Description/content columns
  if (name.includes('description') || name.includes('content') || name.includes('message') || 
      name.includes('comment') || name.includes('note')) {
    return 300;
  }
  
  // URL/link columns
  if (name.includes('url') || name.includes('link')) {
    return 200;
  }
  
  // Numeric/amount columns
  if (name.includes('amount') || name.includes('price') || name.includes('total') || 
      name.includes('count') || name.includes('quantity') || name.includes('number')) {
    return 120;
  }
  
  // Default width for other columns
  return 150;
}

// =================================================================
// 2. THE FINAL, COMPATIBLE HOOK
// =================================================================

interface UseDynamicColumnConfigOptions<T extends TableName> {
  columnKeys?: (keyof Tables<T> & string)[];
  overrides?: ColumnOverrides<T>;
}

/**
 * A hook that dynamically generates a detailed and type-safe column configuration array
 * that is fully compatible with the application's standard `Column<T>` interface.
 *
 * @param tableName The name of the table from your Supabase schema.
 * @param options (Optional) Options to customize the output, including a custom key list or overrides.
 * @returns A memoized, detailed column configuration array.
 */
export function useDynamicColumnConfig<T extends TableName>(tableName: T, options: UseDynamicColumnConfigOptions<T> = {}): ColumnConfig<T>[] {
  const { columnKeys: customKeys, overrides = {} as ColumnOverrides<T> } = options;

  const columns = useMemo(() => {
    const keysToUse = customKeys || TABLE_COLUMN_KEYS[tableName];
    if (!keysToUse) return [];

    return (keysToUse as (keyof Tables<T> & string)[]).map((key) => {
      const columnOverride = overrides[key];

      // Generate default configuration with intelligent width inference
      const defaultConfig: ColumnConfig<T> = {
        title: toTitleCase(key),
        dataIndex: key,
        key: key,
        excelFormat: inferExcelFormat(key),
        width: inferColumnWidth(key), // Automatically infer appropriate width
      };

      // The final object is a merge, ensuring overrides take precedence.
      return { ...defaultConfig, ...columnOverride };
    });
  }, [tableName, customKeys, overrides]);

  return columns;
}