'use client';

import { createClient } from '@/utils/supabase/client';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useTableExcelDownload, useRPCExcelDownload } from '@/hooks/database/excel-queries'; // Imported RPC hook
import { formatDate } from '@/utils/formatters';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';

import { ActionButton } from '@/components/common/page-header/DropdownButton';
import { Filters, Row, PublicTableOrViewName, buildRpcFilters } from '@/hooks/database'; // Imported buildRpcFilters
import { FiDownload, FiPlus, FiRefreshCw } from 'react-icons/fi';

interface ExportFilterOption {
  label: string;
  filters?: Filters;
  fileName?: string;
}

interface ExportConfig<T extends PublicTableOrViewName> {
  tableName: T;
  maxRows?: number;
  columns?: (keyof Row<T> & string)[];
  filterOptions?: ExportFilterOption[];
  filters?: Filters;
  fileName?: string;
  useRpc?: boolean; // NEW: Flag to force RPC usage
}

interface StandardActionsConfig<T extends PublicTableOrViewName> {
  onRefresh?: () => void;
  onAddNew?: () => void;
  exportConfig?: ExportConfig<T>;
  isLoading?: boolean;
  data?: Row<T>[];
}

export function useStandardHeaderActions<T extends PublicTableOrViewName>({
  onRefresh,
  onAddNew,
  exportConfig,
  isLoading,
  data,
}: StandardActionsConfig<T>): ActionButton[] {
  const supabase = useMemo(() => createClient(), []);
  const columns = useDynamicColumnConfig(exportConfig?.tableName as T, {
    data: data,
  });

  // 1. Setup Direct Table Download
  const tableExcelDownload = useTableExcelDownload(
    supabase,
    exportConfig?.tableName as T,
    {
      onError: (err) => toast.error(`Export failed: ${err.message}`),
    }
  );

  // 2. Setup RPC Download (Fallback/Alternative)
  // We pass the table name generics so types align
  const rpcExcelDownload = useRPCExcelDownload<T>(
    supabase,
    {
      onError: (err) => toast.error(`Export failed: ${err.message}`),
    }
  );

  const handleExport = useCallback(
    (filterOption?: ExportFilterOption) => {
      if (!exportConfig?.tableName) {
        toast.error('Export failed: Table name not configured.');
        return;
      }

      const filters = filterOption?.filters || exportConfig.filters;

      // Determine File Name
      let fileName: string;
      let sheetName: string;

      if (filterOption) {
        if (filterOption.fileName) {
          fileName = filterOption.fileName;
          sheetName = filterOption.fileName;
        } else {
          fileName = `${exportConfig.tableName}-${filterOption.label
            .toLowerCase()
            .replace(/\s+/g, '-')}`;
          sheetName = `${exportConfig.tableName}-${filterOption.label}`;
        }
      } else {
        fileName = exportConfig.fileName || exportConfig.tableName;
        sheetName = exportConfig.fileName || exportConfig.tableName;
      }

      const finalFileName = `${formatDate(new Date(), { format: 'dd-mm-yyyy' })}-${fileName}.xlsx`;
      const columnsToExport = columns.filter((c) =>
        exportConfig.columns
          ? exportConfig.columns.includes(c.key as keyof Row<T> & string)
          : true
      );

      // --- BRANCH LOGIC: RPC VS DIRECT ---
      if (exportConfig.useRpc) {
        // Use the standard pagination RPC which handles filters and sorts
        rpcExcelDownload.mutate({
          fileName: finalFileName,
          sheetName: sheetName,
          columns: columnsToExport,
          rpcConfig: {
            functionName: 'get_paged_data',
            parameters: {
              p_view_name: exportConfig.tableName,
              p_limit: exportConfig.maxRows || 50000, // Default high limit for export
              p_offset: 0,
              // Ensure filters are converted to the JSON format expected by the RPC
              p_filters: buildRpcFilters(filters || {}),
              p_order_by: 'created_at', // Default sort, could be parameterized if needed
              p_order_dir: 'desc'
            }
          }
        });
      } else {
        // Use Direct Table/View Select
        tableExcelDownload.mutate({
          fileName: finalFileName,
          sheetName: sheetName,
          filters: filters,
          columns: columnsToExport,
          maxRows: exportConfig.maxRows,
        });
      }
    },
    [exportConfig, columns, tableExcelDownload, rpcExcelDownload]
  );

  return useMemo(() => {
    const actions: ActionButton[] = [];
    const isExporting = tableExcelDownload.isPending || rpcExcelDownload.isPending;

    if (onRefresh) {
      actions.push({
        label: 'Refresh',
        onClick: onRefresh,
        variant: 'outline',
        leftIcon: <FiRefreshCw className={isLoading ? 'animate-spin' : ''} />,
        disabled: isLoading,
      });
    }

    if (exportConfig) {
      if (exportConfig.filterOptions && exportConfig.filterOptions.length > 0) {
        const dropdownoptions = [
          {
            label: 'Export All (No Filters)',
            onClick: () =>
              handleExport({
                label: 'All',
                filters: undefined,
                fileName: undefined,
              }),
            disabled: isExporting,
          },
        ];
        exportConfig.filterOptions.forEach((option) => {
          dropdownoptions.push({
            label: `Export ${option.label}`,
            onClick: () => handleExport(option),
            disabled: isExporting,
          });
        });

        actions.push({
          label: 'Export',
          variant: 'outline',
          leftIcon: <FiDownload />,
          disabled: isExporting,
          'data-dropdown': true,
          dropdownoptions,
        });
      } else {
        actions.push({
          label: isExporting ? 'Exporting...' : 'Export',
          onClick: () => handleExport(),
          variant: 'outline',
          leftIcon: <FiDownload />,
          disabled: isLoading || isExporting,
        });
      }
    }

    if (onAddNew) {
      actions.push({
        label: 'Add New',
        onClick: onAddNew,
        variant: 'primary',
        leftIcon: <FiPlus />,
        disabled: isLoading,
      });
    }

    return actions;
  }, [
    onRefresh,
    onAddNew,
    exportConfig,
    isLoading,
    handleExport,
    tableExcelDownload.isPending,
    rpcExcelDownload.isPending
  ]);
}