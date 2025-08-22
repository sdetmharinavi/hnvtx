/* eslint-disable @typescript-eslint/no-explicit-any */
// hooks/database/excel-queries.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import * as ExcelJS from "exceljs";
import { toast } from "sonner";
import { Database } from "@/types/supabase-types";
import {
  Filters,
  TableInsert,
  UploadOptions,
  UploadResult,
  UseExcelUploadOptions,
  applyFilters,
} from "@/hooks/database";
import {
  TableName,
  ViewName,
  AuthTableOrViewName,
  isTableName,
  Row,
} from "@/hooks/database";
import * as XLSX from "xlsx";

//================================================================================
// TYPES AND INTERFACES
//================================================================================

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
  filterOptions?: { label: string; value: unknown }[];
  align?: "left" | "center" | "right";
  hidden?: boolean;
  excelFormat?: "text" | "number" | "date" | "currency" | "percentage";
  excludeFromExport?: boolean;
}

// Generic RPC Configuration that works with any function
export interface RPCConfig<TParams = Record<string, unknown>> {
  functionName: string;
  parameters?: TParams;
  selectFields?: string;
}

// NOTE: T refers to a table/view name. Columns should describe a Row<T>.
export interface DownloadOptions<T extends AuthTableOrViewName = AuthTableOrViewName> {
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

export interface UseExcelDownloadOptions<T extends AuthTableOrViewName = AuthTableOrViewName> {
  onSuccess?: (
    data: ExcelDownloadResult,
    variables: DownloadOptions<T>
  ) => void;
  onError?: (error: Error, variables: DownloadOptions<T>) => void;
  showToasts?: boolean;
  batchSize?: number;
  defaultRPCConfig?: RPCConfig;
}

// Enhanced error tracking interfaces
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

//================================================================================
// UTILITY FUNCTIONS
//================================================================================

export const createFillPattern = (color: string): ExcelJS.FillPattern => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: color },
});

export const formatCellValue = <T = unknown>(
  value: unknown,
  column: Column<T>
): unknown => {
  if (value === null || value === undefined) return "";
  switch (column.excelFormat) {
    case "date":
      return value instanceof Date ? value : new Date(value as string);
    case "number":
      return typeof value === "string" ? parseFloat(value) || 0 : value;
    case "currency":
      return typeof value === "string"
        ? parseFloat(value.replace(/[^0-9.-]/g, "")) || 0
        : value;
    case "percentage":
      return typeof value === "number"
        ? value / 100
        : parseFloat(String(value)) / 100 || 0;
    default:
      return String(value);
  }
};

export const applyCellFormatting = <T = unknown>(
  cell: ExcelJS.Cell,
  column: Column<T>
): void => {
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
  }
  if (column.align) {
    cell.alignment = { horizontal: column.align };
  }
};

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

export const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-z0-9.-]/gi, "_").replace(/_{2,}/g, "_");
};

export const convertFiltersToRPCParams = (
  filters?: Filters
): Record<string, unknown> => {
  if (!filters) return {};

  const rpcParams: Record<string, unknown> = {};

  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      rpcParams[key] = value;
    }
  });

  return rpcParams;
};

// Safe UUID generator: uses crypto.randomUUID if available, otherwise a lightweight fallback
const generateUUID = (): string => {
  const g = globalThis as { crypto?: { randomUUID?: () => string } };
  if (g && g.crypto && typeof g.crypto.randomUUID === "function") {
    return g.crypto.randomUUID();
  }
  // RFC4122 version 4 fallback
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Enhanced logging utilities
const logRowProcessing = (
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

  console.group(`🔍 Processing Row ${excelRowNumber} (Index: ${rowIndex})`);
  console.log("📊 Original Data:", originalData);
  console.log("🔄 Processed Data:", processedData);
  
  if (validationErrors.length > 0) {
    console.warn("❌ Validation Errors:", validationErrors);
  }
  
  if (isSkipped) {
    console.warn("⏭️ Row Skipped:", skipReason);
  }
  
  console.groupEnd();

  return log;
};

const logColumnTransformation = (
  rowIndex: number,
  column: string,
  originalValue: unknown,
  transformedValue: unknown,
  error?: string
): void => {
  console.log(`🔧 Column "${column}" (Row ${rowIndex + 2}):`);
  console.log(`   Original: ${JSON.stringify(originalValue)} (${typeof originalValue})`);
  console.log(`   Transformed: ${JSON.stringify(transformedValue)} (${typeof transformedValue})`);
  
  if (error) {
    console.error(`   ❌ Error: ${error}`);
  }
};

// Enhanced value validation
const validateValue = (
  value: unknown,
  columnName: string,
  isRequired: boolean
): ValidationError | null => {
  if (isRequired) {
    const isEmpty =
      value === null ||
      value === undefined ||
      (typeof value === "string" && value.trim() === "");
    
    if (isEmpty) {
      return {
        rowIndex: -1, // Will be set by caller
        column: columnName,
        value,
        error: `Required field "${columnName}" is empty`,
      };
    }
  }

  // Type-specific validations
  if (value !== null && value !== undefined && value !== "") {
    // Check for UUID format if column suggests it's an ID
    if (columnName === "id" || columnName.endsWith("_id")) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      const strValue = String(value).trim();
      if (strValue && !uuidRegex.test(strValue) && strValue !== "") {
        return {
          rowIndex: -1,
          column: columnName,
          value,
          error: `Invalid UUID format for "${columnName}": ${strValue}`,
        };
      }
    }

    // Check for email format
    if (columnName.toLowerCase().includes("email")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const strValue = String(value).trim();
      if (strValue && !emailRegex.test(strValue)) {
        return {
          rowIndex: -1,
          column: columnName,
          value,
          error: `Invalid email format for "${columnName}": ${strValue}`,
        };
      }
    }

    // Check for IP address format
    const isIPField = columnName === "ip_address" || 
                     columnName.endsWith("_ip") || 
                     columnName.includes("ipaddr");
    if (isIPField) {
      const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
      const strValue = String(value).trim();
      if (strValue && !ipRegex.test(strValue)) {
        return {
          rowIndex: -1,
          column: columnName,
          value,
          error: `Invalid IP address format for "${columnName}": ${strValue}`,
        };
      }
    }
  }

  return null;
};

//================================================================================
// MAIN HOOKS
//================================================================================

// Hook for RPC-based downloads with full type safety
export function useRPCExcelDownload<T extends AuthTableOrViewName>(
  supabase: SupabaseClient<Database>,
  options?: UseExcelDownloadOptions<T>
) {
  const {
    showToasts = true,
    batchSize = 50000,
    ...mutationOptions
  } = options || {};

  return useMutation<
    ExcelDownloadResult,
    Error,
    DownloadOptions<T> & { rpcConfig: RPCConfig }
  >({
    mutationFn: async (downloadOptions): Promise<ExcelDownloadResult> => {
      try {
        const defaultStyles = getDefaultStyles();
        const mergedOptions = {
          sheetName: "Data",
          maxRows: batchSize,
          customStyles: defaultStyles,
          ...downloadOptions,
        };

        const {
          fileName = `export-${new Date().toISOString().split("T")[0]}.xlsx`,
          filters,
          columns,
          sheetName,
          maxRows,
          rpcConfig,
        } = mergedOptions;

        const styles = { ...defaultStyles, ...mergedOptions.customStyles };

        if (!columns || columns.length === 0)
          throw new Error("No columns specified for export");
        if (!rpcConfig)
          throw new Error("RPC configuration is required for this hook");

        const exportColumns = columns.filter((col) => !col.excludeFromExport);
        if (exportColumns.length === 0)
          throw new Error("All columns are excluded from export");

        toast.info("Fetching data via RPC...");

        // Prepare RPC parameters
        const rpcParams = {
          ...rpcConfig.parameters,
          ...convertFiltersToRPCParams(filters),
        };

        if (maxRows) {
          rpcParams.row_limit = maxRows;
        }

        // Execute RPC call with proper error handling
        const { data, error } = await supabase.rpc(
          rpcConfig.functionName as keyof Database["public"]["Functions"],
          rpcParams
        );

        if (error) throw new Error(`RPC call failed: ${error.message}`);
        if (!data || (Array.isArray(data) && data.length === 0)) {
          throw new Error("No data returned from RPC function");
        }

        // Ensure data is an array
        const dataArray = Array.isArray(data) ? data : [data];
        toast.success(
          `Fetched ${dataArray.length} records. Generating Excel file...`
        );

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName || "Data");

        // Set column properties
        worksheet.columns = exportColumns.map((col) => ({
          key: String(col.dataIndex),
          width: typeof col.width === "number" ? col.width / 8 : 20,
        }));

        // Add header row
        const headerTitles = exportColumns.map((col) => col.title);
        const headerRow = worksheet.addRow(headerTitles);
        headerRow.height = 25;

        exportColumns.forEach((col, index) => {
          const cell = headerRow.getCell(index + 1);
          if (styles.headerFont) cell.font = styles.headerFont;
          if (styles.headerFill) cell.fill = styles.headerFill;
          cell.alignment = { horizontal: "center", vertical: "middle" };

          if (styles.borderStyle) {
            cell.border = {
              top: styles.borderStyle.top,
              bottom: styles.borderStyle.bottom,
              right: styles.borderStyle.right,
              left: index === 0 ? styles.borderStyle.left : undefined,
            };
          }
        });

        // Add data rows
        dataArray.forEach((record, rowIndex: number) => {
          // Ensure we only process object-like rows (Supabase RPC returns Json which can be null/primitive/array/object)
          if (record === null || typeof record !== "object" || Array.isArray(record)) {
            return; // skip non-object rows
          }

          const obj = record as Record<string, unknown>;
          const rowData: Record<string, unknown> = {};
          exportColumns.forEach((col) => {
            const value = obj[col.dataIndex];
            const key = col.dataIndex as keyof Row<T> & string;
            rowData[key] = formatCellValue(value, col);
          });
          const excelRow = worksheet.addRow(rowData);

          // Style each cell
          exportColumns.forEach((col, colIndex) => {
            const cell = excelRow.getCell(colIndex + 1);

            if (styles.dataFont) cell.font = styles.dataFont;

            if (rowIndex % 2 === 1 && styles.alternateRowFill) {
              cell.fill = styles.alternateRowFill;
            }

            applyCellFormatting(cell, col);

            if (styles.borderStyle) {
              const isLastDataRow = rowIndex === dataArray.length - 1;
              cell.border = {
                right: styles.borderStyle.right,
                left: colIndex === 0 ? styles.borderStyle.left : undefined,
                top: styles.borderStyle.top,
                bottom: isLastDataRow ? styles.borderStyle.bottom : undefined,
              };
            }
          });
        });

        // Freeze header row
        worksheet.views = [{ state: "frozen", ySplit: 1 }];

        // Generate and download file
        const buffer = await workbook.xlsx.writeBuffer();
        const sanitizedFileName = sanitizeFileName(fileName);
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = sanitizedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        toast.success(
          `Excel file "${sanitizedFileName}" downloaded successfully!`
        );
        return {
          fileName: sanitizedFileName,
          rowCount: dataArray.length,
          columnCount: exportColumns.length,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        if (showToasts) {
          toast.error(`Download failed: ${errorMessage}`);
        }
        throw error;
      }
    },
    ...mutationOptions,
  });
}

// Hook for traditional table/view downloads (backward compatible)
export function useTableExcelDownload<T extends AuthTableOrViewName>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  options?: UseExcelDownloadOptions<T>
) {
  const {
    showToasts = true,
    batchSize = 50000,
    ...mutationOptions
  } = options || {};

  return useMutation<
    ExcelDownloadResult,
    Error,
    Omit<DownloadOptions<T>, "rpcConfig">
  >({
    mutationFn: async (downloadOptions): Promise<ExcelDownloadResult> => {
      try {
        const defaultStyles = getDefaultStyles();
        const mergedOptions = {
          sheetName: "Data",
          maxRows: batchSize,
          customStyles: defaultStyles,
          ...downloadOptions,
        };

        const {
          fileName = `${String(tableName)}-${
            new Date().toISOString().split("T")[0]
          }.xlsx`,
          filters,
          columns,
          sheetName,
          maxRows,
        } = mergedOptions;

        const styles = { ...defaultStyles, ...mergedOptions.customStyles };

        if (!columns || columns.length === 0)
          throw new Error("No columns specified for export");
        const exportColumns = columns.filter((col) => !col.excludeFromExport);
        if (exportColumns.length === 0)
          throw new Error("All columns are excluded from export");

        toast.info("Fetching data for download...");

        const selectFields = exportColumns
          .map((col) => col.dataIndex)
          .join(",");
        let query = isTableName(tableName)
          ? supabase.from(tableName as TableName).select(selectFields)
          : supabase.from(tableName as ViewName).select(selectFields);

        if (filters) query = applyFilters(query, filters);
        if (maxRows) query = query.limit(maxRows);

        const { data, error } = await query;

        if (error) throw new Error(`Failed to fetch data: ${error.message}`);
        if (!data || data.length === 0)
          throw new Error("No data found for the selected criteria");

        const typedData = data as Row<T>[];
        toast.success(
          `Fetched ${typedData.length} records. Generating Excel file...`
        );

        // Excel generation logic (same as before)
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName || "Data");

        worksheet.columns = exportColumns.map((col) => ({
          key: String(col.dataIndex), // Convert to string to ensure type safety
          width: typeof col.width === "number" ? col.width / 8 : 20,
        }));

        const headerTitles = exportColumns.map((col) => col.title);
        const headerRow = worksheet.addRow(headerTitles);
        headerRow.height = 25;

        exportColumns.forEach((col, index) => {
          const cell = headerRow.getCell(index + 1);
          if (styles.headerFont) cell.font = styles.headerFont;
          if (styles.headerFill) cell.fill = styles.headerFill;
          cell.alignment = { horizontal: "center", vertical: "middle" };

          if (styles.borderStyle) {
            cell.border = {
              top: styles.borderStyle.top,
              bottom: styles.borderStyle.bottom,
              right: styles.borderStyle.right,
              left: index === 0 ? styles.borderStyle.left : undefined,
            };
          }
        });

        typedData.forEach((record, rowIndex) => {
          const rowData: Record<string, unknown> = {};
          exportColumns.forEach((col) => {
            const key = col.dataIndex as keyof Row<T> & string;
            rowData[key] = formatCellValue(record[key], col);
          });
          const excelRow = worksheet.addRow(rowData);

          exportColumns.forEach((col, colIndex) => {
            const cell = excelRow.getCell(colIndex + 1);

            if (styles.dataFont) cell.font = styles.dataFont;

            if (rowIndex % 2 === 1 && styles.alternateRowFill) {
              cell.fill = styles.alternateRowFill;
            }

            applyCellFormatting(cell, col);

            if (styles.borderStyle) {
              const isLastDataRow = rowIndex === typedData.length - 1;
              cell.border = {
                right: styles.borderStyle.right,
                left: colIndex === 0 ? styles.borderStyle.left : undefined,
                top: styles.borderStyle.top,
                bottom: isLastDataRow ? styles.borderStyle.bottom : undefined,
              };
            }
          });
        });

        worksheet.views = [{ state: "frozen", ySplit: 1 }];

        const buffer = await workbook.xlsx.writeBuffer();
        const sanitizedFileName = sanitizeFileName(fileName);
        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = sanitizedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        toast.success(
          `Excel file "${sanitizedFileName}" downloaded successfully!`
        );
        return {
          fileName: sanitizedFileName,
          rowCount: typedData.length,
          columnCount: exportColumns.length,
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";
        if (
          showToasts &&
          errorMessage !== "No data found for the selected criteria"
        ) {
          toast.error(`Download failed: ${errorMessage}`);
        }
        throw error;
      }
    },
    ...mutationOptions,
  });
}

//================================================================================
// UPLOAD FUNCTIONS
//================================================================================

/**
 * Reads a File object and returns its contents as a 2D array using xlsx.
 * @param file The File object to read.
 * @returns A Promise that resolves to a 2D array of the sheet data.
 */
const parseExcelFile = (file: File): Promise<unknown[][]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (event: ProgressEvent<FileReader>) => {
      try {
        if (!event.target?.result) {
          throw new Error("File reading failed.");
        }
        const buffer = event.target.result as ArrayBuffer;
        const workbook = XLSX.read(buffer, { type: "array" });
        const worksheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[worksheetName];
        if (!worksheet) {
          throw new Error("No worksheet found in the file.");
        }
        // header: 1 tells sheet_to_json to return an array of arrays
        // defval: '' preserves empty cells so column indices stay aligned
        const data = XLSX.utils.sheet_to_json<unknown[]>(worksheet, {
          header: 1,
          defval: "",
        });
        resolve(data);
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = (error) => {
      reject(new Error(`FileReader error: ${error.type}`));
    };

    reader.readAsArrayBuffer(file);
  });
};

//================================================================================
// MAIN ENHANCED UPLOAD HOOK
//================================================================================

/**
 * Enhanced React hook for uploading data from an Excel file to a Supabase table using 'xlsx'.
 * Includes comprehensive logging and error tracking.
 */
export function useExcelUpload<T extends TableName>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  options?: UseExcelUploadOptions<T>
) {
  const {
    showToasts = true,
    batchSize = 500,
    ...mutationOptions
  } = options || {};
  const queryClient = useQueryClient();

  return useMutation<EnhancedUploadResult, Error, UploadOptions<T>>({
    mutationFn: async (
      uploadOptions: UploadOptions<T>
    ): Promise<EnhancedUploadResult> => {
      const {
        file,
        columns,
        uploadType = "upsert",
        conflictColumn,
      } = uploadOptions;

      console.group("🚀 Excel Upload Process Started");
      console.log("📁 File:", file.name, `(${file.size} bytes)`);
      console.log("🎯 Table:", tableName);
      console.log("📋 Upload Type:", uploadType);
      console.log("🔑 Conflict Column:", conflictColumn);
      console.log("📊 Column Mappings:", columns);

      if (uploadType === "upsert" && !conflictColumn) {
        throw new Error(
          "A 'conflictColumn' must be specified for 'upsert' operations."
        );
      }

      const processingLogs: ProcessingLog[] = [];
      const allValidationErrors: ValidationError[] = [];

      toast.info("Reading and parsing Excel file...");

      // 1. Parse the Excel file using our xlsx utility function
      const jsonData = await parseExcelFile(file);

      console.log("📊 Raw Excel Data:", {
        totalRows: jsonData.length,
        headers: jsonData[0],
        sampleData: jsonData.slice(1, 4), // Show first 3 data rows
      });

      if (!jsonData || jsonData.length < 2) {
        toast.warning(
          "No data found in the Excel file. (A header row and at least one data row are required)."
        );
        console.groupEnd();
        return { 
          successCount: 0, 
          errorCount: 0, 
          totalRows: 0, 
          errors: [],
          processingLogs,
          validationErrors: allValidationErrors,
          skippedRows: 0,
        };
      }

      // 2. Map Excel headers to their column index for efficient lookup
      const excelHeaders: string[] = jsonData[0] as string[];
      const headerMap: Record<string, number> = {};
      console.log("📝 Excel Headers:", excelHeaders);
      
      excelHeaders.forEach((header, index) => {
        const cleanHeader = String(header).trim().toLowerCase();
        headerMap[cleanHeader] = index;
        console.log(`   [${index}]: "${header}" -> "${cleanHeader}"`);
      });
      
      const isFirstColumnId =
        String(excelHeaders?.[0] ?? "").toLowerCase() === "id";
      console.log("🆔 First column is ID:", isFirstColumnId);

      // 3. Validate that all required columns from the mapping exist in the file
      const getHeaderIndex = (name: string): number | undefined =>
        headerMap[String(name).trim().toLowerCase()];

      console.group("🔍 Column Mapping Validation");
      for (const mapping of columns) {
        const idx = getHeaderIndex(mapping.excelHeader);
        console.log(`📍 "${mapping.excelHeader}" -> "${mapping.dbKey}":`, 
          idx !== undefined ? `Column ${idx}` : "❌ NOT FOUND");
        
        // Allow missing 'id' header so we can auto-generate UUIDs during processing
        if (idx === undefined && mapping.dbKey !== "id") {
          console.error(`❌ Required column "${mapping.excelHeader}" not found in Excel file`);
          throw new Error(
            `Required column "${mapping.excelHeader}" not found in the Excel file.`
          );
        }
      }
      console.groupEnd();

      toast.info(
        `Found ${jsonData.length - 1} rows. Preparing data for upload...`
      );

      // 4. Process rows and transform data into the format for Supabase
      const dataRows = jsonData.slice(1);

      // Helper: determine if a row is effectively empty (ignoring 'id')
      const isRowEffectivelyEmpty = (row: unknown[]): boolean => {
        for (const mapping of columns) {
          if (mapping.dbKey === "id") continue; // ignore id when checking emptiness
          const idx = getHeaderIndex(mapping.excelHeader);
          const v = idx !== undefined ? row[idx] : undefined;
          if (v !== undefined && String(v).trim() !== "") {
            return false; // has some non-empty value in a non-id column
          }
        }
        return true;
      };

      // Filter out rows that are empty across all non-id columns, keep index for error reporting
      const filteredRows = dataRows
        .map((row, idx) => ({ row: row as unknown[], idx }))
        .filter(({ row }) => !isRowEffectivelyEmpty(row));

      console.log(`🎯 Filtered ${dataRows.length} rows down to ${filteredRows.length} non-empty rows`);

      // Initialize upload result early to record pre-insert validation errors
      const uploadResult: EnhancedUploadResult = {
        successCount: 0,
        errorCount: 0,
        totalRows: 0,
        errors: [],
        processingLogs,
        validationErrors: allValidationErrors,
        skippedRows: 0,
      };

      let recordsToProcess: TableInsert<T>[] = [];

      // Strongly-typed helpers to preserve the link between table name and payload type
      const insertBatch = async <U extends TableName>(
        table: U,
        rows: TableInsert<U>[]
      ) => {
        // Cast to any to avoid generic overload mismatch when U is a wide union at call sites
        return supabase.from(table as any).insert(rows as any);
      };

      const upsertBatch = async <U extends TableName>(
        table: U,
        rows: TableInsert<U>[],
        onConflict: string
      ) => {
        return supabase.from(table as any).upsert(rows as any, { onConflict });
      };

      const upsertOne = async <U extends TableName>(
        table: U,
        row: TableInsert<U>,
        onConflict: string
      ) => {
        return supabase.from(table as any).upsert(row as any, { onConflict });
      };

      console.group("🔄 Row Processing Phase");
      
      for (let i = 0; i < filteredRows.length; i++) {
        const { row, idx } = filteredRows[i];
        const excelRowNumber = idx + 2; // +2 because Excel is 1-indexed and we skip header
        
        const originalData: Record<string, unknown> = {};
        const processedData: Record<string, unknown> = {};
        const rowValidationErrors: ValidationError[] = [];
        let isSkipped = false;
        let skipReason: string | undefined;

        // Build original data object for logging
        excelHeaders.forEach((header, headerIdx) => {
          originalData[header] = row[headerIdx];
        });

        // Secondary safeguard: determine if row has any meaningful non-id value
        const rowHasContent = columns.some((mapping) => {
          if (mapping.dbKey === "id") return false;
          const idx = getHeaderIndex(mapping.excelHeader);
          const v = idx !== undefined ? row[idx] : undefined;
          return v !== undefined && String(v).trim() !== "";
        });

        if (!rowHasContent) {
          // Skip rows that are effectively empty across non-id columns
          isSkipped = true;
          skipReason = "Row is empty across all non-id columns";
          uploadResult.skippedRows++;
          
          const log = logRowProcessing(
            i, 
            excelRowNumber, 
            originalData, 
            processedData, 
            rowValidationErrors, 
            isSkipped, 
            skipReason
          );
          processingLogs.push(log);
          continue;
        }

        // Process each column mapping
        for (const mapping of columns) {
          const colIndex = getHeaderIndex(mapping.excelHeader);
          // Guard: only index row when we have a valid column index
          let rawValue = colIndex !== undefined ? row[colIndex] : undefined;

          console.group(`🔧 Processing "${mapping.dbKey}" (Excel: "${mapping.excelHeader}")`);
          console.log(`📍 Column Index: ${colIndex}`);
          console.log(`📊 Raw Value:`, rawValue, `(${typeof rawValue})`);

          try {
            // Normalize empty strings to null for UUID-like fields
            if (
              (mapping.dbKey === "id" ||
                mapping.dbKey.endsWith("_id") ||
                mapping.dbKey === "parent_id") &&
              (rawValue === "" || rawValue === undefined)
            ) {
              rawValue = null;
              console.log("🔄 Normalized empty UUID field to null");
            }

            // Normalize IP address-like fields for inet columns: trim and empty -> null
            // Targets include: 'ip_address', any key ending with '_ip', or containing 'ipaddr'
            {
              const key = String(mapping.dbKey || "").toLowerCase();
              const isIPField =
                key === "ip_address" ||
                key.endsWith("_ip") ||
                key.includes("ipaddr");
              if (isIPField && typeof rawValue === "string") {
                const trimmed = rawValue.trim();
                rawValue = trimmed === "" ? null : trimmed;
                console.log("🌐 Processed IP field:", rawValue);
              }
            }

            // Only generate a UUID for `id` if the row actually has content
            if (mapping.dbKey === "id" && rowHasContent) {
              // If first Excel column is id/ID and current mapping is for 'id', auto-generate UUID when empty
              if (
                isFirstColumnId &&
                (rawValue === null ||
                  rawValue === undefined ||
                  String(rawValue).trim() === "")
              ) {
                rawValue = generateUUID();
                console.log("🆔 Generated UUID for empty ID:", rawValue);
              }
              // If 'id' header is entirely missing, still generate a UUID
              if (colIndex === undefined) {
                rawValue = generateUUID();
                console.log("🆔 Generated UUID for missing ID column:", rawValue);
              }
            }

            // Use the transform function if available, otherwise use the raw value
            let finalValue: unknown;
            if (mapping.transform) {
              try {
                finalValue = mapping.transform(rawValue);
                console.log("🔧 Transformed value:", finalValue, `(${typeof finalValue})`);
              } catch (transformError) {
                const errorMsg = transformError instanceof Error 
                  ? transformError.message 
                  : "Transform function failed";
                console.error("❌ Transform error:", errorMsg);
                
                const validationError: ValidationError = {
                  rowIndex: i,
                  column: mapping.dbKey,
                  value: rawValue,
                  error: `Transform failed for "${mapping.dbKey}": ${errorMsg}`,
                };
                rowValidationErrors.push(validationError);
                allValidationErrors.push(validationError);
                finalValue = rawValue; // Use raw value as fallback
              }
            } else {
              finalValue = rawValue;
            }

            // Validate the processed value
            const validationError = validateValue(
              finalValue, 
              mapping.dbKey, 
              mapping.required || false
            );
            
            if (validationError) {
              validationError.rowIndex = i;
              rowValidationErrors.push(validationError);
              allValidationErrors.push(validationError);
              console.error("❌ Validation failed:", validationError.error);
            }

            // Assign the processed value to the correct database key
            // Normalize empty strings to null to satisfy numeric/date/inet columns
            let assignValue =
              finalValue !== undefined
                ? finalValue
                : rawValue !== undefined
                ? rawValue
                : null;
            
            if (typeof assignValue === "string" && assignValue.trim() === "") {
              assignValue = null;
              console.log("🧹 Normalized empty string to null");
            }
            
            processedData[mapping.dbKey] = assignValue;
            console.log("✅ Final assigned value:", assignValue, `(${typeof assignValue})`);

            logColumnTransformation(
              i,
              mapping.dbKey,
              rawValue,
              assignValue
            );

          } catch (columnError) {
            const errorMsg = columnError instanceof Error 
              ? columnError.message 
              : "Unknown column processing error";
            console.error("💥 Column processing error:", errorMsg);
            
            const validationError: ValidationError = {
              rowIndex: i,
              column: mapping.dbKey,
              value: rawValue,
              error: `Column processing failed: ${errorMsg}`,
            };
            rowValidationErrors.push(validationError);
            allValidationErrors.push(validationError);
          } finally {
            console.groupEnd();
          }
        }

        // Check if row has validation errors
        const hasRequiredFieldErrors = rowValidationErrors.some(err => 
          err.error.includes("Required field") || err.error.includes("Missing required")
        );

        if (hasRequiredFieldErrors) {
          // Record a validation error for this row and skip it
          isSkipped = true;
          skipReason = `Validation failed: ${rowValidationErrors.map(e => e.error).join("; ")}`;
          uploadResult.errorCount += 1;
          uploadResult.skippedRows++;
          
          uploadResult.errors.push({
            rowIndex: excelRowNumber,
            data: processedData as Record<string, unknown>,
            error: skipReason,
          });
        } else {
          // Add to records to process
          recordsToProcess.push(processedData as TableInsert<T>);
        }

        // Log the complete row processing
        const log = logRowProcessing(
          i,
          excelRowNumber,
          originalData,
          processedData,
          rowValidationErrors,
          isSkipped,
          skipReason
        );
        processingLogs.push(log);
      }
      
      console.groupEnd(); // End Row Processing Phase

      console.log(`📊 Processing Summary:`);
      console.log(`   Total filtered rows: ${filteredRows.length}`);
      console.log(`   Records to process: ${recordsToProcess.length}`);
      console.log(`   Skipped rows: ${uploadResult.skippedRows}`);
      console.log(`   Validation errors: ${allValidationErrors.length}`);

      // Deduplicate by conflict columns to avoid Postgres error:
      // "ON CONFLICT DO UPDATE command cannot affect row a second time"
      if (uploadType === "upsert" && conflictColumn) {
        console.group("🔄 Deduplication Process");
        
        const conflictCols = String(conflictColumn)
          .split(",")
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        console.log("🎯 Conflict columns:", conflictCols);

        if (conflictCols.length > 0) {
          const seen = new Set<string>();
          const deduped: TableInsert<T>[] = [];
          let duplicateCount = 0;
          
          for (const rec of recordsToProcess) {
            const values = conflictCols.map((c) => (rec as Record<string, unknown>)[c]);
            const allPresent = values.every(
              (v) =>
                v !== undefined &&
                v !== null &&
                !(typeof v === "string" && v === "")
            );
            
            if (!allPresent) {
              // Do not dedupe records missing conflict values; still avoid PK updates on composite keys
              if (!conflictCols.includes("id")) {
                delete (rec as Record<string, unknown>).id;
              }
              deduped.push(rec);
              console.log("➕ Added record with missing conflict values (no deduplication)");
              continue;
            }

            // Normalize strings for dedupe to match DB uniqueness (trim + lowercase)
            const normalized = values.map((v) =>
              typeof v === "string" ? v.trim().toLowerCase() : v
            );
            const key = JSON.stringify(normalized);
            
            if (!seen.has(key)) {
              seen.add(key);
              if (!conflictCols.includes("id")) {
                delete (rec as Record<string, unknown>).id;
              }
              deduped.push(rec);
              console.log(`➕ Added unique record with key: ${key}`);
            } else {
              duplicateCount++;
              console.log(`⏭️  Skipped duplicate record with key: ${key}`);
            }
          }
          
          console.log(`📊 Deduplication results:`);
          console.log(`   Original records: ${recordsToProcess.length}`);
          console.log(`   After deduplication: ${deduped.length}`);
          console.log(`   Duplicates removed: ${duplicateCount}`);
          
          recordsToProcess = deduped;
        }
        
        console.groupEnd();
      }

      // 5. Perform batch upload to Supabase
      uploadResult.totalRows = recordsToProcess.length;
      console.log(`🚀 Starting Supabase upload for ${uploadResult.totalRows} records`);

      if (recordsToProcess.length === 0) {
        console.log("⚠️ No records to upload after processing");
        toast.warning("No valid records found to upload after processing.");
        console.groupEnd();
        return uploadResult;
      }

      console.group("📤 Supabase Upload Process");

      for (let i = 0; i < recordsToProcess.length; i += batchSize) {
        const batch = recordsToProcess.slice(i, i + batchSize);
        const progress = Math.round(
          ((i + batch.length) / recordsToProcess.length) * 100
        );
        toast.info(`Uploading batch ${Math.floor(i / batchSize) + 1}... (${progress}%)`);
        
        console.log(`📦 Processing batch ${Math.floor(i / batchSize) + 1}:`);
        console.log(`   Range: ${i} - ${i + batch.length - 1}`);
        console.log(`   Batch size: ${batch.length}`);
        console.log(`   Progress: ${progress}%`);
        console.log("📊 Batch data sample:", batch.slice(0, 2)); // Show first 2 records

        // If using composite conflict keys, upsert rows one-by-one to avoid
        // "ON CONFLICT DO UPDATE command cannot affect row a second time"
        const isCompositeConflict =
          uploadType === "upsert" &&
          conflictColumn &&
          String(conflictColumn).split(",").length > 1;
          
        if (isCompositeConflict) {
          console.log("🔄 Using individual upserts for composite conflict keys");
          
          for (let j = 0; j < batch.length; j++) {
            const row = batch[j];
            console.log(`📝 Upserting individual record ${i + j + 1}:`, row);
            
            try {
              const { error } = await upsertOne(tableName, row as TableInsert<T>, conflictColumn as string);
                
              if (error) {
                console.error(`❌ Individual upsert failed for record ${i + j + 1}:`, error);
                uploadResult.errorCount += 1;
                uploadResult.errors.push({
                  rowIndex: i + j,
                  data: row as Record<string, unknown>,
                  error: error.message,
                });
                if (showToasts) {
                  toast.error(
                    `Error at record ${i + j + 1}: ${error.message}`
                  );
                }
              } else {
                console.log(`✅ Individual upsert successful for record ${i + j + 1}`);
                uploadResult.successCount += 1;
              }
            } catch (unexpectedError) {
              const errorMsg = unexpectedError instanceof Error 
                ? unexpectedError.message 
                : "Unexpected error during individual upsert";
              console.error(`💥 Unexpected error during individual upsert:`, unexpectedError);
              uploadResult.errorCount += 1;
              uploadResult.errors.push({
                rowIndex: i + j,
                data: row as Record<string, unknown>,
                error: errorMsg,
              });
            }
          }
          continue;
        }

        // Regular batch processing
        console.log(`🚀 Executing batch ${uploadType} operation`);
        
        try {
          let query;
          if (uploadType === "insert") {
            console.log("➕ Using INSERT operation");
            query = insertBatch(tableName, batch as TableInsert<T>[]);
          } else {
            console.log(`🔄 Using UPSERT operation with conflict: ${conflictColumn}`);
            query = upsertBatch(tableName, batch as TableInsert<T>[], conflictColumn as string);
          }

          const { error } = await query;
          
          if (error) {
            console.error(`❌ Batch operation failed:`, error);
            uploadResult.errorCount += batch.length;
            uploadResult.errors.push({
              rowIndex: i,
              data: batch,
              error: error.message,
            });
            if (showToasts) {
              toast.error(
                `Error in batch starting at record ${i + 1}: ${error.message}`
              );
            }
          } else {
            console.log(`✅ Batch operation successful for ${batch.length} records`);
            uploadResult.successCount += batch.length;
          }
        } catch (unexpectedError) {
          const errorMsg = unexpectedError instanceof Error 
            ? unexpectedError.message 
            : "Unexpected error during batch operation";
          console.error(`💥 Unexpected error during batch operation:`, unexpectedError);
          uploadResult.errorCount += batch.length;
          uploadResult.errors.push({
            rowIndex: i,
            data: batch,
            error: errorMsg,
          });
        }
      }
      
      console.groupEnd(); // End Supabase Upload Process

      // 6. Finalize and report
      console.group("📊 Upload Results Summary");
      console.log(`✅ Successful uploads: ${uploadResult.successCount}`);
      console.log(`❌ Failed uploads: ${uploadResult.errorCount}`);
      console.log(`⏭️  Skipped rows: ${uploadResult.skippedRows}`);
      console.log(`📝 Total processing logs: ${processingLogs.length}`);
      console.log(`⚠️  Total validation errors: ${allValidationErrors.length}`);
      
      if (uploadResult.errors.length > 0) {
        console.log("🔍 Upload errors:", uploadResult.errors);
      }
      
      if (allValidationErrors.length > 0) {
        console.log("🔍 Validation errors:", allValidationErrors);
      }
      console.groupEnd();

      if (uploadResult.errorCount > 0) {
        if (showToasts) {
          toast.warning(
            `${uploadResult.successCount} rows uploaded successfully, but ${uploadResult.errorCount} failed. Check console for details.`
          );
        }
      } else {
        if (showToasts) {
          toast.success(
            `Successfully uploaded ${uploadResult.successCount} of ${uploadResult.totalRows} records.`
          );
        }
        
        // Invalidate related queries instead of reloading the page to preserve UI state
        try {
          await queryClient.invalidateQueries({
            predicate: (q) => {
              const key = q.queryKey as unknown[];
              return Array.isArray(key) && key.includes(tableName);
            },
          });
          console.log("✅ Query cache invalidated successfully");
        } catch (err) {
          console.warn("⚠️ Failed to invalidate queries after upload", err);
        }
      }

      console.groupEnd(); // End Excel Upload Process
      return uploadResult;
    },
    ...mutationOptions,
  });
}