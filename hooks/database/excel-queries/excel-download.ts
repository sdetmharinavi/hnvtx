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
  Column,
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
  maxRows?: number; // FIX: Added missing property
}

// --- HELPER FUNCTION ---
async function generateAndDownloadExcel<T extends TableOrViewName>(
  data: Row<T>[],
  options: EnhancedDownloadOptions<T>
): Promise<ExcelDownloadResult> {
  // Dynamically import ExcelJS to avoid bloating the main bundle
  const ExcelJS = (await import('exceljs')).default;
  
  const {
    fileName = `export-${new Date().toISOString().split('T')[0]}.xlsx`,
    columns,
    sheetName,
    customStyles,
    wrapText,
    autoFitColumns,
  } = options;

  if (!columns || columns.length === 0) throw new Error('No columns specified for export');
  const exportColumns = columns.filter((col) => !col.excludeFromExport);
  if (exportColumns.length === 0) throw new Error('All columns are excluded from export');

  const styles = { ...getDefaultStyles(), ...customStyles };
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(sanitizeSheetFileName(sheetName || 'Data'));

  // --- HEADER ROW ---
  worksheet.columns = exportColumns.map((col) => ({
    key: String(col.dataIndex),
    // Use the excelHeader if provided (e.g. "Asset No"), else title
    header: col.excelHeader || col.title, 
  }));

  const headerRow = worksheet.getRow(1);
  headerRow.height = 25;
  
  // Style Header
  if (styles.headerFont) headerRow.font = styles.headerFont;
  if (styles.headerFill) headerRow.fill = styles.headerFill;
  
  // Center headers
  headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };

  // --- DATA ROWS ---
  data.forEach((record, rowIndex) => {
    const rowData: { [key: string]: unknown } = {};
    
    exportColumns.forEach((col) => {
      const key = String(col.dataIndex);
      // Format value using helpers (dates, booleans, etc)
      rowData[key] = formatCellValue(record[key as keyof Row<T>], col, record);
    });

    const excelRow = worksheet.addRow(rowData);

    // Apply styles per cell
    excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const col = exportColumns[colNumber - 1];
      if (!col) return;

      if (styles.dataFont) cell.font = styles.dataFont;
      
      // Zebra striping
      if (rowIndex % 2 === 1 && styles.alternateRowFill) {
        cell.fill = styles.alternateRowFill;
      }

      // Alignment & Wrapping
      cell.alignment = { 
        wrapText: wrapText || false, 
        vertical: 'top', 
        horizontal: col.align || 'left' 
      };

      // Number formats
      applyCellFormatting(cell, col);
      
      // Borders
      if (styles.borderStyle) {
        cell.border = styles.borderStyle;
      }
    });
  });

  // --- COLUMN WIDTHS ---
  worksheet.columns.forEach((column, index) => {
    const colConfig = exportColumns[index];
    if (!column || !colConfig) return;

    // 1. Explicit Width (e.g. Description = 300)
    if (typeof colConfig.width === 'number') {
      // ExcelJS width is roughly characters. 
      // 300px is roughly 40-50 characters width in Excel terms depending on font.
      // We map pixel width (from UI) to Excel width (approx / 7)
      column.width = colConfig.width / 7; 
    } 
    // 2. Auto Fit
    else if (autoFitColumns) {
      let maxLength = (colConfig.excelHeader || colConfig.title).length;
      
      // Sample first 50 rows to calculate width (performance optimization)
      const sampleData = data.slice(0, 50);
      
      sampleData.forEach((record) => {
         const val = formatCellValue(record[String(colConfig.dataIndex) as keyof Row<T>], colConfig, record);
         const strVal = String(val ?? '');
         // If wrapping is on, don't expand infinitely, cap it
         if (wrapText && strVal.length > 50) {
            maxLength = Math.max(maxLength, 50); 
         } else {
            maxLength = Math.max(maxLength, strVal.length);
         }
      });
      
      // Min width 12 chars, Max width 60 chars
      column.width = Math.min(Math.max(maxLength + 2, 12), 60);
    }
  });

  worksheet.views = [{ state: 'frozen', ySplit: 1 }];

  // --- DOWNLOAD ---
  const buffer = await workbook.xlsx.writeBuffer();
  const sanitizedFileName = sanitizeFileName(fileName);
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = sanitizedFileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);

  return { fileName: sanitizedFileName, rowCount: data.length, columnCount: exportColumns.length };
}


// --- HOOKS ---

export function useRPCExcelDownload<T extends TableOrViewName>(
  supabase: SupabaseClient<Database>,
  options?: EnhancedUseExcelDownloadOptions<T>
) {
  const { showToasts = true, batchSize = 50000, defaultOrderBy, defaultWrapText = true, defaultAutoFitColumns = true, ...mutationOptions } = options || {};

  return useMutation<ExcelDownloadResult, Error, EnhancedDownloadOptions<T> & { rpcConfig: RPCConfig }>({
    mutationFn: async (downloadOptions): Promise<ExcelDownloadResult> => {
      if (showToasts) toast.info('Fetching data for export...');
      
      const { rpcConfig, filters, maxRows, orderBy } = downloadOptions;
      
      const rpcParams: Record<string, unknown> = {
        ...rpcConfig.parameters,
        ...convertFiltersToRPCParams(filters),
      };

      if (maxRows) rpcParams.row_limit = maxRows;
      
      if (orderBy && orderBy.length > 0) {
        rpcParams.order_by = orderBy.map(o => `${o.column}.${o.ascending !== false ? 'asc' : 'desc'}`).join(',');
      }

      const { data, error } = await supabase.rpc(
        rpcConfig.functionName as keyof Database['public']['Functions'],
        rpcParams
      );

      if (error) throw new Error(`RPC call failed: ${error.message}`);
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const dataArray = (data as any)?.data || data || [];
      
      if (dataArray.length === 0) {
        toast.info('No data found to export.');
        return { fileName: '', rowCount: 0, columnCount: 0 };
      }
      
      toast.success(`Fetched ${dataArray.length} records. Generating file...`);
      
      return generateAndDownloadExcel(dataArray, {
        ...downloadOptions,
        wrapText: downloadOptions.wrapText ?? defaultWrapText,
        autoFitColumns: downloadOptions.autoFitColumns ?? defaultAutoFitColumns
      });
    },
    ...mutationOptions,
  });
}

export function useTableExcelDownload<T extends PublicTableOrViewName>(
  supabase: SupabaseClient<Database>,
  tableName: T,
  options?: EnhancedUseExcelDownloadOptions<T>
) {
  // FIX: Added maxRows to destructuring, aliased as defaultMaxRows
  const { showToasts = true, maxRows: defaultMaxRows, defaultOrderBy, defaultWrapText = true, defaultAutoFitColumns = true, ...mutationOptions } = options || {};

  return useMutation<ExcelDownloadResult, Error, Omit<EnhancedDownloadOptions<T>, 'rpcConfig'>>({
    mutationFn: async (downloadOptions): Promise<ExcelDownloadResult> => {
      if (showToasts) toast.info('Fetching data for export...');
      
      const { filters, columns, maxRows, orderBy } = downloadOptions;
      
      const selectFields = columns?.filter(c => !c.excludeFromExport).map(c => c.dataIndex).join(',') || '*';
      
      let query = (isTableName(tableName) 
        ? supabase.from(tableName as PublicTableName) 
        : supabase.from(tableName as ViewName)).select(selectFields);

      if (filters) query = applyFilters(query, filters);
      
      if (orderBy && orderBy.length > 0) {
        orderBy.forEach(o => { query = query.order(o.column, { ascending: o.ascending !== false }); });
      }
      
      // Use maxRows from call or defaultMaxRows from options
      if (maxRows || defaultMaxRows) query = query.limit(maxRows || defaultMaxRows || 50000);
      
      const { data, error } = await query;
      
      if (error) throw new Error(`Failed to fetch data: ${error.message}`);
      if (!data || data.length === 0) {
        toast.info('No data found to export.');
        return { fileName: '', rowCount: 0, columnCount: 0 };
      }
      
      toast.success(`Fetched ${data.length} records. Generating file...`);
      
      return generateAndDownloadExcel(data as Row<T>[], {
        ...downloadOptions,
        wrapText: downloadOptions.wrapText ?? defaultWrapText,
        autoFitColumns: downloadOptions.autoFitColumns ?? defaultAutoFitColumns
      });
    },
    ...mutationOptions,
  });
}