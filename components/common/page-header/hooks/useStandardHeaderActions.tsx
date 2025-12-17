'use client';

import { createClient } from '@/utils/supabase/client';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useTableExcelDownload, useRPCExcelDownload } from '@/hooks/database/excel-queries'; 
import { formatDate } from '@/utils/formatters';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';

import { ActionButton } from '@/components/common/page-header/DropdownButton';
import { Filters, Row, PublicTableOrViewName, buildRpcFilters } from '@/hooks/database'; 
import { FiDownload, FiPlus, FiRefreshCw, FiWifiOff } from 'react-icons/fi';
import { useOnlineStatus } from '@/hooks/useOnlineStatus'; // ADDED

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
  useRpc?: boolean; 
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
  const isOnline = useOnlineStatus(); // ADDED

  const columns = useDynamicColumnConfig(exportConfig?.tableName as T, {
    data: data,
  });

  const tableExcelDownload = useTableExcelDownload(
    supabase,
    exportConfig?.tableName as T,
    {
      onError: (err) => toast.error(`Export failed: ${err.message}`),
    }
  );

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

      // Check offline status for large RPC/DB exports
      // Note: We could technically implement client-side export of the `data` prop here,
      // but the `data` prop often only contains the *current page* of data, not the full dataset
      // required for a meaningful report.
      // Ideally, we'd fall back to client-side export if `data` is sufficient.
      // For now, we block large exports to prevent confusion/errors.
      if (!isOnline) {
          toast.error('Export unavailable offline. Please connect to the internet.', {
              icon: <FiWifiOff />
          });
          return;
      }

      const filters = filterOption?.filters || exportConfig.filters;

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

      if (exportConfig.useRpc) {
        rpcExcelDownload.mutate({
          fileName: finalFileName,
          sheetName: sheetName,
          columns: columnsToExport,
          rpcConfig: {
            functionName: 'get_paged_data',
            parameters: {
              p_view_name: exportConfig.tableName,
              p_limit: exportConfig.maxRows || 50000, 
              p_offset: 0,
              p_filters: buildRpcFilters(filters || {}),
              p_order_by: 'created_at', 
              p_order_dir: 'desc'
            }
          }
        });
      } else {
        tableExcelDownload.mutate({
          fileName: finalFileName,
          sheetName: sheetName,
          filters: filters,
          columns: columnsToExport,
          maxRows: exportConfig.maxRows,
        });
      }
    },
    [exportConfig, columns, tableExcelDownload, rpcExcelDownload, isOnline]
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