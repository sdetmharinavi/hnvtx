// @/components/table/DataTable.tsx
import React, { useMemo, useCallback, useEffect, useReducer } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useTableExcelDownload, useRPCExcelDownload } from '@/hooks/database/excel-queries';
import { TableToolbar, TableHeader, TableBody, TablePagination, TableFilterPanel } from './';
import { DataTableProps, DownloadOptions, SortConfig } from '@/components/table/datatable-types';
import { PublicTableOrViewName, Row, Filters } from '@/hooks/database';
import { Column, RPCConfig } from '@/hooks/database/excel-queries/excel-helpers';
import { cn } from '@/lib/utils';
import { Card } from '../common/ui';

type DataRow<T extends PublicTableOrViewName> = Row<T> & { id: string | number };

type TableState<T extends PublicTableOrViewName> = {
  searchQuery: string;
  sortConfig: SortConfig<Row<T>> | null;
  filters: Filters;
  selectedRows: DataRow<T>[];
  visibleColumns: string[];
  editingCell: { rowIndex: number; columnKey: string } | null;
  editValue: string;
  showColumnSelector: boolean;
  showFilters: boolean;
};

type BaseTableAction<R> =
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SELECTED_ROWS'; payload: R[] }
  | { type: 'SET_VISIBLE_COLUMNS'; payload: string[] }
  | {
      type: 'START_EDIT_CELL';
      payload: { rowIndex: number; columnKey: string; value: string };
    }
  | { type: 'SET_EDIT_VALUE'; payload: string }
  | { type: 'CANCEL_EDIT' }
  | { type: 'TOGGLE_COLUMN_SELECTOR'; payload?: boolean }
  | { type: 'TOGGLE_FILTERS'; payload?: boolean };

type TableActionReducer<T extends PublicTableOrViewName> =
  | BaseTableAction<DataRow<T>>
  | { type: 'SET_SORT_CONFIG'; payload: SortConfig<Row<T>> | null }
  | { type: 'SET_FILTERS'; payload: Filters };

function tableReducer<T extends PublicTableOrViewName>(
  state: TableState<T>,
  action: TableActionReducer<T> | BaseTableAction<DataRow<T>>
): TableState<T> {
  switch (action.type) {
    case 'SET_SEARCH_QUERY':
      return { ...state, searchQuery: action.payload };
    case 'SET_SORT_CONFIG':
      return { ...state, sortConfig: action.payload };
    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    case 'SET_SELECTED_ROWS':
      return { ...state, selectedRows: action.payload };
    case 'SET_VISIBLE_COLUMNS':
      return { ...state, visibleColumns: action.payload };
    case 'START_EDIT_CELL':
      return {
        ...state,
        editingCell: {
          rowIndex: action.payload.rowIndex,
          columnKey: action.payload.columnKey,
        },
        editValue: action.payload.value,
      };
    case 'SET_EDIT_VALUE':
      return { ...state, editValue: action.payload };
    case 'CANCEL_EDIT':
      return { ...state, editingCell: null, editValue: '' };
    case 'TOGGLE_COLUMN_SELECTOR':
      return {
        ...state,
        showColumnSelector: action.payload ?? !state.showColumnSelector,
      };
    case 'TOGGLE_FILTERS':
      return { ...state, showFilters: action.payload ?? !state.showFilters };
    default:
      return state;
  }
}

export function DataTable<T extends PublicTableOrViewName>({
  data = [],
  tableName,
  columns,
  loading = false,
  pagination,
  actions = [],
  searchable = true,
  serverSearch = false,
  filterable = true,
  sortable = true,
  selectable = false,
  exportable = false,
  refreshable = false,
  density = 'default',
  bordered = true,
  striped = true,
  hoverable = true,
  className = '',
  emptyText = 'No data available',
  title,
  onRefresh,
  onExport,
  onRowSelect,
  onCellEdit,
  customToolbar,
  showColumnSelector: showColumnSelectorProp,
  showColumnsToggle,
  exportOptions,
  onSearchChange,
  renderMobileItem,
  autoHideEmptyColumns = false,
}: DataTableProps<T>): React.ReactElement {
  const initialState: TableState<T> = {
    searchQuery: '',
    sortConfig: null,
    filters: {},
    selectedRows: [],
    visibleColumns: columns.map((col) => col.key),
    editingCell: null,
    editValue: '',
    showColumnSelector: !!showColumnSelectorProp,
    showFilters: false,
  };

  const [state, dispatch] = useReducer(tableReducer, initialState);
  const {
    searchQuery,
    sortConfig,
    filters,
    selectedRows,
    visibleColumns,
    editingCell,
    editValue,
    showColumnSelector,
    showFilters,
  } = state;

  const supabase = createClient();

  useEffect(() => {
    if (typeof showColumnSelectorProp === 'boolean') {
      dispatch({
        type: 'TOGGLE_COLUMN_SELECTOR',
        payload: showColumnSelectorProp,
      });
    }
  }, [showColumnSelectorProp]);

  useEffect(() => {
    if (!filterable) {
      dispatch({ type: 'SET_FILTERS', payload: {} });
    }
  }, [filterable]);

  const tableExcelDownload = useTableExcelDownload<T>(supabase, tableName, {
    showToasts: true,
  });
  const rpcExcelDownload = useRPCExcelDownload<T>(supabase, {
    showToasts: true,
  });

  const processedData = useMemo(() => {
    let filteredData = [...data] as DataRow<T>[];

    if (searchQuery && searchable && !serverSearch) {
      const q = searchQuery.toLowerCase();
      filteredData = filteredData.filter((item) =>
        columns.some((column) => {
          if (column.searchable === false) return false;
          const value = item[column.dataIndex as keyof typeof item];
          return String(value ?? '')
            .toLowerCase()
            .includes(q);
        })
      );
    }

    if (filterable && Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
          filteredData = filteredData.filter((item) =>
            String(item[key as keyof DataRow<T>] ?? '')
              .toLowerCase()
              .includes(String(value).toLowerCase())
          );
        }
      });
    }

    if (sortConfig && sortable) {
      const sortColumn = columns.find((c) => c.key === sortConfig.key);
      const useNaturalSort = !!sortColumn?.naturalSort;

      const collator = useNaturalSort
        ? new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' })
        : null;

      filteredData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];

        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          if (useNaturalSort && collator) {
            const result = collator.compare(aValue, bValue);
            return sortConfig.direction === 'asc' ? result : -result;
          }

          return sortConfig.direction === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }

        return sortConfig.direction === 'asc'
          ? aValue > bValue
            ? 1
            : -1
          : aValue < bValue
          ? 1
          : -1;
      });
    }
    return filteredData;
  }, [
    data,
    searchQuery,
    filters,
    sortConfig,
    columns,
    searchable,
    sortable,
    filterable,
    serverSearch,
  ]);

  const handleSort = useCallback(
    (columnKey: keyof Row<T> & string) => {
      if (!sortable) return;
      const direction =
        sortConfig?.key === columnKey && sortConfig.direction === 'asc' ? 'desc' : 'asc';
      if (sortConfig?.key === columnKey && sortConfig.direction === 'desc') {
        dispatch({ type: 'SET_SORT_CONFIG', payload: null });
      } else {
        dispatch({
          type: 'SET_SORT_CONFIG',
          payload: { key: columnKey, direction },
        });
      }
    },
    [sortable, sortConfig]
  );

  const handleRowSelect = useCallback(
    (record: DataRow<T>, selected: boolean) => {
      const newSelection = selected
        ? [...selectedRows, record]
        : selectedRows.filter((row) => row.id !== record.id);
      dispatch({ type: 'SET_SELECTED_ROWS', payload: newSelection });
      onRowSelect?.(newSelection);
    },
    [selectedRows, onRowSelect]
  );

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      const newSelection = selected ? [...processedData] : [];
      dispatch({ type: 'SET_SELECTED_ROWS', payload: newSelection });
      onRowSelect?.(newSelection);
    },
    [processedData, onRowSelect]
  );

  const handleCellEdit = useCallback(
    (record: DataRow<T>, column: Column<Row<T>>, rowIndex: number) => {
      if (!column.editable) return;
      dispatch({
        type: 'START_EDIT_CELL',
        payload: {
          rowIndex,
          columnKey: column.key,
          value: String(record[column.dataIndex as keyof DataRow<T>] ?? ''),
        },
      });
    },
    []
  );

  const saveCellEdit = useCallback(() => {
    if (!editingCell) return;
    const record = processedData[editingCell.rowIndex];
    const column = columns.find((col) => col.key === editingCell.columnKey);
    if (column && onCellEdit) {
      onCellEdit(record, column, editValue);
    }
    dispatch({ type: 'CANCEL_EDIT' });
  }, [editingCell, processedData, columns, onCellEdit, editValue]);

  const cancelCellEdit = useCallback(() => dispatch({ type: 'CANCEL_EDIT' }), []);

  const emptyColumnKeys = useMemo(() => {
    if (!autoHideEmptyColumns || processedData.length === 0) return new Set<string>();
    const nonEmptyKeys = new Set<string>();
    columns.forEach((col) => {
      // THE FIX: Check for alwaysVisible flag
      if (col.alwaysVisible) {
        nonEmptyKeys.add(col.key);
        return;
      }
      
      const hasValue = processedData.some((row) => {
        const val = row[col.dataIndex as keyof typeof row];
        if (val === null || val === undefined) return false;
        if (typeof val === 'string' && val.trim() === '') return false;
        if (Array.isArray(val) && val.length === 0) return false;
        return true;
      });
      if (hasValue) nonEmptyKeys.add(col.key);
    });
    return new Set(columns.filter((c) => !nonEmptyKeys.has(c.key)).map((c) => c.key));
  }, [autoHideEmptyColumns, columns, processedData]);

  const visibleColumnsData = useMemo<Column<Row<T>>[]>(
    () =>
      columns.filter(
        (col) => visibleColumns.includes(col.key) && !col.hidden && !emptyColumnKeys.has(col.key)
      ),
    [columns, visibleColumns, emptyColumnKeys]
  );

  const setSearchQueryCb = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const handleExport = useCallback(async () => {
    if (onExport) {
      await onExport(processedData as Row<T>[], visibleColumnsData as Column<Row<T>>[]);
      return;
    }
    const columnsToExport = (exportOptions?.columns ?? visibleColumnsData) as Column<Row<T>>[];
    const mergedFilters = exportOptions?.includeFilters
      ? { ...filters, ...(exportOptions?.filters ?? {}) }
      : exportOptions?.filters;

    const baseOptions: Omit<DownloadOptions<T>, 'rpcConfig'> = {
      fileName: exportOptions?.fileName,
      sheetName: exportOptions?.sheetName,
      maxRows: exportOptions?.maxRows,
      customStyles: exportOptions?.customStyles,
      columns: columnsToExport,
      filters: mergedFilters,
    };

    try {
      if (exportOptions?.rpcConfig) {
        const rpcOptions: DownloadOptions<T> & { rpcConfig: RPCConfig } = {
          ...baseOptions,
          rpcConfig: exportOptions.rpcConfig,
        };
        await rpcExcelDownload.mutateAsync(rpcOptions);
      } else {
        await tableExcelDownload.mutateAsync(baseOptions);
      }
    } catch (err) {
      if (exportOptions?.fallbackToCsv) {
        try {
          const headers = columnsToExport.map((c) => c.title).join(',');
          const keys = columnsToExport.map((c) => c.dataIndex as keyof Row<T> & string);
          const rows = (processedData as Row<T>[])?.map((r) =>
            keys
              .map((k) => {
                const v = (r as Row<T>)[k] as unknown;
                if (v === null || v === undefined) return '';
                const s = String(v).replace(/"/g, '""');
                return `"${s}"`;
              })
              .join(',')
          );
          const csv = [headers, ...(rows || [])].join('\n');
          const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
          const link = document.createElement('a');
          const csvName = (exportOptions?.fileName?.replace(/\.xlsx$/i, '') || 'export') + '.csv';
          link.href = URL.createObjectURL(blob);
          link.download = csvName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
        } catch {
          throw err;
        }
      } else {
        throw err;
      }
    }
  }, [
    onExport,
    processedData,
    visibleColumnsData,
    exportOptions,
    filters,
    tableExcelDownload,
    rpcExcelDownload,
  ]);

  const hasActions = actions.length > 0;
  const isExporting = tableExcelDownload.isPending || rpcExcelDownload.isPending;

  const renderActions = (record: DataRow<T>, index: number) => {
    if (!hasActions) return null;
    return (
      <div className="flex gap-1 justify-end">
        {actions.map((action) => {
          const isHidden =
            typeof action.hidden === 'function' ? action.hidden(record) : action.hidden;
          if (isHidden) return null;
          const isDisabled =
            typeof action.disabled === 'function' ? action.disabled(record) : action.disabled;
          return (
            <button
              key={action.key}
              onClick={(e) => {
                e.stopPropagation();
                if (!isDisabled) action.onClick(record, index);
              }}
              disabled={isDisabled}
              className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${
                isDisabled ? 'opacity-50' : ''
              } ${
                action.variant === 'danger' ? 'text-red-600' : 'text-gray-600 dark:text-gray-300'
              }`}
            >
              {action.getIcon ? action.getIcon(record) : action.icon}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div
      className={cn(
        'flex flex-col bg-white dark:bg-gray-800 rounded-lg max-h-[calc(100vh-100px)] relative shadow-md',
        bordered ? 'border border-gray-200 dark:border-gray-700' : '',
        className
      )}
    >
      <div className="shrink-0 z-20 relative bg-white dark:bg-gray-800 rounded-t-lg">
        <TableToolbar
          title={title}
          searchable={searchable}
          filterable={filterable}
          exportable={exportable}
          refreshable={refreshable}
          customToolbar={customToolbar}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQueryCb}
          onSearchChange={onSearchChange}
          showFilters={showFilters}
          setShowFilters={() => dispatch({ type: 'TOGGLE_FILTERS' })}
          showColumnSelector={showColumnSelector}
          setShowColumnSelector={(show) =>
            dispatch({ type: 'TOGGLE_COLUMN_SELECTOR', payload: show })
          }
          showColumnsToggle={showColumnsToggle}
          columns={columns}
          visibleColumns={visibleColumns}
          setVisibleColumns={(cols: string[]) =>
            dispatch({ type: 'SET_VISIBLE_COLUMNS', payload: cols })
          }
          onRefresh={onRefresh}
          onExport={handleExport}
          loading={loading}
          isExporting={isExporting}
        />

        <TableFilterPanel
          columns={columns}
          filters={filters}
          setFilters={(f) =>
            dispatch({
              type: 'SET_FILTERS',
              payload: typeof f === 'function' ? (f as (prev: Filters) => Filters)(filters) : f,
            })
          }
          showFilters={showFilters}
          filterable={filterable}
        />
      </div>

      <div className="flex-1 w-full overflow-auto min-h-0 relative isolate">
        {renderMobileItem && (
          <div className="block sm:hidden p-4 space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-32 bg-gray-100 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : processedData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">{emptyText}</div>
            ) : (
              processedData.map((record, idx) => (
                <Card
                  key={`${record.id}-${idx}`} 
                  className="p-4 border dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm relative"
                >
                  {selectable && (
                    <div className="absolute top-4 left-4">
                      <input
                        type="checkbox"
                        checked={selectedRows.some((r) => r.id === record.id)}
                        onChange={(e) => handleRowSelect(record, e.target.checked)}
                        className="rounded border-gray-300 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                    </div>
                  )}
                  <div className={selectable ? 'pl-8' : ''}>
                    {renderMobileItem(record, renderActions(record, idx))}
                  </div>
                </Card>
              ))
            )}
          </div>
        )}

        <table
          className={`min-w-full w-full table-auto sm:table-fixed ${
            bordered ? 'border-separate border-spacing-0' : ''
          } ${renderMobileItem ? 'hidden sm:table' : ''}`}
        >
          <TableHeader
            columns={columns}
            visibleColumns={visibleColumnsData}
            selectable={selectable}
            sortable={sortable}
            bordered={bordered}
            density={density}
            actions={actions}
            hasActions={hasActions}
            sortConfig={sortConfig}
            onSort={handleSort}
            onSelectAll={handleSelectAll}
            allSelected={processedData.length > 0 && selectedRows.length === processedData.length}
            hasData={processedData.length > 0}
          />
          <TableBody
            columns={columns}
            processedData={processedData}
            visibleColumns={visibleColumnsData}
            selectable={selectable}
            bordered={bordered}
            density={density}
            actions={actions}
            hasActions={hasActions}
            striped={striped}
            hoverable={hoverable}
            loading={loading}
            emptyText={emptyText}
            selectedRows={selectedRows}
            editingCell={editingCell}
            editValue={editValue}
            setEditValue={(value) => dispatch({ type: 'SET_EDIT_VALUE', payload: value })}
            onRowSelect={handleRowSelect}
            onCellEdit={handleCellEdit}
            saveCellEdit={saveCellEdit}
            cancelCellEdit={cancelCellEdit}
            isLoading={loading}
          />
        </table>
      </div>

      <div className="shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 rounded-b-lg">
        <TablePagination pagination={pagination} bordered={false} />
      </div>
    </div>
  );
}