// hooks/useColumnConfig.tsx

import { useMemo, ReactNode } from 'react';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import {
  inferDynamicColumnWidth,
  inferExcelFormat,
  toTitleCase,
} from '@/config/helper-functions';
import { Row, PublicTableOrViewName } from '@/hooks/database';

/**
 * This is the final, compatible Column Configuration type.
 * It is generic and includes all properties from your `Column<T>` interface.
 */
export interface ColumnConfig<T extends PublicTableOrViewName> {
  /** The unique, type-safe column name. Used as the React key. */
  key: keyof Row<T> & string;
  /** The human-readable title for the column header. */
  title: string;
  /** The key for accessing data from a row object. We set it to be the same as `key`. */
  dataIndex: keyof Row<T> & string;
  /** Optional: The data format for Excel exports. */
  excelFormat?: 'text' | 'number' | 'integer' | 'date' | 'currency' | 'percentage' | 'json';
  /** Optional: Flag to hide the column in the UI. */
  hidden?: boolean;
  /** Optional: Column width for UI tables. Use "auto" to fit content width. */
  width?: number | string;
  /** Optional: Allow sorting on this column. */
  sortable?: boolean;
  naturalSort?: boolean;
  /** Optional: Allow searching on this column. */
  searchable?: boolean;
  /** Optional: Allow filtering on this column. */
  filterable?: boolean;
  /** Optional: A custom render function for the cell. */
  render?: (value: unknown, record: Row<T>, index: number) => ReactNode;
  /** Optional: A custom transformation function for Excel export. */
  transform?: (value: unknown, record?: Row<T>) => unknown;
  // ... and any other properties from your master Column<T> type.
  resizable?: boolean;
  editable?: boolean;
  excelHeader?: string;
  // NEW: Propagate alwaysVisible
  alwaysVisible?: boolean;
}

type ColumnOverrides<T extends PublicTableOrViewName> = {
  [K in keyof Row<T>]?: Partial<ColumnConfig<T>>;
};

interface UseDynamicColumnConfigOptions<T extends PublicTableOrViewName> {
  overrides?: ColumnOverrides<T>;
  omit?: (keyof Row<T> & string)[];
  data?: Row<T>[];
}

export function useDynamicColumnConfig<T extends PublicTableOrViewName>(
  tableName: T,
  options: UseDynamicColumnConfigOptions<T> = {}
): Column<Row<T>>[] {
  const { overrides = {}, omit = [], data = [] } = options;

  const dateColumns = useMemo(
    () =>
      new Set([
        'date_of_birth',
        'last_sign_in_at',
        'created_at',
        'updated_at',
        'auth_updated_at',
        'email_confirmed_at',
        'phone_confirmed_at',
      ]),
    []
  );

  const columnWidths = useMemo(() => {
    const widths: Record<string, number> = {};
    if (data.length > 0) {
      for (const colName of Object.keys(data[0] || {})) {
        widths[colName] = dateColumns.has(colName)
          ? 120
          : inferDynamicColumnWidth(colName, data);
      }
    }
    return widths;
  }, [data, dateColumns]);

  const columns = useMemo(() => {
    if (!tableName) {
      return [];
    }

    const keysToUse = TABLE_COLUMN_KEYS[
      tableName as keyof typeof TABLE_COLUMN_KEYS
    ] as unknown as (keyof Row<T> & string)[] | undefined;

    if (!keysToUse) {
      console.warn(`No column keys found for table/view: ${tableName}`);
      return [];
    }

    const omitSet = new Set(omit);

    return (keysToUse as (keyof Row<T> & string)[])
      .filter((key) => !omitSet.has(key))
      .map((key) => {
        const columnOverride =
          (key in overrides ? overrides[key as keyof typeof overrides] : {}) ||
          {};
        
        const defaultConfig: Column<Row<T>> = {
          title: toTitleCase(key),
          dataIndex: key,
          key: key,
          excelFormat: inferExcelFormat(key),
          width: columnWidths?.[key],
        };

        return { ...defaultConfig, ...columnOverride };
      });
  }, [tableName, overrides, omit, columnWidths]); // Its dependencies are now correct.

  // const columnsKeys = columns.map((col) => col.key);

  // useEffect(() => {
  //   console.log(`columns for ${tableName}`, columnsKeys);
  // // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, []);

  return columns;
}