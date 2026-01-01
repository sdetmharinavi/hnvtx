// path: hooks/database/excel-queries/excel-helpers.ts
import * as ExcelJS from 'exceljs';
import { Filters, UploadResult } from '@/hooks/database';
import { TableOrViewName, Row } from '@/hooks/database';

export interface Column<T> {
  key: string;
  title: string;
  dataIndex: string;
  width?: number | string;
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  transform?: (value: unknown, record?: T) => unknown;
  filterOptions?: { label: string; value: unknown }[];
  align?: 'left' | 'center' | 'right';
  hidden?: boolean;
  excelFormat?: 'text' | 'number' | 'integer' | 'date' | 'currency' | 'percentage' | 'json';
  excludeFromExport?: boolean;
  naturalSort?: boolean;
  excelHeader?: string;
  // NEW: Forces the column to stay visible even if autoHideEmptyColumns is true and data is empty
  alwaysVisible?: boolean;
  // NEW: Options for dropdown editing
  editOptions?: { label: string; value: string | number | boolean }[];
}

export interface RPCConfig<TParams = Record<string, unknown>> {
  functionName: string;
  parameters?: TParams;
  selectFields?: string;
}
export interface DownloadOptions<T extends TableOrViewName = TableOrViewName> {
  fileName?: string;
  filters?: Filters;
  columns?: Column<Row<T>>[];
  sheetName?: string;
  maxRows?: number;
  customStyles?: ExcelStyles;
  rpcConfig?: RPCConfig;
}
export interface ExcelStyles {
  headerFont?: Partial<ExcelJS.Font>;
  headerFill?: ExcelJS.FillPattern;
  dataFont?: Partial<ExcelJS.Font>;
  alternateRowFill?: ExcelJS.FillPattern;
  borderStyle?: Partial<ExcelJS.Borders>;
}
export interface ExcelDownloadResult {
  fileName: string;
  rowCount: number;
  columnCount: number;
}
export interface UseExcelDownloadOptions<T extends TableOrViewName = TableOrViewName> {
  onSuccess?: (data: ExcelDownloadResult, variables: DownloadOptions<T>) => void;
  onError?: (error: Error, variables: DownloadOptions<T>) => void;
  showToasts?: boolean;
  batchSize?: number;
  defaultRPCConfig?: RPCConfig;
}
export interface ValidationError {
  rowIndex: number;
  column: string;
  value: unknown;
  error: string;
  data?: Record<string, unknown>;
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
export interface EnhancedUploadResult extends UploadResult {
  processingLogs: ProcessingLog[];
  validationErrors: ValidationError[];
  skippedRows: number;
}

export const createFillPattern = (color: string): ExcelJS.FillPattern => ({
  type: 'pattern',
  pattern: 'solid',
  fgColor: { argb: color },
});

export const formatCellValue = <T = unknown>(
  value: unknown,
  column: Column<T>,
  record?: T
): unknown => {
  if (column.transform) {
    return column.transform(value, record);
  }

  if (value === null || value === undefined || value === '') {
    return null;
  }

  switch (column.excelFormat) {
    case 'date':
      const date = new Date(value as string | number | Date);
      return isNaN(date.getTime()) ? null : date;
    case 'number':
      const num = parseFloat(String(value));
      return isNaN(num) ? null : num;
    case 'integer':
      const int = parseInt(String(value), 10);
      return isNaN(int) ? null : int;
    case 'currency':
      const currencyNum = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
      return isNaN(currencyNum) ? null : currencyNum;
    case 'percentage':
      const percNum = parseFloat(String(value));
      return isNaN(percNum) ? null : percNum / 100;
    case 'json':
      if (typeof value === 'object') {
        return JSON.stringify(value, null, 2);
      }
      return String(value);
    default:
      if (typeof value === 'object') {
        if (value instanceof Date) return value;
        return JSON.stringify(value);
      }
      return String(value);
  }
};

export const applyCellFormatting = <T = unknown>(cell: ExcelJS.Cell, column: Column<T>): void => {
  switch (column.excelFormat) {
    case 'date':
      cell.numFmt = 'mm/dd/yyyy';
      break;
    case 'currency':
      cell.numFmt = '"$"#,##0.00';
      break;
    case 'percentage':
      cell.numFmt = '0.00%';
      break;
    case 'number':
      cell.numFmt = '#,##0.00';
      break;
    case 'integer':
      cell.numFmt = '0';
      break;
    case 'text':
    case 'json':
      cell.numFmt = '@';
      break;
  }
  if (column.align) {
    cell.alignment = { horizontal: column.align };
  }
};

export const removeSubnet = (value: unknown): string | null => {
  if (value === null || value === undefined) return null;
  return String(value).split('/')[0];
};

export const getDefaultStyles = (): ExcelStyles => ({
  headerFont: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
  headerFill: createFillPattern('FF2563EB'),
  dataFont: { size: 11 },
  alternateRowFill: createFillPattern('FFF8F9FA'),
  borderStyle: {
    top: { style: 'thin' },
    left: { style: 'thin' },
    bottom: { style: 'thin' },
    right: { style: 'thin' },
  },
});
export const sanitizeFileName = (fileName: string): string =>
  fileName.replace(/[^a-z0-9.-]/gi, '_').replace(/_{2,}/g, '_');
export const convertFiltersToRPCParams = (filters?: Filters): Record<string, unknown> => {
  if (!filters) return {};
  const rpcParams: Record<string, unknown> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') rpcParams[key] = value;
  });
  return rpcParams;
};
export const generateUUID = (): string => {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g && g.crypto && typeof g.crypto.randomUUID === 'function') return g.crypto.randomUUID();
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
export const logRowProcessing = (
  rowIndex: number,
  excelRowNumber: number,
  originalData: Record<string, unknown>,
  processedData: Record<string, unknown>,
  validationErrors: ValidationError[] = [],
  isSkipped = false,
  skipReason?: string
): ProcessingLog => {
  const log: ProcessingLog = {
    rowIndex,
    excelRowNumber,
    originalData,
    processedData,
    validationErrors,
    isSkipped,
    skipReason,
  };
  return log;
};
export const logColumnTransformation = (
  rowIndex: number,
  column: string,
  originalValue: unknown,
  transformedValue: unknown,
  error?: string
): void => {
  if (error) console.error(`   ❌ Error: ${error}`);
};
export const validateValue = (
  value: unknown,
  columnName: string,
  isRequired: boolean
): ValidationError | null => {
  if (isRequired) {
    const isEmpty =
      value === null || value === undefined || (typeof value === 'string' && value.trim() === '');
    if (isEmpty)
      return {
        rowIndex: -1,
        column: columnName,
        value,
        error: `Required field "${columnName}" is empty`,
      };
  }
  if (value !== null && value !== undefined && value !== '') {
    if (
      (columnName === 'id' || columnName.endsWith('_id')) &&
      columnName !== 'transnet_id' &&
      columnName !== 'maan_node_id'
    ) {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const strValue = String(value).trim();
      if (strValue && !uuidRegex.test(strValue) && strValue !== '')
        return {
          rowIndex: -1,
          column: columnName,
          value,
          error: `Invalid UUID format for "${columnName}": ${strValue}`,
        };
    }
    if (columnName.toLowerCase().includes('email')) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const strValue = String(value).trim();
      if (strValue && !emailRegex.test(strValue))
        return {
          rowIndex: -1,
          column: columnName,
          value,
          error: `Invalid email format for "${columnName}": ${strValue}`,
        };
    }
    const isIPField =
      columnName === 'ip_address' || columnName.endsWith('_ip') || columnName.includes('ipaddr');
    if (isIPField) {
      const ipRegex =
        /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const strValue = String(value).trim();
      if (strValue && !ipRegex.test(strValue))
        return {
          rowIndex: -1,
          column: columnName,
          value,
          error: `Invalid IP address format for "${columnName}": ${strValue}`,
        };
    }
  }
  return null;
};
