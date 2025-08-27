import { useMemo, ReactNode } from "react";
import { TABLE_COLUMN_KEYS } from "@/config/table-column-keys";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import { GenericRow, TableOrViewName } from "@/config/helper-types";
// import { inferColumnWidth } from "@/config/column-width";
import { inferDynamicColumnWidth, inferExcelFormat, toTitleCase } from "@/config/helper-functions";

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
  excelFormat?: "text" | "number" | "date" | "currency" | "percentage" | "json";
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
  [K in keyof GenericRow<T>]?: Partial<Omit<Column<GenericRow<T>>, "key" | "dataIndex">>;
};

interface UseDynamicColumnConfigOptions<T extends TableOrViewName> {
  overrides?: ColumnOverrides<T>;
  omit?: (keyof GenericRow<T> & string)[];
  data?: GenericRow<T>[];
}

/**
 * A hook that dynamically generates a detailed and type-safe column configuration array
 * that is fully compatible with the application's standard `Column<T>` interface.
 */
// FIX: The hook is now fully generic for tables and views.
export function useDynamicColumnConfig<T extends TableOrViewName>(tableName: T, options: UseDynamicColumnConfigOptions<T> = {}): Column<GenericRow<T>>[] {
  const { overrides = {}, omit = [], data = [] } = options;

  // generate column widths dynamically
  const columnWidths: Record<string, number> = {};
  if (data.length > 0) {
    for (const colName of Object.keys(data[0])) {
      columnWidths[colName] = inferDynamicColumnWidth(colName, data);
      if (colName === "date_of_birth" || colName === "last_sign_in_at" || colName === "created_at" || colName === "updated_at" || colName === "auth_updated_at" || colName === "email_confirmed_at" || colName === "phone_confirmed_at") {
        columnWidths[colName] = 120;
      }
    }
  }

  const columns = useMemo(() => {
    const keysToUse = TABLE_COLUMN_KEYS[tableName] as (keyof GenericRow<T> & string)[] | undefined;

    if (!keysToUse) {
      console.warn(`No column keys found for table/view: ${tableName}`);
      return [];
    }

    const omitSet = new Set(omit);

    return (keysToUse as (keyof GenericRow<T> & string)[])
      .filter((key) => !omitSet.has(key))
      .map((key) => {
        const columnOverride = (key in overrides ? overrides[key as keyof typeof overrides] : {}) || {};
        console.log(key + ":" + columnWidths[key]);
        const defaultConfig: Column<GenericRow<T>> = {
          title: toTitleCase(key),
          dataIndex: key,
          key: key,
          excelFormat: inferExcelFormat(key),
          width: columnWidths[key],
        };

        return { ...defaultConfig, ...columnOverride };
      });
  }, [tableName, overrides, omit]);

  return columns;
}
