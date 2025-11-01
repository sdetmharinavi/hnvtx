// hooks/database/excel-queries/excel-helpers.ts
import * as ExcelJS from "exceljs";
import { Filters, UploadResult } from "@/hooks/database";
import { TableOrViewName, Row } from "@/hooks/database";

// ... (other interfaces remain the same) ...
export interface Column<T> {
  key: string;
  title: string;
  dataIndex: keyof T & string;
  width?: number | string;
  sortable?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  editable?: boolean;
  render?: (value: unknown, record: T, index: number) => React.ReactNode;
  filterOptions?: { label: string; value: unknown }[];
  align?: "left" | "center" | "right";
  hidden?: boolean;
  excelFormat?: "text" | "number" | "integer" | "date" | "currency" | "percentage" | "json";
  excludeFromExport?: boolean;
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
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: color },
});

// THE FIX: Reordered logic to prioritize excelFormat over generic type checks.
export const formatCellValue = <T = unknown>(value: unknown, column: Column<T>): unknown => {
  if (value === null || value === undefined) return "";

  switch (column.excelFormat) {
    case "date":
      return value instanceof Date ? value : new Date(value as string);
    case "number":
      return typeof value === "string" ? parseFloat(value) || 0 : value;
    case "integer":
      return typeof value === "string" ? parseInt(value, 10) || 0 : value;
    case "currency":
      return typeof value === "string" ? parseFloat(value.replace(/[^0-9.-]/g, "")) || 0 : value;
    case "percentage":
      return typeof value === "number" ? value / 100 : parseFloat(String(value)) / 100 || 0;
    case "json": {
      if (typeof value === "string") {
        try {
          const parsed = JSON.parse(value);
          return JSON.stringify(parsed, null, 2); // Prettify for readability
        } catch {
          return value;
        }
      }
      return String(value);
    }
    case "text":
      return String(value);
    default:
      // Fallback logic for when no excelFormat is specified
      if (typeof value === "number") return value;
      if (typeof value === "object" && value !== null) {
        if (value instanceof Date) return value;
        if (Array.isArray(value)) return value.join(", ");
        return JSON.stringify(value);
      }
      return String(value);
  }
};

export const applyCellFormatting = <T = unknown>(cell: ExcelJS.Cell, column: Column<T>): void => {
  switch (column.excelFormat) {
    case "date":
      cell.numFmt = "mm/dd/yyyy";
      break;
    case "currency":
      cell.numFmt = '"$"#,##0.00';
      break;
    case "percentage":
      cell.numFmt = "0.00%";
      break;
    case "number":
      cell.numFmt = "#,##0.00";
      break;
    case "integer":
      cell.numFmt = "0";
      break;
    case "text":
      cell.numFmt = "@";
      break;
  }
  if (column.align) {
    cell.alignment = { horizontal: column.align };
  }
};

// ... (rest of the file remains the same) ...
export const getDefaultStyles = (): ExcelStyles => ({
  headerFont: { bold: true, color: { argb: "FFFFFFFF" }, size: 12 },
  headerFill: createFillPattern("FF2563EB"),
  dataFont: { size: 11 },
  alternateRowFill: createFillPattern("FFF8F9FA"),
  borderStyle: {
    top: { style: "thin" },
    left: { style: "thin" },
    bottom: { style: "thin" },
    right: { style: "thin" },
  },
});
export const sanitizeFileName = (fileName: string): string =>
  fileName.replace(/[^a-z0-9.-]/gi, "_").replace(/_{2,}/g, "_");
export const convertFiltersToRPCParams = (filters?: Filters): Record<string, unknown> => {
  if (!filters) return {};
  const rpcParams: Record<string, unknown> = {};
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") rpcParams[key] = value;
  });
  return rpcParams;
};
export const generateUUID = (): string => {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g && g.crypto && typeof g.crypto.randomUUID === "function") return g.crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0,
      v = c === "x" ? r : (r & 0x3) | 0x8;
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
      value === null || value === undefined || (typeof value === "string" && value.trim() === "");
    if (isEmpty)
      return {
        rowIndex: -1,
        column: columnName,
        value,
        error: `Required field "${columnName}" is empty`,
      };
  }
  if (value !== null && value !== undefined && value !== "") {
    if ((columnName === "id" || columnName.endsWith("_id")) && columnName !== "transnet_id" && columnName !== "maan_node_id") {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const strValue = String(value).trim();
      if (strValue && !uuidRegex.test(strValue) && strValue !== "")
        return {
          rowIndex: -1,
          column: columnName,
          value,
          error: `Invalid UUID format for "${columnName}": ${strValue}`,
        };
    }
    if (columnName.toLowerCase().includes("email")) {
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
      columnName === "ip_address" || columnName.endsWith("_ip") || columnName.includes("ipaddr");
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
