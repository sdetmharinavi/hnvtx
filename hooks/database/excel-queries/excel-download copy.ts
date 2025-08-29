import { AuthTableOrViewName, isTableName, Row, TableName, ViewName } from "../queries-type-helpers";
import * as ExcelJS from "exceljs";
import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/types/supabase-types";
import { useMutation } from "@tanstack/react-query";
import { applyCellFormatting, convertFiltersToRPCParams, DownloadOptions, ExcelDownloadResult, formatCellValue, getDefaultStyles, RPCConfig, sanitizeFileName, UseExcelDownloadOptions } from "./excel-helpers";
import { toast } from "sonner";
import { applyFilters } from "../utility-functions";

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
  