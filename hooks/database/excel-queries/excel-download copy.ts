// path: hooks/database/excel-queries/excel-download.ts

import {
  TableOrViewName,
  isTableName,
  Row,
  ViewName,
  PublicTableName,
  PublicTableOrViewName,
} from '@/hooks/database/queries-type-helpers';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/supabase-types';
import { useMutation } from '@tanstack/react-query';
import {
  applyCellFormatting,
  convertFiltersToRPCParams,
  DownloadOptions,
  ExcelDownloadResult,
  formatCellValue,
  getDefaultStyles,
  RPCConfig,
  sanitizeFileName,
  UseExcelDownloadOptions,
} from '@/hooks/database/excel-queries/excel-helpers';
import { toast } from 'sonner';
import { applyFilters } from '@/hooks/database/utility-functions';
import { sanitizeSheetFileName } from '@/utils/formatters';

interface OrderByOption {
  column: string;
  ascending?: boolean;
}

interface EnhancedDownloadOptions<T extends TableOrViewName> extends DownloadOptions<T> {
  orderBy?: OrderByOption[];
  wrapText?: boolean;
  autoFitColumns?: boolean;
}

interface EnhancedUseExcelDownloadOptions<T extends TableOrViewName>
  extends UseExcelDownloadOptions<T> {
  defaultOrderBy?: OrderByOption[];
  defaultWrapText?: boolean;
  defaultAutoFitColumns?: boolean;
}

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
      const ExcelJS = (await import('exceljs')).default;
      try {
        const defaultStyles = getDefaultStyles();
        const mergedOptions = {
          sheetName: 'Data',
          maxRows: batchSize,
          customStyles: defaultStyles,
          orderBy: defaultOrderBy,
          wrapText: defaultWrapText,
          autoFitColumns: defaultAutoFitColumns,
          ...downloadOptions,
        };

        const {
          fileName = `export-${new Date().toISOString().split('T')[0]}.xlsx`,
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

        if (!columns || columns.length === 0) throw new Error('No columns specified for export');
        const exportColumns = columns.filter((col) => !col.excludeFromExport);
        if (exportColumns.length === 0) throw new Error('All columns are excluded from export');

        toast.info('Fetching data via RPC...');

        const rpcParams: Record<string, unknown> = {
          ...rpcConfig.parameters,
          ...convertFiltersToRPCParams(filters),
        };

        if (maxRows) {
          rpcParams.row_limit = maxRows;
        }

        if (orderBy && orderBy.length > 0) {
          rpcParams.order_by = orderBy
            .map((order) => `${order.column}.${order.ascending !== false ? 'asc' : 'desc'}`)
            .join(',');
        }

        const { data, error } = await supabase.rpc(
          rpcConfig.functionName as keyof Database['public']['Functions'],
          rpcParams
        );

        if (error) throw new Error(`RPC call failed: ${error.message}`);

        let dataArray: unknown[] = [];
        if (data) {
          if (Array.isArray(data)) {
            dataArray = data;
          } else if (
            typeof data === 'object' &&
            'data' in data &&
            Array.isArray((data as { data: unknown[] }).data)
          ) {
            dataArray = (data as { data: unknown[] }).data;
          } else if (typeof data === 'object' && data !== null) {
            dataArray = [data];
          }
        }

        if (dataArray.length === 0) {
          toast.info('No data found for the selected criteria to export.');
          return {
            fileName: sanitizeSheetFileName(fileName),
            rowCount: 0,
            columnCount: exportColumns.length,
          };
        }

        if (orderBy && orderBy.length > 0) {
          dataArray = dataArray.sort((a, b) => {
            for (const order of orderBy) {
              const aVal = (a as Record<string, unknown>)[order.column];
              const bVal = (b as Record<string, unknown>)[order.column];

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

        toast.success(`Fetched ${dataArray.length} records. Generating Excel file...`);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName || 'Data');

        worksheet.columns = exportColumns.map((col) => ({
          key: String(col.dataIndex),
          width: typeof col.width === 'number' ? col.width / 8 : 20,
        }));

        // THE FIX: Use excelHeader if available, otherwise title
        const headerTitles = exportColumns.map((col) => col.excelHeader || col.title);
        const headerRow = worksheet.addRow(headerTitles);
        headerRow.height = 25;

        exportColumns.forEach((col, index) => {
          const cell = headerRow.getCell(index + 1);
          if (styles.headerFont) cell.font = styles.headerFont;
          if (styles.headerFill) cell.fill = styles.headerFill;

          cell.alignment = {
            horizontal: 'center',
            vertical: 'middle',
            wrapText: wrapText || false,
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

        dataArray.forEach((record, rowIndex: number) => {
          if (record === null || typeof record !== 'object') {
            return;
          }

          const obj = record as Record<string, unknown>;
          const rowData: Record<string, unknown> = {};
          exportColumns.forEach((col) => {
            const key = String(col.dataIndex);
            const value = obj[key];
            rowData[key] = formatCellValue(value, col, record as Row<T>);
          });
          const excelRow = worksheet.addRow(rowData);

          exportColumns.forEach((col, colIndex) => {
            const cell = excelRow.getCell(colIndex + 1);

            if (styles.dataFont) cell.font = styles.dataFont;

            if (rowIndex % 2 === 1 && styles.alternateRowFill) {
              cell.fill = styles.alternateRowFill;
            }

            cell.alignment = {
              ...cell.alignment,
              wrapText: wrapText || false,
              vertical: 'top',
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

        if (autoFitColumns) {
          exportColumns.forEach((col, index) => {
            const column = worksheet.getColumn(index + 1);

            // THE FIX: Account for header length too
            let maxLength = (col.excelHeader || col.title).length;

            dataArray.forEach((record) => {
              if (record && typeof record === 'object') {
                const obj = record as Record<string, unknown>;
                const key = String(col.dataIndex);
                const value = obj[key];
                const cellText = String(formatCellValue(value, col) || '');

                if (wrapText) {
                  const lines = cellText.split('\n');
                  const maxLineLength = Math.max(...lines.map((line) => line.length));
                  maxLength = Math.max(maxLength, maxLineLength);
                } else {
                  maxLength = Math.max(maxLength, cellText.length);
                }
              }
            });

            const calculatedWidth = Math.min(Math.max(maxLength + 2, 10), 50);
            column.width = calculatedWidth;
          });
        }

        worksheet.views = [{ state: 'frozen', ySplit: 1 }];

        const buffer = await workbook.xlsx.writeBuffer();
        const sanitizedFileName = sanitizeFileName(fileName);
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const link = document.createElement('a');
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
          columnCount: exportColumns.length,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        if (showToasts) {
          toast.error(`Download failed: ${errorMessage}`);
        }
        throw error;
      }
    },
    ...mutationOptions,
  });
}

// Hook for traditional table/view downloads
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

  return useMutation<ExcelDownloadResult, Error, Omit<EnhancedDownloadOptions<T>, 'rpcConfig'>>({
    mutationFn: async (downloadOptions): Promise<ExcelDownloadResult> => {
      const ExcelJS = (await import('exceljs')).default;

      try {
        const defaultStyles = getDefaultStyles();
        const mergedOptions = {
          sheetName: 'Data',
          maxRows: batchSize,
          customStyles: defaultStyles,
          orderBy: defaultOrderBy,
          wrapText: defaultWrapText,
          autoFitColumns: defaultAutoFitColumns,
          ...downloadOptions,
        };

        const {
          fileName = `${String(tableName)}-${new Date().toISOString().split('T')[0]}.xlsx`,
          filters,
          columns,
          sheetName,
          maxRows,
          orderBy,
          wrapText,
          autoFitColumns,
        } = mergedOptions;

        const styles = { ...defaultStyles, ...mergedOptions.customStyles };

        if (!columns || columns.length === 0) throw new Error('No columns specified for export');
        const exportColumns = columns.filter((col) => !col.excludeFromExport);
        if (exportColumns.length === 0) throw new Error('All columns are excluded from export');

        const selectFields = exportColumns.map((col) => col.dataIndex).join(',');

        let query = isTableName(tableName)
          ? supabase.from(tableName as PublicTableName).select(selectFields)
          : supabase.from(tableName as ViewName).select(selectFields);

        if (filters) query = applyFilters(query, filters);

        if (orderBy && orderBy.length > 0) {
          orderBy.forEach((order) => {
            query = query.order(order.column, { ascending: order.ascending !== false });
          });
        }

        if (maxRows) query = query.limit(maxRows);

        const { data, error } = await query;

        if (error) throw new Error(`Failed to fetch data: ${error.message}`);
        if (!data || data.length === 0) throw new Error('No data found for the selected criteria');

        const typedData = data as Row<T>[];
        toast.success(`Fetched ${typedData.length} records. Generating Excel file...`);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(sheetName || 'Data');

        worksheet.columns = exportColumns.map((col) => ({
          key: String(col.dataIndex),
          // THE FIX: Use excelHeader if available
          header: col.excelHeader || col.title,
          width: typeof col.width === 'number' ? col.width / 8 : 20,
        }));

        typedData.forEach((record, rowIndex) => {
          const rowData: unknown[] = exportColumns.map((col) => {
            const key = col.dataIndex as keyof Row<T> & string;
            return formatCellValue(record[key], col);
          });

          const excelRow = worksheet.addRow(rowData);

          if (wrapText) {
            excelRow.height = 20;
          }

          exportColumns.forEach((col, colIndex) => {
            const cell = excelRow.getCell(colIndex + 1);

            if (styles.dataFont) cell.font = styles.dataFont;

            if (rowIndex % 2 === 1 && styles.alternateRowFill) {
              cell.fill = styles.alternateRowFill;
            }

            cell.alignment = {
              ...cell.alignment,
              wrapText: wrapText || false,
              vertical: 'top',
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

        if (autoFitColumns) {
          worksheet.columns.forEach((column, index) => {
            const col = exportColumns[index];
            if (!column) return;

            // THE FIX: Header length check
            let maxLength = (col.excelHeader || col.title).length;
            typedData.forEach((record) => {
              const key = col.dataIndex as keyof Row<T> & string;
              const value = record[key];
              const cellText = String(formatCellValue(value, col) || '');

              if (wrapText) {
                const lines = cellText.split('\n');
                const maxLineLength = Math.max(...lines.map((line) => line.length));
                maxLength = Math.max(maxLength, maxLineLength);
              } else {
                maxLength = Math.max(maxLength, cellText.length);
              }
            });

            const calculatedWidth = Math.min(Math.max(maxLength + 2, 10), wrapText ? 30 : 50);
            column.width = calculatedWidth;
          });
        }

        worksheet.views = [{ state: 'frozen', ySplit: 1 }];

        const buffer = await workbook.xlsx.writeBuffer();
        const sanitizedFileName = sanitizeFileName(fileName);
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const link = document.createElement('a');
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
          columnCount: exportColumns.length,
        };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        if (showToasts && errorMessage !== 'No data found for the selected criteria') {
          toast.error(`Download failed: ${errorMessage}`);
        }
        throw error;
      }
    },
    ...mutationOptions,
  });
}
