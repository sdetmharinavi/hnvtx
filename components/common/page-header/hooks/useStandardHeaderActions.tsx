// components/common/page-header/hooks/useStandardHeaderActions.tsx
'use client';

import { createClient } from '@/utils/supabase/client';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useTableExcelDownload, useRPCExcelDownload } from '@/hooks/database/excel-queries';
import { formatDate } from '@/utils/formatters';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';

import { ActionButton } from '@/components/common/page-header/DropdownButton';
import { Filters, Row, PublicTableOrViewName, buildRpcFilters, OrderBy } from '@/hooks/database';
import { FiDownload, FiPlus, FiRefreshCw, FiWifiOff } from 'react-icons/fi';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';

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
  orderBy?: OrderBy[];
}

interface StandardActionsConfig<T extends PublicTableOrViewName> {
  onRefresh?: () => void;
  onAddNew?: () => void;
  exportConfig?: ExportConfig<T>;
  isLoading?: boolean;
  isFetching?: boolean;
  data?: Row<T>[];
}

export function useStandardHeaderActions<T extends PublicTableOrViewName>({
  onRefresh,
  onAddNew,
  exportConfig,
  isLoading,
  isFetching,
  data,
}: StandardActionsConfig<T>): ActionButton[] {
  const supabase = useMemo(() => createClient(), []);
  const isOnline = useOnlineStatus();

  const columns = useDynamicColumnConfig(exportConfig?.tableName as T, {
    data: data,
  });

  const tableExcelDownload = useTableExcelDownload(supabase, exportConfig?.tableName as T, {
    onError: (err) => toast.error(`Export failed: ${err.message}`),
  });

  const rpcExcelDownload = useRPCExcelDownload<T>(supabase, {
    onError: (err) => toast.error(`Export failed: ${err.message}`),
  });

  const handleExport = useCallback(
    (filterOption?: ExportFilterOption) => {
      if (!exportConfig?.tableName) {
        toast.error('Export failed: Table name not configured.');
        return;
      }

      if (!isOnline) {
        toast.error('Export unavailable offline. Please connect to the internet.', {
          icon: <FiWifiOff />,
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
        exportConfig.columns ? exportConfig.columns.includes(c.key as keyof Row<T> & string) : true
      );

      const orderBy = exportConfig.orderBy || [{ column: 'created_at', ascending: false }];

      if (exportConfig.useRpc) {
        const primaryOrder = orderBy[0] || { column: 'id', ascending: true };

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
              p_order_by: primaryOrder.column,
              p_order_dir: primaryOrder.ascending === false ? 'desc' : 'asc',
            },
          },
        });
      } else {
        tableExcelDownload.mutate({
          fileName: finalFileName,
          sheetName: sheetName,
          filters: filters,
          columns: columnsToExport,
          maxRows: exportConfig.maxRows,
          orderBy: orderBy,
        });
      }
    },
    [exportConfig, columns, tableExcelDownload, rpcExcelDownload, isOnline]
  );

  return useMemo(() => {
    const actions: ActionButton[] = [];
    const isExporting = tableExcelDownload.isPending || rpcExcelDownload.isPending;

    // THE FIX: Use isFetching OR isLoading for visual state, but allow clicking if not "hard" loading
    // Actually, we want to disable refresh if a sync/fetch is already happening
    const isBusy = isLoading || isFetching;

    if (onRefresh) {
      actions.push({
        label: 'Refresh',
        onClick: onRefresh,
        variant: 'outline',
        leftIcon: <FiRefreshCw className={isBusy ? 'animate-spin' : ''} />,
        disabled: isBusy, // Prevent double clicking
        hideTextOnMobile: true,
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
          hideTextOnMobile: true,
        });
      } else {
        actions.push({
          label: isExporting ? 'Exporting...' : 'Export',
          onClick: () => handleExport(),
          variant: 'outline',
          leftIcon: <FiDownload />,
          disabled: isLoading || isExporting,
          hideTextOnMobile: true,
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
    isFetching,
    handleExport,
    tableExcelDownload.isPending,
    rpcExcelDownload.isPending,
  ]);
}
