import { useMemo, ReactNode } from "react";
import {
  TableOrViewName,
  TABLE_COLUMN_KEYS,
  GenericRow,
} from "@/config/table-column-keys";
import { Column } from "@/hooks/database/excel-queries";

/**
 * This is the final, compatible Column Configuration type.
 * It is generic and includes all properties from your `Column<T>` interface.
 */
export interface ColumnConfig<T extends TableOrViewName> {
  /** The unique, type-safe column name. Used as the React key. */
  key: keyof GenericRow<T> & string;
  /** The human-readable title for the column header. */
  title: string;
  /** The key for accessing data from a row object. We set it to be the same as `key`. */
  dataIndex: keyof GenericRow<T> & string;
  /** Optional: The data format for Excel exports. */
  excelFormat?: "text" | "number" | "date" | "currency" | "percentage";
  /** Optional: Flag to hide the column in the UI. */
  hidden?: boolean;
  /** Optional: Column width for UI tables. Use "auto" to fit content width. */
  width?: number | string;
  /** Optional: Allow sorting on this column. */
  sortable?: boolean;
  /** Optional: Allow searching on this column. */
  searchable?: boolean;
  /** Optional: Allow filtering on this column. */
  filterable?: boolean;
  /** Optional: A custom render function for the cell. */
  render?: (value: unknown, record: GenericRow<T>, index: number) => ReactNode;
  // ... and any other properties from your master Column<T> type.
}

type ColumnOverrides<T extends TableOrViewName> = {
  [K in keyof GenericRow<T>]?: Partial<
    Omit<Column<GenericRow<T>>, "key" | "dataIndex">
  >;
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
  if (
    name.endsWith("_at") ||
    name.endsWith("_on") ||
    name.endsWith("dob") ||
    name.endsWith("doj") ||
    name.includes("date")
  )
    return "date";
  if (
    name.includes("amount") ||
    name.includes("price") ||
    name.includes("total") ||
    name.includes("rkm") ||
    name.includes("mbps")
  )
    return "number";
  if (name.includes("percent")) return "percentage";
  return "text";
}

/**
 * Infers appropriate column width based on column name patterns
 */
function inferColumnWidth(columnName: string): number | string {
  const name = columnName.toLowerCase();

  // ID columns get 240px width
  if (name === "id" || name.endsWith("_id") || name.includes("id_")) {
    return 290;
  }

  // Status columns get 100px width
  if (name === "status" || name.includes("status")) {
    return 70;
  }

  // Boolean/flag columns - use auto to fit content
  if (
    name.startsWith("is_") ||
    name.startsWith("has_") ||
    name.startsWith("can_") ||
    name.includes("enabled") ||
    name.includes("active") ||
    name.includes("visible")
  ) {
    return "auto";
  }

  // Date/time columns
  if (
    name.endsWith("_at") ||
    name.endsWith("_on") ||
    name.endsWith("dob") ||
    name.endsWith("doj") ||
    name.includes("date") ||
    name.includes("time")
  ) {
    return 160;
  }

  // Email columns
  if (name.includes("email")) {
    return 200;
  }

  // Phone columns
  if (name.includes("phone") || name.includes("mobile")) {
    return 140;
  }

  // Name columns - use auto to fit content
  if (name.includes("name") || name.includes("title")) {
    return 320;
  }

  // Description/content columns
  if (
    name.includes("description") ||
    name.includes("content") ||
    name.includes("message") ||
    name.includes("comment") ||
    name.includes("note")
  ) {
    return 300;
  }

  // URL/link columns
  if (name.includes("url") || name.includes("link")) {
    return 200;
  }

  // Numeric/amount columns - use auto to fit content
  if (
    name.includes("amount") ||
    name.includes("price") ||
    name.includes("total") ||
    name.includes("count") ||
    name.includes("quantity") ||
    name.includes("number")
  ) {
    return "auto";
  }

  // Default: auto width to fit content
  return "auto";
}

interface UseDynamicColumnConfigOptions<T extends TableOrViewName> {
  overrides?: ColumnOverrides<T>;
  omit?: (keyof GenericRow<T> & string)[];
}

/**
 * A hook that dynamically generates a detailed and type-safe column configuration array
 * that is fully compatible with the application's standard `Column<T>` interface.
 */
// FIX: The hook is now fully generic for tables and views.
export function useDynamicColumnConfig<T extends TableOrViewName>(
  tableName: T,
  options: UseDynamicColumnConfigOptions<T> = {}
): Column<GenericRow<T>>[] {
  const { overrides = {}, omit = [] } = options;

  const columns = useMemo(() => {
    const keysToUse = TABLE_COLUMN_KEYS[tableName] as
      | (keyof GenericRow<T> & string)[]
      | undefined;

    if (!keysToUse) {
      console.warn(`No column keys found for table/view: ${tableName}`);
      return [];
    }

    const omitSet = new Set(omit);

    return (keysToUse as (keyof GenericRow<T> & string)[])
      .filter((key) => !omitSet.has(key))
      .map((key) => {
        const columnOverride = (key in overrides ? overrides[key as keyof typeof overrides] : {}) || {};

        const defaultConfig: Column<GenericRow<T>> = {
          title: toTitleCase(key),
          dataIndex: key,
          key: key,
          excelFormat: inferExcelFormat(key),
          width: inferColumnWidth(key),
        };

        return { ...defaultConfig, ...columnOverride };
      });
  }, [tableName, overrides, omit]);

  return columns;
}
