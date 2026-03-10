// components/common/page-header/hooks/useStandardHeaderActions.tsx
'use client';

import { createClient } from '@/utils/supabase/client';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useRPCExcelDownload } from '@/hooks/database/excel-queries';
import { formatDate } from '@/utils/formatters';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';

import { ActionButton } from '@/components/common/page-header/DropdownButton';
import { Filters, Row, PublicTableOrViewName, buildRpcFilters, OrderBy } from '@/hooks/database';
import { FiDownload, FiRefreshCw, FiWifiOff } from 'react-icons/fi';
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
  exportConfig?: ExportConfig<T>;
  isLoading?: boolean;
  isFetching?: boolean;
  data?: Row<T>[];
}

export function useStandardHeaderActions<T extends PublicTableOrViewName>({
  onRefresh,
  exportConfig,
  isLoading,
  isFetching,
  data,
}: StandardActionsConfig<T>): ActionButton[] {
  const supabase = useMemo(() => createClient(),[]);
  const isOnline = useOnlineStatus();

  const columns = useDynamicColumnConfig(exportConfig?.tableName as T, {
    data: data,
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

      const orderBy = exportConfig.orderBy ||[{ column: 'id', ascending: true }];

      // Assuming all exports utilize RPC via our views now
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
            p_order_by: orderBy[0].column,
            p_order_dir: orderBy[0].ascending === false ? 'desc' : 'asc',
          },
        },
      });
    },
    [exportConfig, columns, rpcExcelDownload, isOnline]
  );

  return useMemo(() => {
    const actions: ActionButton[] =[];
    const isBusy = isLoading || isFetching;

    if (onRefresh) {
      actions.push({
        label: 'Refresh',
        onClick: onRefresh,
        variant: 'outline',
        leftIcon: <FiRefreshCw className={isBusy ? 'animate-spin' : ''} />,
        disabled: isBusy,
        hideTextOnMobile: true,
      });
    }

    if (exportConfig) {
      if (exportConfig.filterOptions && exportConfig.filterOptions.length > 0) {
        const dropdownoptions =[
          {
            label: 'Export All (No Filters)',
            onClick: () =>
              handleExport({
                label: 'All',
                filters: undefined,
                fileName: undefined,
              }),
            disabled: rpcExcelDownload.isPending,
          },
        ];
        exportConfig.filterOptions.forEach((option) => {
          dropdownoptions.push({
            label: `Export ${option.label}`,
            onClick: () => handleExport(option),
            disabled: rpcExcelDownload.isPending,
          });
        });

        actions.push({
          label: 'Export',
          variant: 'outline',
          leftIcon: <FiDownload />,
          disabled: rpcExcelDownload.isPending,
          'data-dropdown': true,
          dropdownoptions,
          hideTextOnMobile: true,
        });
      } else {
        actions.push({
          label: rpcExcelDownload.isPending ? 'Exporting...' : 'Export',
          onClick: () => handleExport(),
          variant: 'outline',
          leftIcon: <FiDownload />,
          disabled: isLoading || rpcExcelDownload.isPending,
          hideTextOnMobile: true,
        });
      }
    }

    return actions;
  },[
    onRefresh,
    exportConfig,
    isLoading,
    isFetching,
    handleExport,
    rpcExcelDownload.isPending,
  ]);
}