'use client';

import { createClient } from '@/utils/supabase/client';
import { useCallback, useMemo } from 'react';
import { toast } from 'sonner';
import { useTableExcelDownload } from '@/hooks/database/excel-queries';
import { formatDate } from '@/utils/formatters';
import { useDynamicColumnConfig } from '@/hooks/useColumnConfig';

import { ActionButton } from '@/components/common/page-header/DropdownButton';
import { Filters, Row, PublicTableOrViewName } from '@/hooks/database';
import { FiDownload, FiPlus, FiRefreshCw } from 'react-icons/fi';

interface ExportFilterOption {
  label: string;
  filters?: Filters;
  fileName?: string;
}

interface ExportConfig<T extends PublicTableOrViewName> {
  tableName: T;
  maxRows?: number;
  columns?: (keyof Row<T> & string)[]; // Allow specifying a subset of columns for export
  filterOptions?: ExportFilterOption[]; // New: array of filter options
  // Deprecated: keeping for backward compatibility
  filters?: Filters;
  fileName?: string;
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

  const tableExcelDownload = useTableExcelDownload(
    supabase,
    exportConfig?.tableName as T,
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

      // Use filterOption filters if provided, otherwise fall back to exportConfig filters
      const filters = filterOption?.filters || exportConfig.filters;

      // Determine the file and sheet name
      let fileName: string;
      let sheetName: string;

      if (filterOption) {
        // If it's a filter option, use custom fileName or append label to table name
        if (filterOption.fileName) {
          fileName = filterOption.fileName;
          sheetName = filterOption.fileName;
        } else {
          // Append filter label to table name
          fileName = `${exportConfig.tableName}-${filterOption.label
            .toLowerCase()
            .replace(/\s+/g, '-')}`;
          sheetName = `${exportConfig.tableName}-${filterOption.label}`;
        }
      } else {
        // No filter option - use default table name or custom fileName
        fileName = exportConfig.fileName || exportConfig.tableName;
        sheetName = exportConfig.fileName || exportConfig.tableName;
      }

      tableExcelDownload.mutate({
        fileName: `${formatDate(new Date(), {
          format: 'dd-mm-yyyy',
        })}-${fileName}.xlsx`,
        sheetName: sheetName,
        filters: filters,
        columns: columns.filter((c) =>
          exportConfig.columns
            ? exportConfig.columns.includes(c.key as keyof Row<T> & string)
            : true
        ),
        maxRows: exportConfig.maxRows,
      });
    },
    [exportConfig, columns, tableExcelDownload]
  );

  return useMemo(() => {
    const actions: ActionButton[] = [];

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
      // Check if we have multiple filter options
      if (exportConfig.filterOptions && exportConfig.filterOptions.length > 0) {
        // Create dropdown with filter options
        const dropdownoptions = [
          {
            label: 'Export All (No Filters)',
            onClick: () =>
              handleExport({
                label: 'All',
                filters: undefined,
                fileName: undefined,
              }),
            disabled: tableExcelDownload.isPending,
          },
        ];
        exportConfig.filterOptions.forEach((option) => {
          dropdownoptions.push({
            label: `Export ${option.label}`,
            onClick: () => handleExport(option),
            disabled: tableExcelDownload.isPending,
          });
        });

        actions.push({
          label: 'Export',
          variant: 'outline',
          leftIcon: <FiDownload />,
          disabled: tableExcelDownload.isPending,
          'data-dropdown': true,
          dropdownoptions,
        });
      } else {
        // Single export button (backward compatibility)
        actions.push({
          label: tableExcelDownload.isPending ? 'Exporting...' : 'Export',
          onClick: () => handleExport(),
          variant: 'outline',
          leftIcon: <FiDownload />,
          disabled: isLoading || tableExcelDownload.isPending,
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
  ]);
}
