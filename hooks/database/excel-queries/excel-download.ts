
import { TableOrViewName, isTableName, Row, ViewName, PublicTableName, PublicTableOrViewName } from "@/hooks/database/queries-type-helpers";
import * as ExcelJS from "exceljs";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { useMutation } from "@tanstack/react-query";
import { applyCellFormatting, convertFiltersToRPCParams, DownloadOptions, ExcelDownloadResult, formatCellValue, getDefaultStyles, RPCConfig, sanitizeFileName, UseExcelDownloadOptions } from "@/hooks/database/excel-queries/excel-helpers";
import { toast } from "sonner";
import { applyFilters } from "@/hooks/database/utility-functions";

// Extended types for new functionality
interface OrderByOption {
column: string;
ascending?: boolean;
}

interface EnhancedDownloadOptions<T extends TableOrViewName> extends DownloadOptions<T> {
orderBy?: OrderByOption[];
wrapText?: boolean;
autoFitColumns?: boolean;
}

interface EnhancedUseExcelDownloadOptions<T extends TableOrViewName> extends UseExcelDownloadOptions<T> {
defaultOrderBy?: OrderByOption[];
defaultWrapText?: boolean;
defaultAutoFitColumns?: boolean;
}

// Hook for RPC-based downloads with full type safety
export function useRPCExcelDownload<T extends TableOrViewName>(
  supabase: SupabaseClient<Database>,
  options?: EnhancedUseExcelDownloadOptions<T>
) {
  const {
    showToasts = true,
    batchSize = 50000,
    defaultOrderBy,
    defaultWrapText = true,
    defaultAutoFitColumns = true,
    ...mutationOptions
  } = options || {};

  return useMutation<
    ExcelDownloadResult,
    Error,
    EnhancedDownloadOptions<T> & { rpcConfig: RPCConfig }
  >({
    mutationFn: async (downloadOptions): Promise<ExcelDownloadResult> => {
      try {
        const defaultStyles = getDefaultStyles();
        const mergedOptions = {
          sheetName: "Data",
          maxRows: batchSize,
          customStyles: defaultStyles,
          orderBy: defaultOrderBy,
          wrapText: defaultWrapText,
          autoFitColumns: defaultAutoFitColumns,
          ...downloadOptions,
        };

        const {
          fileName = `export-${new Date().toISOString().split("T")[0]}.xlsx`,
          filters,
          columns,
          sheetName,
          maxRows,
          rpcConfig,
          orderBy,
          wrapText,
          autoFitColumns,
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

        // Add ordering parameters to RPC if supported
        if (orderBy && orderBy.length > 0) {
          rpcParams.order_by = orderBy.map(order => 
            `${order.column}.${order.ascending !== false ? 'asc' : 'desc'}`
          ).join(',');
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
        let dataArray = Array.isArray(data) ? data : [data];
        
        // Apply client-side ordering if RPC doesn't support it
        if (orderBy && orderBy.length > 0) {
          dataArray = dataArray.sort((a, b) => {
            for (const order of orderBy) {
              // Safe property access with type guards
              const aVal = (a && typeof a === 'object' && !Array.isArray(a)) 
                ? (a as Record<string, unknown>)[order.column] 
                : undefined;
              const bVal = (b && typeof b === 'object' && !Array.isArray(b)) 
                ? (b as Record<string, unknown>)[order.column] 
                : undefined;
              
              if (aVal === bVal) continue;
              
              let comparison = 0;
              if (aVal == null && bVal != null) comparison = 1;
              else if (aVal != null && bVal == null) comparison = -1;
              else if (aVal != null && bVal != null) {
                if (aVal < bVal) comparison = -1;
                else if (aVal > bVal) comparison = 1;
              }
              
              return order.ascending !== false ? comparison : -comparison;
            }
            return 0;
          });
        }
        
        toast.success(
          `Fetched ${dataArray.length} records. Generating Excel file...`
        );

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName || "Data");

        // Set column properties with enhanced options
        worksheet.columns = exportColumns.map((col) => ({
          key: String(col.dataIndex),
          width: typeof col.width === "number" ? col.width / 8 : 20,
        }));

        // Add header row with enhanced styling
        const headerTitles = exportColumns.map((col) => col.title);
        const headerRow = worksheet.addRow(headerTitles);
        headerRow.height = 25;

        exportColumns.forEach((col, index) => {
          const cell = headerRow.getCell(index + 1);
          if (styles.headerFont) cell.font = styles.headerFont;
          if (styles.headerFill) cell.fill = styles.headerFill;
          
          // Enhanced header alignment with text wrapping
          cell.alignment = { 
            horizontal: "center", 
            vertical: "middle",
            wrapText: wrapText || false
          };

          if (styles.borderStyle) {
            cell.border = {
              top: styles.borderStyle.top,
              bottom: styles.borderStyle.bottom,
              right: styles.borderStyle.right,
              left: index === 0 ? styles.borderStyle.left : undefined,
            };
          }
        });

        // Add data rows with enhanced styling
        dataArray.forEach((record, rowIndex: number) => {
          // Ensure we only process object-like rows
          if (record === null || typeof record !== "object" || Array.isArray(record)) {
            return; // skip non-object rows
          }

          const obj = record as Record<string, unknown>;
          const rowData: Record<string, unknown> = {};
          exportColumns.forEach((col) => {
            const key = String(col.dataIndex);
            const value = obj[key];
            rowData[key] = formatCellValue(value, col);
          });
          const excelRow = worksheet.addRow(rowData);

          // Enhanced cell styling with wrap text support
          exportColumns.forEach((col, colIndex) => {
            const cell = excelRow.getCell(colIndex + 1);

            if (styles.dataFont) cell.font = styles.dataFont;

            if (rowIndex % 2 === 1 && styles.alternateRowFill) {
              cell.fill = styles.alternateRowFill;
            }

            // Apply text wrapping and alignment
            cell.alignment = {
              ...cell.alignment,
              wrapText: wrapText || false,
              vertical: 'top' // Better for wrapped text
            };

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

        // Auto-fit columns if enabled
        if (autoFitColumns) {
          exportColumns.forEach((col, index) => {
            const column = worksheet.getColumn(index + 1);
            let maxLength = col.title.length;
            
            // Calculate max content length for auto-fitting
            dataArray.forEach((record) => {
              if (record && typeof record === "object" && !Array.isArray(record)) {
                const obj = record as Record<string, unknown>;
                const key = String(col.dataIndex);
                const value = obj[key];
                const cellText = String(formatCellValue(value, col) || '');
                
                // For wrapped text, consider line breaks
                if (wrapText) {
                  const lines = cellText.split('\n');
                  const maxLineLength = Math.max(...lines.map(line => line.length));
                  maxLength = Math.max(maxLength, maxLineLength);
                } else {
                  maxLength = Math.max(maxLength, cellText.length);
                }
              }
            });
            
            // Set reasonable bounds for column width
            const calculatedWidth = Math.min(Math.max(maxLength + 2, 10), 50);
            column.width = calculatedWidth;
          });
        }

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

// Hook for traditional table/view downloads with enhanced features
export function useTableExcelDownload<T extends PublicTableOrViewName>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  options?: EnhancedUseExcelDownloadOptions<T>
) {
  const {
    showToasts = true,
    batchSize = 50000,
    defaultOrderBy,
    defaultWrapText = true,
    defaultAutoFitColumns = true,
    ...mutationOptions
  } = options || {};

  return useMutation<
    ExcelDownloadResult,
    Error,
    Omit<EnhancedDownloadOptions<T>, "rpcConfig">
  >({
    mutationFn: async (downloadOptions): Promise<ExcelDownloadResult> => {
      try {
        const defaultStyles = getDefaultStyles();
        const mergedOptions = {
          sheetName: "Data",
          maxRows: batchSize,
          customStyles: defaultStyles,
          orderBy: defaultOrderBy,
          wrapText: defaultWrapText,
          autoFitColumns: defaultAutoFitColumns,
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
          orderBy,
          wrapText,
          autoFitColumns,
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
          ? supabase.from(tableName as PublicTableName).select(selectFields)
          : supabase.from(tableName as ViewName).select(selectFields);

        if (filters) query = applyFilters(query, filters);
        
        // Apply ordering to the Supabase query
        if (orderBy && orderBy.length > 0) {
          orderBy.forEach(order => {
            query = query.order(order.column, { ascending: order.ascending !== false });
          });
        }
        
        if (maxRows) query = query.limit(maxRows);

        const { data, error } = await query;

        if (error) throw new Error(`Failed to fetch data: ${error.message}`);
        if (!data || data.length === 0)
          throw new Error("No data found for the selected criteria");

        const typedData = data as Row<T>[];
        toast.success(
          `Fetched ${typedData.length} records. Generating Excel file...`
        );

        // Excel generation logic with enhanced features
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName || "Data");

        worksheet.columns = exportColumns.map((col) => ({
          key: String(col.dataIndex),
          width: typeof col.width === "number" ? col.width / 8 : 20,
        }));

        const headerTitles = exportColumns.map((col) => col.title);
        const headerRow = worksheet.addRow(headerTitles);
        headerRow.height = wrapText ? 30 : 25; // Increase height for wrapped text

        exportColumns.forEach((col, index) => {
          const cell = headerRow.getCell(index + 1);
          if (styles.headerFont) cell.font = styles.headerFont;
          if (styles.headerFill) cell.fill = styles.headerFill;
          
          // Enhanced header alignment with text wrapping
          cell.alignment = { 
            horizontal: "center", 
            vertical: "middle",
            wrapText: wrapText || false
          };

          if (styles.borderStyle) {
            cell.border = {
              top: styles.borderStyle.top,
              bottom: styles.borderStyle.bottom,
              right: styles.borderStyle.right,
              left: index === 0 ? styles.borderStyle.left : undefined,
            };
          }
        });

        // Add data rows with enhanced styling
        typedData.forEach((record, rowIndex) => {
          const rowData: Record<string, unknown> = {};
          exportColumns.forEach((col) => {
            const key = col.dataIndex as keyof Row<T> & string;
            rowData[key] = formatCellValue(record[key], col);
          });
          const excelRow = worksheet.addRow(rowData);
          
          // Set row height for wrapped text
          if (wrapText) {
            excelRow.height = 20; // Minimum height, will auto-expand
          }

          exportColumns.forEach((col, colIndex) => {
            const cell = excelRow.getCell(colIndex + 1);

            if (styles.dataFont) cell.font = styles.dataFont;

            if (rowIndex % 2 === 1 && styles.alternateRowFill) {
              cell.fill = styles.alternateRowFill;
            }

            // Apply text wrapping and alignment
            cell.alignment = {
              ...cell.alignment,
              wrapText: wrapText || false,
              vertical: 'top' // Better for wrapped text
            };

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

        // Auto-fit columns if enabled
        if (autoFitColumns) {
          exportColumns.forEach((col, index) => {
            const column = worksheet.getColumn(index + 1);
            let maxLength = col.title.length;
            
            // Calculate max content length for auto-fitting
            typedData.forEach((record) => {
              const key = col.dataIndex as keyof Row<T> & string;
              const value = record[key];
              const cellText = String(formatCellValue(value, col) || '');
              
              // For wrapped text, consider line breaks
              if (wrapText) {
                const lines = cellText.split('\n');
                const maxLineLength = Math.max(...lines.map(line => line.length));
                maxLength = Math.max(maxLength, maxLineLength);
              } else {
                maxLength = Math.max(maxLength, cellText.length);
              }
            });
            
            // Set reasonable bounds for column width
            const calculatedWidth = Math.min(Math.max(maxLength + 2, 10), wrapText ? 30 : 50);
            column.width = calculatedWidth;
          });
        }

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
