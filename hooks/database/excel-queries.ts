// hooks/database/excel-queries.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { SupabaseClient } from "@supabase/supabase-js";
import * as ExcelJS from "exceljs";
import { toast } from "sonner";
import { Database } from "@/types/supabase-types";
import { Filters, TableInsert, UploadOptions, UploadResult, UseExcelUploadOptions, applyFilters } from "@/hooks/database";
import { TableName, ViewName, AuthTableOrViewName, isTableName, Row } from "@/hooks/database";
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
  render?: (value: any, record: T, index: number) => React.ReactNode;
  filterOptions?: { label: string; value: unknown }[];
  align?: "left" | "center" | "right";
  hidden?: boolean;
  excelFormat?: "text" | "number" | "date" | "currency" | "percentage";
  excludeFromExport?: boolean;
}

// NEW: Generic RPC Configuration that works with any function
export interface RPCConfig<TParams = Record<string, any>> {
  functionName: string;
  parameters?: TParams;
  selectFields?: string;
}

// NOTE: T refers to a table/view name. Columns should describe a Row<T>.
export interface DownloadOptions<T extends AuthTableOrViewName = any> {
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

export interface UseExcelDownloadOptions<T extends AuthTableOrViewName = any> {
  onSuccess?: (data: ExcelDownloadResult, variables: DownloadOptions<T>) => void;
  onError?: (error: Error, variables: DownloadOptions<T>) => void;
  showToasts?: boolean;
  batchSize?: number;
  defaultRPCConfig?: RPCConfig;
}

//================================================================================
// UTILITY FUNCTIONS
//================================================================================

export const createFillPattern = (color: string): ExcelJS.FillPattern => ({
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: color },
});

export const formatCellValue = <T = any>(value: unknown, column: Column<T>): unknown => {
  if (value === null || value === undefined) return "";
  switch (column.excelFormat) {
    case "date":
      return value instanceof Date ? value : new Date(value as string);
    case "number":
      return typeof value === "string" ? parseFloat(value) || 0 : value;
    case "currency":
      return typeof value === "string" ? parseFloat(value.replace(/[^0-9.-]/g, "")) || 0 : value;
    case "percentage":
      return typeof value === "number" ? value / 100 : parseFloat(String(value)) / 100 || 0;
    default:
      return String(value);
  }
};

export const applyCellFormatting = <T = any>(cell: ExcelJS.Cell, column: Column<T>): void => {
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
  borderStyle: { top: { style: "thin" }, left: { style: "thin" }, bottom: { style: "thin" }, right: { style: "thin" } },
});

export const sanitizeFileName = (fileName: string): string => {
  return fileName.replace(/[^a-z0-9.-]/gi, "_").replace(/_{2,}/g, "_");
};

export const convertFiltersToRPCParams = (filters?: Filters): Record<string, any> => {
  if (!filters) return {};
  
  const rpcParams: Record<string, any> = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      rpcParams[key] = value;
    }
  });
  
  return rpcParams;
};

// Safe UUID generator: uses crypto.randomUUID if available, otherwise a lightweight fallback
const generateUUID = (): string => {
  const g = (globalThis as any);
  if (g && g.crypto && typeof g.crypto.randomUUID === 'function') {
    return g.crypto.randomUUID();
  }
  // RFC4122 version 4 fallback
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

//================================================================================
// MAIN HOOKS
//================================================================================

// Hook for RPC-based downloads with full type safety
export function useRPCExcelDownload<T extends AuthTableOrViewName>(
  supabase: SupabaseClient<Database>,
  options?: UseExcelDownloadOptions<T>
) {
  const { showToasts = true, batchSize = 50000, ...mutationOptions } = options || {};

  return useMutation<ExcelDownloadResult, Error, DownloadOptions<T> & { rpcConfig: RPCConfig }>({
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
          rpcConfig 
        } = mergedOptions;
        
        const styles = { ...defaultStyles, ...mergedOptions.customStyles };

        if (!columns || columns.length === 0) throw new Error("No columns specified for export");
        if (!rpcConfig) throw new Error("RPC configuration is required for this hook");

        const exportColumns = columns.filter((col) => !col.excludeFromExport);
        if (exportColumns.length === 0) throw new Error("All columns are excluded from export");

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
        const { data, error } = await supabase.rpc(rpcConfig.functionName as any, rpcParams);

        if (error) throw new Error(`RPC call failed: ${error.message}`);
        if (!data || (Array.isArray(data) && data.length === 0)) {
          throw new Error("No data returned from RPC function");
        }

        // Ensure data is an array
        const dataArray = Array.isArray(data) ? data : [data];
        toast.success(`Fetched ${dataArray.length} records. Generating Excel file...`);

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
        dataArray.forEach((record: any, rowIndex: number) => {
          const rowData: Record<string, unknown> = {};
          exportColumns.forEach((col) => {
            const value = record[col.dataIndex];
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
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
        });
        
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = sanitizedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        toast.success(`Excel file "${sanitizedFileName}" downloaded successfully!`);
        return { 
          fileName: sanitizedFileName, 
          rowCount: dataArray.length, 
          columnCount: exportColumns.length 
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
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
  const { showToasts = true, batchSize = 50000, ...mutationOptions } = options || {};

  return useMutation<ExcelDownloadResult, Error, Omit<DownloadOptions<T>, 'rpcConfig'>>({
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
          fileName = `${String(tableName)}-${new Date().toISOString().split("T")[0]}.xlsx`, 
          filters, 
          columns, 
          sheetName, 
          maxRows 
        } = mergedOptions;
        
        const styles = { ...defaultStyles, ...mergedOptions.customStyles };

        if (!columns || columns.length === 0) throw new Error("No columns specified for export");
        const exportColumns = columns.filter((col) => !col.excludeFromExport);
        if (exportColumns.length === 0) throw new Error("All columns are excluded from export");

        toast.info("Fetching data for download...");

        const selectFields = exportColumns.map((col) => col.dataIndex).join(",");
        let query = isTableName(tableName) 
          ? supabase.from(tableName as TableName).select(selectFields)
          : supabase.from(tableName as ViewName).select(selectFields);

        if (filters) query = applyFilters(query, filters);
        if (maxRows) query = query.limit(maxRows);

        const { data, error } = await query;

        if (error) throw new Error(`Failed to fetch data: ${error.message}`);
        if (!data || data.length === 0) throw new Error("No data found for the selected criteria");

        const typedData = data as Row<T>[];
        toast.success(`Fetched ${typedData.length} records. Generating Excel file...`);

        // Excel generation logic (same as before)
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName || "Data");

        worksheet.columns = exportColumns.map((col) => ({
          key: String(col.dataIndex),  // Convert to string to ensure type safety
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
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" 
        });
        
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = sanitizedFileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);

        toast.success(`Excel file "${sanitizedFileName}" downloaded successfully!`);
        return { 
          fileName: sanitizedFileName, 
          rowCount: typedData.length, 
          columnCount: exportColumns.length 
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        if (showToasts && errorMessage !== "No data found for the selected criteria") {
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

//================================================================================
// UTILITY FUNCTIONS
//================================================================================

/**
 * Reads a File object and returns its contents as a 2D array using xlsx.
 * @param file The File object to read.
 * @returns A Promise that resolves to a 2D array of the sheet data.
 */
const parseExcelFile = (file: File): Promise<any[][]> => {
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
        const data = XLSX.utils.sheet_to_json<any[]>(worksheet, { header: 1, defval: '' });
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
// MAIN HOOK
//================================================================================

/**
 * A React hook for uploading data from an Excel file to a Supabase table using 'xlsx'.
 */
export function useExcelUpload<T extends TableName>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  options?: UseExcelUploadOptions<T>
) {
  const { showToasts = true, batchSize = 500, ...mutationOptions } = options || {};
  const queryClient = useQueryClient();

  return useMutation<UploadResult, Error, UploadOptions<T>>({
    mutationFn: async (uploadOptions: UploadOptions<T>): Promise<UploadResult> => {
      const { file, columns, uploadType = "upsert", conflictColumn } = uploadOptions;

      if (uploadType === "upsert" && !conflictColumn) {
        throw new Error("A 'conflictColumn' must be specified for 'upsert' operations.");
      }

      toast.info("Reading and parsing Excel file...");

      // 1. Parse the Excel file using our xlsx utility function
      const jsonData = await parseExcelFile(file);

      console.log("jsonData", jsonData);
      

      if (!jsonData || jsonData.length < 2) {
        toast.warning("No data found in the Excel file. (A header row and at least one data row are required).");
        return { successCount: 0, errorCount: 0, totalRows: 0, errors: [] };
      }

      // 2. Map Excel headers to their column index for efficient lookup
      const excelHeaders: string[] = jsonData[0];
      const headerMap: Record<string, number> = {};
      // console.log("Excel Headers:", excelHeaders);
      excelHeaders.forEach((header, index) => {
        headerMap[String(header).trim().toLowerCase()] = index;
      });
      const isFirstColumnId = String(excelHeaders?.[0] ?? '').toLowerCase() === 'id';

      // 3. Validate that all required columns from the mapping exist in the file
      const getHeaderIndex = (name: string): number | undefined =>
        headerMap[String(name).trim().toLowerCase()];

      for (const mapping of columns) {
        const idx = getHeaderIndex(mapping.excelHeader);
        // Allow missing 'id' header so we can auto-generate UUIDs during processing
        if (idx === undefined && mapping.dbKey !== 'id') {
          throw new Error(`Required column "${mapping.excelHeader}" not found in the Excel file.`);
        }
      }

      toast.info(`Found ${jsonData.length - 1} rows. Preparing data for upload...`);

      // 4. Process rows and transform data into the format for Supabase
      const dataRows = jsonData.slice(1);

      // Helper: determine if a row is effectively empty (ignoring 'id')
      const isRowEffectivelyEmpty = (row: any[]): boolean => {
        for (const mapping of columns) {
          if (mapping.dbKey === 'id') continue; // ignore id when checking emptiness
          const idx = getHeaderIndex(mapping.excelHeader);
          const v = idx !== undefined ? row[idx] : undefined;
          if (v !== undefined && String(v).trim() !== '') {
            return false; // has some non-empty value in a non-id column
          }
        }
        return true;
      };

      // Filter out rows that are empty across all non-id columns, keep index for error reporting
      const filteredRows = dataRows
        .map((row, idx) => ({ row, idx }))
        .filter(({ row }) => !isRowEffectivelyEmpty(row));

      // Initialize upload result early to record pre-insert validation errors
      const uploadResult: UploadResult = {
        successCount: 0,
        errorCount: 0,
        totalRows: 0,
        errors: [],
      };

      let recordsToProcess = filteredRows
        .map(({ row, idx }): TableInsert<T> | null => {
          const record: Partial<TableInsert<T>> = {};
          let missingRequired = false;
          const missingFields: string[] = [];

          // Secondary safeguard: determine if row has any meaningful non-id value
          const rowHasContent = columns.some((mapping) => {
            if (mapping.dbKey === 'id') return false;
            const idx = getHeaderIndex(mapping.excelHeader);
            const v = idx !== undefined ? row[idx] : undefined;
            return v !== undefined && String(v).trim() !== '';
          });

          if (!rowHasContent) {
            // Skip rows that are effectively empty across non-id columns
            return null;
          }

          columns.forEach((mapping) => {
            const colIndex = getHeaderIndex(mapping.excelHeader);
            // Guard: only index row when we have a valid column index
            let rawValue = colIndex !== undefined ? row[colIndex] : undefined;
            
            // Normalize empty strings to null for UUID-like fields
            if ((mapping.dbKey === 'id' || mapping.dbKey.endsWith('_id') || mapping.dbKey === 'parent_id') && (rawValue === '' || rawValue === undefined)) {
              rawValue = null;
            }

            // Normalize IP address-like fields for inet columns: trim and empty -> null
            // Targets include: 'ip_address', any key ending with '_ip', or containing 'ipaddr'
            {
              const key = String(mapping.dbKey || '').toLowerCase();
              const isIPField = key === 'ip_address' || key.endsWith('_ip') || key.includes('ipaddr');
              if (isIPField && typeof rawValue === 'string') {
                const trimmed = rawValue.trim();
                rawValue = trimmed === '' ? null : trimmed;
              }
            }

            // Only generate a UUID for `id` if the row actually has content
            if (mapping.dbKey === 'id' && rowHasContent) {
              // If first Excel column is id/ID and current mapping is for 'id', auto-generate UUID when empty
              if (isFirstColumnId && (rawValue === null || rawValue === undefined || String(rawValue).trim() === '')) {
                rawValue = generateUUID();
              }
              // If 'id' header is entirely missing, still generate a UUID
              if (colIndex === undefined) {
                rawValue = generateUUID();
              }
            }

            // Use the transform function if available, otherwise use the raw value
            const finalValue = mapping.transform ? mapping.transform(rawValue) : rawValue;

            // Validate required fields: after transform, value must not be empty
            if (mapping.required) {
              const isEmpty =
                finalValue === null ||
                finalValue === undefined ||
                (typeof finalValue === 'string' && finalValue.trim() === '');
              if (isEmpty) {
                missingRequired = true;
                missingFields.push(mapping.dbKey);
              }
            }

            // Assign the processed value to the correct database key
            // Normalize empty strings to null to satisfy numeric/date/inet columns
            let assignValue = finalValue !== undefined ? finalValue : (rawValue !== undefined ? rawValue : null);
            if (typeof assignValue === 'string' && assignValue.trim() === '') {
              assignValue = null;
            }
            (record as any)[mapping.dbKey] = assignValue;
          });

          if (missingRequired) {
            // Record a validation error for this row and skip it
            uploadResult.errorCount += 1;
            uploadResult.errors.push({
              rowIndex: idx + 2,
              data: record as any,
              error: `Missing required field(s): ${missingFields.join(', ')}`,
            });
            return null;
          }

          return record as TableInsert<T>;
        })
        .filter((r): r is TableInsert<T> => r !== null);

      // Deduplicate by conflict columns to avoid Postgres error:
      // "ON CONFLICT DO UPDATE command cannot affect row a second time"
      if (uploadType === 'upsert' && conflictColumn) {
        const conflictCols = String(conflictColumn)
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s.length > 0);

        if (conflictCols.length > 0) {
          const seen = new Set<string>();
          const deduped: TableInsert<T>[] = [];
          for (const rec of recordsToProcess) {
            const values = conflictCols.map((c) => (rec as any)[c]);
            const allPresent = values.every((v) => v !== undefined && v !== null && !(typeof v === 'string' && v === ''));
            if (!allPresent) {
              // Do not dedupe records missing conflict values; still avoid PK updates on composite keys
              if (!conflictCols.includes('id')) {
                delete (rec as any).id;
              }
              deduped.push(rec);
              continue;
            }

            // Normalize strings for dedupe to match DB uniqueness (trim + lowercase)
            const normalized = values.map((v) => typeof v === 'string' ? v.trim().toLowerCase() : v);
            const key = JSON.stringify(normalized);
            if (!seen.has(key)) {
              seen.add(key);
              if (!conflictCols.includes('id')) {
                delete (rec as any).id;
              }
              deduped.push(rec);
            }
          }
          recordsToProcess = deduped;
        }
      }


      // 5. Perform batch upload to Supabase (This logic is identical to the previous version)
      uploadResult.totalRows = recordsToProcess.length;
      
      for (let i = 0; i < recordsToProcess.length; i += batchSize) {
        const batch = recordsToProcess.slice(i, i + batchSize);
        const progress = Math.round(((i + batch.length) / recordsToProcess.length) * 100);
        toast.info(`Uploading batch... (${progress}%)`);

        // If using composite conflict keys, upsert rows one-by-one to avoid
        // "ON CONFLICT DO UPDATE command cannot affect row a second time"
        const isCompositeConflict = uploadType === 'upsert' && conflictColumn && String(conflictColumn).split(',').length > 1;
        if (isCompositeConflict) {
          for (let j = 0; j < batch.length; j++) {
            const row = batch[j];
            console.log('[ExcelUpload] Upserting single row (composite conflict)', {
              tableName,
              rowIndex: i + j,
              conflictColumn,
              uploadType,
              keys: Object.keys(row || {})
            });
            const { error } = await supabase
              .from(tableName)
              .upsert(row as any, { onConflict: conflictColumn as string });
            if (error) {
              console.error('[ExcelUpload] Row error (composite conflict)', {
                code: (error as any).code,
                message: error.message,
                details: (error as any).details,
                hint: (error as any).hint,
                rowIndex: i + j,
                tableName,
                conflictColumn,
                uploadType
              });
              uploadResult.errorCount += 1;
              uploadResult.errors.push({ rowIndex: i + j, data: row as any, error: error.message });
              if (showToasts) {
                toast.error(`Error at Excel row ${i + j + 2}: ${error.message}`);
              }
            } else {
              uploadResult.successCount += 1;
            }
          }
          continue;
        }

        // Simple insert/upsert for non-composite conflicts
        console.log('[ExcelUpload] Executing batch', {
          tableName,
          uploadType,
          conflictColumn,
          batchStart: i,
          batchSize: batch.length,
          sampleRow: batch[0]
        });
        let query;
        if (uploadType === 'insert') {
          query = supabase.from(tableName).insert(batch as any);
        } else {
          query = supabase.from(tableName).upsert(batch as any, { onConflict: conflictColumn as string });
        }

        const { error } = await query;
        if (error) {
          console.error('[ExcelUpload] Batch error', {
            code: (error as any).code,
            message: error.message,
            details: (error as any).details,
            hint: (error as any).hint,
            tableName,
            batchStart: i,
            batchSize: batch.length,
            conflictColumn,
            uploadType,
            sampleRowKeys: Object.keys(batch[0] || {})
          });
          uploadResult.errorCount += batch.length;
          uploadResult.errors.push({ rowIndex: i, data: batch, error: error.message });
          if (showToasts) {
            toast.error(`Error in batch starting at Excel row ${i + 2}: ${error.message}`);
          }
        } else {
          uploadResult.successCount += batch.length;
        }
      }

      // 6. Finalize and report
      if (uploadResult.errorCount > 0) {
        if (showToasts) {
          toast.warning(`${uploadResult.successCount} rows uploaded, but ${uploadResult.errorCount} failed.`);
        }
      } else {
        if (showToasts) {
          toast.success(`Successfully uploaded ${uploadResult.successCount} of ${uploadResult.totalRows} records.`);
        }
        // Invalidate related queries instead of reloading the page to preserve UI state
        try {
          await queryClient.invalidateQueries({
            predicate: (q) => {
              const key = q.queryKey as unknown as any[];
              return Array.isArray(key) && key.includes(tableName);
            },
          });
        } catch (err) {
          console.warn("Failed to invalidate queries after upload", err);
        }
      }

      return uploadResult;
    },
    ...mutationOptions,
  });
}