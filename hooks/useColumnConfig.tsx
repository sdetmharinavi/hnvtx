import { useMemo, ReactNode } from 'react';
import { TABLE_COLUMN_KEYS } from '@/config/table-column-keys';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import {
  inferDynamicColumnWidth,
  inferExcelFormat,
  toTitleCase,
} from '@/config/helper-functions';
import { Row, TableOrViewName } from '@/hooks/database';

const dateColumns = new Set([
  'date_of_birth',
  'last_sign_in_at',
  'created_at',
  'updated_at',
  'auth_updated_at',
  'email_confirmed_at',
  'phone_confirmed_at',
]);

export interface ColumnConfig<T extends TableOrViewName> {
  key: keyof Row<T> & string;
  title: string;
  dataIndex: keyof Row<T> & string;
  excelFormat?: 'text' | 'number' | 'date' | 'currency' | 'percentage' | 'json';
  hidden?: boolean;
  width?: number | string;
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  render?: (value: unknown, record: Row<T>, index: number) => ReactNode;
  resizable?: boolean;
}

type ColumnOverrides<T extends TableOrViewName> = {
  [K in keyof Row<T>]?: Partial<ColumnConfig<T>>;
};

interface UseDynamicColumnConfigOptions<T extends TableOrViewName> {
  overrides?: ColumnOverrides<T>;
  omit?: (keyof Row<T> & string)[];
  data?: Row<T>[];
}

export function useDynamicColumnConfig<T extends TableOrViewName>(
  tableName: T,
  options: UseDynamicColumnConfigOptions<T> = {}
): Column<Row<T>>[] {
  const { overrides = {}, omit = [], data = [] } = options;

  // CORRECTED: The `dateColumns` constant should not be in the dependency array.
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
  }, [data]);

  const columns = useMemo(() => {
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
  }, [tableName, overrides, omit, columnWidths]);

  return columns;
}