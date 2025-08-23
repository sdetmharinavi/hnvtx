<!-- path: /home/au/Desktop/git_projects/newhnvtx/hnvtx/components/table/TableHeader.tsx -->
```typescript
// @/components/table/TableHeader.tsx
import React from "react";
import { FiArrowUp, FiArrowDown } from "react-icons/fi";
import { DataTableProps, SortConfig } from "@/components/table/datatable-types";
import { AuthTableOrViewName, Row } from "@/hooks/database";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import { TruncateTooltip } from "@/components/common/TruncateTooltip";

interface TableHeaderProps<T extends AuthTableOrViewName>
  extends Pick<
    DataTableProps<T>,
    "columns" | "selectable" | "sortable" | "bordered" | "density" | "actions"
  > {
  visibleColumns: Column<Row<T>>[];
  hasActions: boolean;
  sortConfig: SortConfig<Row<T>> | null;
  onSort: (key: keyof Row<T> & string) => void;
  onSelectAll: (selected: boolean) => void;
  allSelected: boolean;
  hasData: boolean;
}


const densityClasses = {
  compact: "py-1 px-2 sm:px-3",
  default: "py-2 px-3 sm:py-3 sm:px-4",
  comfortable: "py-3 px-4 sm:py-4 sm:px-6",
};

function TableHeaderBase<
  T extends AuthTableOrViewName
>({
  visibleColumns,
  selectable,
  sortable,
  bordered,
  density,
  hasActions,
  sortConfig,
  onSort,
  onSelectAll,
  allSelected,
  hasData,
}: TableHeaderProps<T>) {
  return (
    <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10">
      <tr>
        {selectable && (
          <th
            className={`w-12 px-2 sm:px-4 py-2 sm:py-3 text-left whitespace-nowrap overflow-hidden ${
              bordered
                ? "border-b border-r border-gray-200 dark:border-gray-700"
                : ""
            }`}
            style={{ width: 48, minWidth: 48, maxWidth: 48 }}
          >
            <input
              type="checkbox"
              checked={allSelected && hasData}
              onChange={(e) => onSelectAll(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              aria-label="Select all rows"
            />
          </th>
        )}
        {hasActions && (
          <th
            className={`w-32 text-center whitespace-nowrap overflow-hidden ${
              densityClasses[density ?? "default"]
            } text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${
              bordered ? "border-b border-gray-200 dark:border-gray-700" : ""
            }`}
            style={{ width: 128, minWidth: 128, maxWidth: 128 }}
          >
            <span className="hidden sm:inline">Actions</span>
            <span className="sm:hidden">•••</span>
          </th>
        )}
        {visibleColumns.map((column, index) => (
          <th
            key={column.key}
            className={`${
              densityClasses[density ?? "default"]
            } text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${
              column.sortable && sortable
                ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
                : ""
            } ${
              column.align === "center"
                ? "text-center"
                : column.align === "right"
                ? "text-right"
                : ""
            } ${
              bordered
                ? `border-b ${
                    index < visibleColumns.length - 1 || hasActions
                      ? "border-r"
                      : ""
                  } border-gray-200 dark:border-gray-700`
                : ""
            }`}
            style={{
              width: column.width,
              minWidth: column.width ? undefined : "80px",
              maxWidth: "350px",
            }}
            onClick={() =>
              column.sortable &&
              sortable &&
              onSort(column.dataIndex as keyof Row<T> & string)
            }
          >
            <div className="flex items-center gap-1 sm:gap-2 min-w-0">
              <div className="min-w-0 flex-1">
                <TruncateTooltip
                  text={column.title}
                  id={`header-${column.key}`}
                  className="text-xs sm:text-sm"
                />
              </div>

              {column.sortable && sortable && (
                <div className="flex flex-col flex-shrink-0" aria-hidden="true">
                  <FiArrowUp
                    size={10}
                    className={`sm:size-3 ${
                      sortConfig?.key === column.dataIndex &&
                      sortConfig.direction === "asc"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                  <FiArrowDown
                    size={10}
                    className={`-mt-0.5 sm:size-3 sm:-mt-1 ${
                      sortConfig?.key === column.dataIndex &&
                      sortConfig.direction === "desc"
                        ? "text-blue-600 dark:text-blue-400"
                        : "text-gray-300 dark:text-gray-600"
                    }`}
                  />
                </div>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );
}

export const TableHeader = React.memo(TableHeaderBase) as <T extends AuthTableOrViewName>(
  props: TableHeaderProps<T>
) => React.ReactElement;

```

<!-- path: /home/au/Desktop/git_projects/newhnvtx/hnvtx/components/table/index.ts -->
```typescript
export * from "./DataTable";
export * from "./TableHeader";
export * from "./TableBody";
export * from "./TablePagination";
export * from "./TableColumnSelector";
export * from "./TableFilterPanel";
export * from "./TableToolbar";
export * from "./datatable-types";
```

<!-- path: /home/au/Desktop/git_projects/newhnvtx/hnvtx/components/table/TableFilterPanel.tsx -->
```typescript
// @/components/table/TableFilterPanel.tsx
import React, { useState, useEffect } from "react";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import { AuthTableOrViewName, Row, Filters } from "@/hooks/database";
import { useDebounce } from "@/hooks/useDebounce";

interface TableFilterPanelProps<T extends AuthTableOrViewName> {
  columns: Column<Row<T>>[];
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  showFilters: boolean;
  filterable: boolean;
}

const DebouncedInput = ({ value, onChange, placeholder, className }: { value: string; onChange: (value: string) => void; placeholder: string; className: string; }) => {
    const [internalValue, setInternalValue] = useState(value);
    const debouncedValue = useDebounce(internalValue, 500);

    useEffect(() => {
        onChange(debouncedValue);
    }, [debouncedValue, onChange]);

    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    return (
        <input
            type='text'
            value={internalValue}
            onChange={(e) => setInternalValue(e.target.value)}
            placeholder={placeholder}
            className={className}
        />
    );
};

export function TableFilterPanel<T extends AuthTableOrViewName>({
  columns,
  filters,
  setFilters,
  showFilters,
  filterable,
}: TableFilterPanelProps<T>) {
  if (!showFilters || !filterable) return null;

  return (
    <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg'>
      {columns
        .filter((col) => col.filterable)
        .map((column) => (
          <div key={column.key} className='flex flex-col gap-1'>
            <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>{column.title}</label>
            {column.filterOptions ? (
              <select
                value={String(filters[column.dataIndex] ?? '')}
                onChange={(e) => setFilters({ ...filters, [column.dataIndex]: e.target.value })}
                className='px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              >
                <option value=''>All</option>
                {column.filterOptions.map((option) => (
                  <option key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <DebouncedInput
                value={typeof filters[column.dataIndex] === 'string' ? (filters[column.dataIndex] as string) : ''}
                onChange={(value) => setFilters(prev => ({ ...prev, [column.dataIndex]: value }))}
                placeholder={`Filter ${column.title.toLowerCase()}...`}
                className='px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'
              />
            )}
          </div>
        ))}
      {Object.keys(filters).length > 0 && (
        <div className='flex items-end'>
          <button 
            onClick={() => setFilters({})} 
            className='px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors'
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}
```

<!-- path: /home/au/Desktop/git_projects/newhnvtx/hnvtx/components/table/DataTable.tsx -->
```typescript
// @/components/table/DataTable.tsx
import React, { useMemo, useCallback, useEffect, useReducer } from "react";
import { createClient } from "@/utils/supabase/client";
import { useTableExcelDownload, useRPCExcelDownload } from "@/hooks/database/excel-queries";
import { TableToolbar, TableHeader, TableBody, TablePagination, TableFilterPanel } from "./";
import { DataTableProps, SortConfig } from "@/components/table/datatable-types";
import { AuthTableOrViewName, Row, Filters } from "@/hooks/database";
import { Column, DownloadOptions, RPCConfig } from "@/hooks/database/excel-queries/excel-helpers";

// Define a type for your row that guarantees a unique identifier
type DataRow<T extends AuthTableOrViewName> = Row<T> & { id: string | number };

// --- State Management with useReducer ---

type TableState<T extends AuthTableOrViewName> = {
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

type TableAction<T extends AuthTableOrViewName> =
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_SORT_CONFIG'; payload: SortConfig<Row<T>> | null }
  | { type: 'SET_FILTERS'; payload: Filters }
  | { type: 'SET_SELECTED_ROWS'; payload: DataRow<T>[] }
  | { type: 'SET_VISIBLE_COLUMNS'; payload: string[] }
  | { type: 'START_EDIT_CELL'; payload: { rowIndex: number; columnKey: string; value: string } }
  | { type: 'SET_EDIT_VALUE'; payload: string }
  | { type: 'CANCEL_EDIT' }
  | { type: 'TOGGLE_COLUMN_SELECTOR'; payload?: boolean }
  | { type: 'TOGGLE_FILTERS'; payload?: boolean };

function tableReducer<T extends AuthTableOrViewName>(state: TableState<T>, action: TableAction<T>): TableState<T> {
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
      return { ...state, editingCell: { rowIndex: action.payload.rowIndex, columnKey: action.payload.columnKey }, editValue: action.payload.value };
    case 'SET_EDIT_VALUE':
      return { ...state, editValue: action.payload };
    case 'CANCEL_EDIT':
      return { ...state, editingCell: null, editValue: '' };
    case 'TOGGLE_COLUMN_SELECTOR':
      return { ...state, showColumnSelector: action.payload ?? !state.showColumnSelector };
    case 'TOGGLE_FILTERS':
      return { ...state, showFilters: action.payload ?? !state.showFilters };
    default:
      return state;
  }
}

export function DataTable<T extends AuthTableOrViewName>({
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
  density = "default",
  bordered = true,
  striped = true,
  hoverable = true,
  className = "",
  emptyText = "No data available",
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
  const { searchQuery, sortConfig, filters, selectedRows, visibleColumns, editingCell, editValue, showColumnSelector, showFilters } = state;
  
  const supabase = createClient();

  useEffect(() => {
    if (typeof showColumnSelectorProp === "boolean") {
      dispatch({ type: 'TOGGLE_COLUMN_SELECTOR', payload: showColumnSelectorProp });
    }
  }, [showColumnSelectorProp]);

  useEffect(() => {
    if (!filterable) {
      dispatch({ type: 'SET_FILTERS', payload: {} });
    }
  }, [filterable]);
  
  // (Excel download hooks remain the same)
  const tableExcelDownload = useTableExcelDownload<T>(supabase, tableName, { showToasts: true });
  const rpcExcelDownload = useRPCExcelDownload<T>(supabase, { showToasts: true });

  const processedData = useMemo(() => {
    let filteredData = [...data] as DataRow<T>[];

    if (searchQuery && searchable && !serverSearch) {
      const q = searchQuery.toLowerCase();
      filteredData = filteredData.filter(item =>
        columns.some(column => {
          if (column.searchable === false) return false;
          const value = item[column.dataIndex as keyof typeof item];
          return String(value ?? "").toLowerCase().includes(q);
        })
      );
    }

    if (filterable && Object.keys(filters).length > 0) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== "") {
          filteredData = filteredData.filter(item =>
            String(item[key as keyof DataRow<T>] ?? "").toLowerCase().includes(String(value).toLowerCase())
          );
        }
      });
    }
    
    if (sortConfig && sortable) {
      filteredData.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        return sortConfig.direction === 'asc' ? (aValue > bValue ? 1 : -1) : (aValue < bValue ? 1 : -1);
      });
    }

    return filteredData;
  }, [data, searchQuery, filters, sortConfig, columns, searchable, sortable, filterable, serverSearch]);

  const handleSort = useCallback((columnKey: keyof Row<T> & string) => {
    if (!sortable) return;
    const direction = sortConfig?.key === columnKey && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    if (sortConfig?.key === columnKey && sortConfig.direction === 'desc') {
      dispatch({ type: 'SET_SORT_CONFIG', payload: null });
    } else {
      dispatch({ type: 'SET_SORT_CONFIG', payload: { key: columnKey, direction } });
    }
  }, [sortable, sortConfig]);

  const handleRowSelect = useCallback((record: DataRow<T>, selected: boolean) => {
    const newSelection = selected
      ? [...selectedRows, record]
      : selectedRows.filter(row => row.id !== record.id);
    dispatch({ type: 'SET_SELECTED_ROWS', payload: newSelection });
    onRowSelect?.(newSelection);
  }, [selectedRows, onRowSelect]);

  const handleSelectAll = useCallback((selected: boolean) => {
    const newSelection = selected ? [...processedData] : [];
    dispatch({ type: 'SET_SELECTED_ROWS', payload: newSelection });
    onRowSelect?.(newSelection);
  }, [processedData, onRowSelect]);

  const handleCellEdit = useCallback((record: DataRow<T>, column: Column<Row<T>>, rowIndex: number) => {
    if (!column.editable) return;
    dispatch({ type: 'START_EDIT_CELL', payload: { rowIndex, columnKey: column.key, value: String(record[column.dataIndex as keyof DataRow<T>] ?? "") } });
  }, []);

  const saveCellEdit = useCallback(() => {
    if (!editingCell) return;
    const record = processedData[editingCell.rowIndex];
    const column = columns.find(col => col.key === editingCell.columnKey);
    if (column && onCellEdit) {
      onCellEdit(record, column, editValue);
    }
    dispatch({ type: 'CANCEL_EDIT' });
  }, [editingCell, processedData, columns, onCellEdit, editValue]);
  
  const cancelCellEdit = useCallback(() => dispatch({ type: 'CANCEL_EDIT' }), []);

  const visibleColumnsData = useMemo<Column<Row<T>>[]>(
    () => columns.filter(col => visibleColumns.includes(col.key) && !col.hidden),
    [columns, visibleColumns]
  );

  const setSearchQueryCb = useCallback((query: string) => {
    dispatch({ type: 'SET_SEARCH_QUERY', payload: query });
  }, []);

  const handleExport = useCallback(async () => {
    // 1) If a custom export handler is provided by the parent, use it
    if (onExport) {
      await onExport(processedData as Row<T>[], visibleColumnsData as Column<Row<T>>[]);
      return;
    }

    // 2) Build export options: prefer explicit options, else use current visible columns and filters
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
      // 3) Use RPC-based download if rpcConfig is provided; otherwise, table/view download
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
      // 4) Optional CSV fallback using currently processed rows
      if (exportOptions?.fallbackToCsv) {
        try {
          const headers = columnsToExport.map((c) => c.title).join(",");
          const keys = columnsToExport.map((c) => c.dataIndex as keyof Row<T> & string);
          const rows = (processedData as Row<T>[])?.map((r) =>
            keys
              .map((k) => {
                const v = (r as Row<T>)[k] as unknown;
                if (v === null || v === undefined) return "";
                const s = String(v).replace(/"/g, '""');
                return `"${s}"`;
              })
              .join(",")
          );
          const csv = [headers, ...(rows || [])].join("\n");
          const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
          const link = document.createElement("a");
          const csvName = (exportOptions?.fileName?.replace(/\.xlsx$/i, "") || "export") + ".csv";
          link.href = URL.createObjectURL(blob);
          link.download = csvName;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);
        } catch {
          // If CSV fallback also fails, rethrow original error
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

  return (
    <div className={`relative bg-white dark:bg-gray-800 rounded-lg ${bordered ? "border border-gray-200 dark:border-gray-700" : ""} ${className}`}>
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
        setShowColumnSelector={(show) => dispatch({ type: 'TOGGLE_COLUMN_SELECTOR', payload: show })}
        showColumnsToggle={showColumnsToggle}
        columns={columns}
        visibleColumns={visibleColumns}
        setVisibleColumns={(cols: string[]) => dispatch({ type: 'SET_VISIBLE_COLUMNS', payload: cols })}
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

      <div className='max-h-[calc(100vh-200px)] overflow-auto'>
        <table className={`w-full table-fixed ${bordered ? "border-separate border-spacing-0" : ""}`}>
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
          />
        </table>
      </div>
      <TablePagination pagination={pagination} bordered={bordered} />
    </div>
  );
}
```

<!-- path: /home/au/Desktop/git_projects/newhnvtx/hnvtx/components/table/datatable-types.ts -->
```typescript
// @/components/table/types.ts
import { AuthTableOrViewName, Row, Filters } from "@/hooks/database";
import { Column, RPCConfig, ExcelStyles } from "@/hooks/database/excel-queries/excel-helpers";

export interface TableAction<T extends AuthTableOrViewName> {
  key: string;
  label: string;
  icon?: React.ReactNode;
  onClick: (record: Row<T>, index?: number) => void;
  variant?: "primary" | "secondary" | "danger" | "success";
  disabled?: (record: Row<T>) => boolean;
  hidden?: (record: Row<T>) => boolean;
}

export interface DownloadOptions<T extends AuthTableOrViewName> {
  fileName?: string;
  filters?: Filters;
  columns?: Column<Row<T>>[];
  sheetName?: string;
  maxRows?: number;
  customStyles?: ExcelStyles;
  rpcConfig?: RPCConfig;
}

export interface DataTableProps<T extends AuthTableOrViewName> {
  data: Row<T>[];
  tableName: T;
  columns: Column<Row<T>>[];
  loading?: boolean;
  showColumnSelector?: boolean;
  // Controls visibility of the Columns toggle button in the toolbar
  showColumnsToggle?: boolean;
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    showSizeChanger?: boolean;
    pageSizeOptions?: number[];
    onChange: (page: number, pageSize: number) => void;
  };
  actions?: TableAction<T>[];
  searchable?: boolean;
  // If true, DataTable will not perform client-side search and will delegate to parent via onSearchChange
  serverSearch?: boolean;
  filterable?: boolean;
  sortable?: boolean;
  selectable?: boolean;
  exportable?: boolean;
  refreshable?: boolean;
  density?: "compact" | "default" | "comfortable";
  bordered?: boolean;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
  emptyText?: string;
  title?: string;
  onRefresh?: () => void;
  // Called when the search query changes; useful for server-side search or fetching more rows
  onSearchChange?: (query: string) => void;
  onExport?: (data: Row<T>[], columns: Column<Row<T>>[]) => void | Promise<void>;
  onRowSelect?: (selectedRows: Row<T>[]) => void;
  onCellEdit?: (record: Row<T>, column: Column<Row<T>>, newValue: string) => void;
  customToolbar?: React.ReactNode;
  exportOptions?: {
    fileName?: string;
    sheetName?: string;
    includeFilters?: boolean;
    maxRows?: number;
    rpcConfig?: RPCConfig;
    fallbackToCsv?: boolean;
  } & Omit<DownloadOptions<T>, "rpcConfig">;
}

export type SortDirection = "asc" | "desc";
export interface SortConfig<T> {
  key: keyof T & string;
  direction: SortDirection;
}

export type TablePaginationProps = Pick<DataTableProps<AuthTableOrViewName>, 'pagination' | 'bordered'>;

```

<!-- path: /home/au/Desktop/git_projects/newhnvtx/hnvtx/components/table/TablePagination.tsx -->
```typescript
// @/components/table/TablePagination.tsx
import React from "react";
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from "react-icons/fi";
import { TablePaginationProps } from "@/components/table/datatable-types";



export function TablePagination({ pagination, bordered }: TablePaginationProps) {
  if (!pagination || pagination.total <= 0) return null;

  return (
    <div className={`px-4 py-3 ${bordered ? "border-t border-gray-200 dark:border-gray-700" : ""} flex flex-col sm:flex-row items-center justify-between gap-4`}>
      <div className='flex items-center gap-4 text-sm text-gray-700 dark:text-gray-300'>
        <span>
          Showing {(pagination.current - 1) * pagination.pageSize + 1} to {Math.min(pagination.current * pagination.pageSize, pagination.total)} of {pagination.total} results
        </span>
        {pagination.showSizeChanger && (
          <select
            value={pagination.pageSize}
            onChange={(e) => pagination.onChange(1, Number(e.target.value))}
            className='px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700'
          >
            {(pagination.pageSizeOptions || [10, 20, 50, 100]).map((size) => (
              <option key={size} value={size}>
                {size} per page
              </option>
            ))}
          </select>
        )}
      </div>
      <div className='flex items-center gap-2'>
        <button
          onClick={() => pagination.onChange(1, pagination.pageSize)}
          disabled={pagination.current === 1}
          className='p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <FiChevronsLeft size={16} />
        </button>
        <button
          onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
          disabled={pagination.current === 1}
          className='p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <FiChevronLeft size={16} />
        </button>
        <span className='px-4 py-2 text-sm text-gray-700 dark:text-gray-300'>
          Page {pagination.current} of {Math.ceil(pagination.total / pagination.pageSize)}
        </span>
        <button
          onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
          disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
          className='p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <FiChevronRight size={16} />
        </button>
        <button
          onClick={() => pagination.onChange(Math.ceil(pagination.total / pagination.pageSize), pagination.pageSize)}
          disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
          className='p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed'
        >
          <FiChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
```

<!-- path: /home/au/Desktop/git_projects/newhnvtx/hnvtx/components/table/TableBody.tsx -->
```typescript
// @/components/table/TableBody.tsx
import React, { useRef, useEffect } from "react";
import { FiEdit3, FiCheck, FiX } from "react-icons/fi";
import { DataTableProps } from "@/components/table/datatable-types";
import { AuthTableOrViewName, Row } from "@/hooks/database";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import { TruncateTooltip } from "@/components/common/TruncateTooltip";

// Define a type for your row that guarantees a unique identifier
type DataRow<T extends AuthTableOrViewName> = Row<T> & { id: string | number };

interface TableBodyProps<T extends AuthTableOrViewName> extends Pick<DataTableProps<T>, "columns" | "selectable" | "bordered" | "density" | "actions" | "striped" | "hoverable" | "loading" | "emptyText"> {
  processedData: DataRow<T>[];
  visibleColumns: Column<Row<T>>[];
  hasActions: boolean;
  selectedRows: DataRow<T>[];
  editingCell: { rowIndex: number; columnKey: string } | null;
  editValue: string;
  setEditValue: (value: string) => void;
  onRowSelect: (record: DataRow<T>, selected: boolean) => void;
  onCellEdit: (record: DataRow<T>, column: Column<Row<T>>, rowIndex: number) => void;
  saveCellEdit: () => void;
  cancelCellEdit: () => void;
}

interface TableRowProps<T extends AuthTableOrViewName> extends Omit<TableBodyProps<T>, 'processedData' | 'loading' | 'emptyText'> {
    record: DataRow<T>;
    rowIndex: number;
    isSelected: boolean;
}

const densityClasses = { compact: "py-1 px-3", default: "py-3 px-4", comfortable: "py-4 px-6" };

// Base Table Row component (generic). We'll memoize it below with a type assertion to preserve generics.
function TableRowBase<T extends AuthTableOrViewName>({
    record,
    rowIndex,
    isSelected,
    visibleColumns,
    selectable,
    bordered,
    density,
    actions,
    hasActions,
    striped,
    hoverable,
    selectedRows,
    editingCell,
    editValue,
    setEditValue,
    onRowSelect,
    onCellEdit,
    saveCellEdit,
    cancelCellEdit
}: TableRowProps<T>) {
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingCell && editingCell.rowIndex === rowIndex) {
            editInputRef.current?.focus();
            editInputRef.current?.select();
        }
    }, [editingCell, rowIndex]);
    
    return (
        <tr
          className={`${striped && rowIndex % 2 === 1 ? "bg-gray-50/50 dark:bg-gray-700/25" : ""} ${hoverable ? "hover:bg-gray-50 dark:hover:bg-gray-700/50" : ""} ${
            isSelected ? "bg-blue-50 dark:bg-blue-900/20" : ""
          } transition-colors`}>
          {selectable && (
            <td className={`w-12 px-4 py-3 whitespace-nowrap overflow-hidden ${bordered ? `${rowIndex < selectedRows.length - 1 ? "border-b" : ""} border-r border-gray-200 dark:border-gray-700` : ""}`}
                style={{ width: 48, minWidth: 48, maxWidth: 48 }}>
              <input type='checkbox' checked={isSelected} onChange={(e) => onRowSelect(record, e.target.checked)} className='rounded border-gray-300 text-blue-600 focus:ring-blue-500' aria-label={`Select row ${rowIndex + 1}`} />
            </td>
          )}
          {hasActions && (
            <td className={`w-32 ${densityClasses[density ?? "default"]} text-right whitespace-nowrap overflow-hidden ${bordered ? `${rowIndex < selectedRows.length - 1 ? "border-b" : ""} border-gray-200 dark:border-gray-700` : ""}`}
                style={{ width: 128, minWidth: 128, maxWidth: 128 }}>
              <div className='flex items-center justify-end gap-1'>
                {actions?.map((action) => {
                  if (action.hidden?.(record)) return null;
                  const isDisabled = action.disabled?.(record);
                  const variants = {
                    primary: "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",
                    secondary: "text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300",
                    danger: "text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300",
                    success: "text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300",
                  };
                  return (
                    <button
                      key={action.key}
                      onClick={() => !isDisabled && action.onClick(record, rowIndex)}
                      disabled={isDisabled}
                      className={`p-1 rounded transition-colors ${isDisabled ? "opacity-50 cursor-not-allowed" : variants[action.variant || "secondary"]}`}
                      title={action.label}>
                      {action.icon}
                    </button>
                  );
                })}
              </div>
            </td>
          )}
          {visibleColumns.map((column, colIndex) => (
            <td
              key={column.key}
              className={`${densityClasses[density ?? "default"]} text-sm text-gray-900 dark:text-white ${column.align === "center" ? "text-center" : column.align === "right" ? "text-right" : ""} ${
                column.editable ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50" : ""
              } ${bordered ? `${rowIndex < selectedRows.length - 1 ? "border-b" : ""} ${colIndex < visibleColumns.length - 1 || hasActions ? "border-r" : ""} border-gray-200 dark:border-gray-700` : ""} overflow-hidden`}
              style={{ width: column.width, minWidth: column.width ? undefined : "80px", maxWidth: "350px" }}
              onClick={() => column.editable && onCellEdit(record, column, rowIndex)}>
              {editingCell?.rowIndex === rowIndex && editingCell?.columnKey === column.key ? (
                <div className='flex items-center gap-2'>
                  <input
                    ref={editInputRef}
                    type='text'
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveCellEdit();
                      if (e.key === "Escape") cancelCellEdit();
                    }}
                    className='flex-1 px-2 py-1 text-sm border border-blue-500 rounded bg-white dark:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
                  />
                  <button onClick={saveCellEdit} className='p-1 text-green-600 hover:text-green-700' aria-label="Save cell edit">
                    <FiCheck size={14} />
                  </button>
                  <button onClick={cancelCellEdit} className='p-1 text-red-600 hover:text-red-700' aria-label="Cancel cell edit">
                    <FiX size={14} />
                  </button>
                </div>
              ) : (
                <div className='flex items-center gap-2 group min-w-0'>
                  {column.render ? (
                    column.render(
                      record[column.dataIndex as keyof DataRow<T>],
                      record,
                      rowIndex
                    )
                  ) : (
                    <TruncateTooltip
                      text={String(record[column.dataIndex as keyof DataRow<T>] ?? "—")}
                      className="text-sm"
                    />
                  )}
                  {column.editable && <FiEdit3 size={12} className='opacity-0 group-hover:opacity-50 text-gray-400' />}
                </div>
              )}
            </td>
          ))}
        </tr>
    );
}

// Memoized Table Row component for performance optimization (preserve generics via assertion)
const MemoizedTableRow = React.memo(TableRowBase) as <T extends AuthTableOrViewName>(
  props: TableRowProps<T>
) => React.ReactElement;

// Base TableBody component (generic). We'll memoize with a type assertion below to preserve generics.
function TableBodyBase<T extends AuthTableOrViewName>({
  processedData,
  visibleColumns,
  loading,
  emptyText,
  ...rest
}: TableBodyProps<T>) {

  if (loading) {
    return (
      <tbody>
        <tr>
          <td colSpan={visibleColumns.length + (rest.selectable ? 1 : 0) + (rest.hasActions ? 1 : 0)} className={rest.bordered ? "border-b border-gray-200 dark:border-gray-700" : ""}>
            <div className='flex items-center justify-center py-12'>
              <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  if (processedData.length === 0) {
    return (
      <tbody>
        <tr>
          <td colSpan={visibleColumns.length + (rest.selectable ? 1 : 0) + (rest.hasActions ? 1 : 0)} className={rest.bordered ? "border-b border-gray-200 dark:border-gray-700" : ""}>
            <div className='text-center py-12'>
              <div className='text-gray-400 dark:text-gray-500 text-lg mb-2'>📄</div>
              <p className='text-gray-500 dark:text-gray-400'>{emptyText}</p>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  const selectedRowIds = new Set(rest.selectedRows.map(r => (r as DataRow<T>).id));

  return (
    <tbody className={`bg-white dark:bg-gray-800 ${rest.striped && !rest.bordered ? "divide-y divide-gray-200 dark:divide-gray-700" : ""}`}>
      {processedData.map((record, rowIndex) => (
        <MemoizedTableRow
            key={record.id} // IMPORTANT: Use a stable, unique ID
            record={record}
            rowIndex={rowIndex}
            visibleColumns={visibleColumns}
            isSelected={selectedRowIds.has(record.id)}
            {...rest}
        />
      ))}
    </tbody>
  );
}

export const TableBody = React.memo(TableBodyBase) as <T extends AuthTableOrViewName>(
  props: TableBodyProps<T>
) => React.ReactElement;
```

<!-- path: /home/au/Desktop/git_projects/newhnvtx/hnvtx/components/table/TableColumnSelector.tsx -->
```typescript
// @/components/table/TableColumnSelector.tsx
import React from "react";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import { AuthTableOrViewName, Row } from "@/hooks/database";

interface TableColumnSelectorProps<T extends AuthTableOrViewName> {
  columns: Column<Row<T>>[];
  visibleColumns: string[];
  setVisibleColumns: (columns: string[]) => void;
  showColumnSelector: boolean;
  setShowColumnSelector: (show: boolean) => void;
}

export function TableColumnSelector<T extends AuthTableOrViewName>({
  columns,
  visibleColumns,
  setVisibleColumns,
  showColumnSelector,
  setShowColumnSelector,
}: TableColumnSelectorProps<T>) {
  if (!showColumnSelector) return null;

  return (
    <>
      {/* Dropdown content; positioning handled by parent wrapper */}
      <div className='mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg'>
        <div className='p-3 border-b border-gray-200 dark:border-gray-700'>
          <h4 className='font-medium text-gray-900 dark:text-white'>Show/Hide Columns</h4>
        </div>
        <div className='p-2 max-h-64 overflow-y-auto'>
          {columns.map((column) => (
            <label key={column.key} className='flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer'>
              <input
                type='checkbox'
                checked={visibleColumns.includes(column.key)}
                onChange={(e) => {
                  setVisibleColumns(e.target.checked ? [...visibleColumns, column.key] : visibleColumns.filter((k) => k !== column.key));
                }}
                className='rounded border-gray-300 text-blue-600 focus:ring-blue-500'
              />
              <span className='text-sm text-gray-700 dark:text-gray-300'>{column.title}</span>
            </label>
          ))}
        </div>
      </div>
      {/* Backdrop to capture outside clicks */}
      <div className='fixed inset-0 z-40' onClick={() => setShowColumnSelector(false)} />
    </>
  );
}
```

<!-- path: /home/au/Desktop/git_projects/newhnvtx/hnvtx/components/table/TableToolbar.tsx -->
```typescript
// @/components/table/TableToolbar.tsx
import React, { useState, useEffect, useRef } from "react";
import { FiSearch, FiFilter, FiDownload, FiRefreshCw, FiEye, FiChevronDown } from "react-icons/fi";
import { DataTableProps } from "@/components/table/datatable-types";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import { Row } from "@/hooks/database";
import { TableColumnSelector } from "./TableColumnSelector";
import { AuthTableOrViewName } from "@/hooks/database";
import { useDebounce } from "@/hooks/useDebounce";

interface TableToolbarProps<T extends AuthTableOrViewName> extends Pick<DataTableProps<T>, 
  | 'searchable'
  | 'filterable'
  | 'exportable'
  | 'refreshable'
  | 'title'
  | 'customToolbar'
  | 'onRefresh'
  | 'loading'
> {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSearchChange?: (query: string) => void;
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  showColumnSelector: boolean;
  setShowColumnSelector: (show: boolean) => void;
  showColumnsToggle?: boolean;
  columns: Column<Row<T>>[];
  visibleColumns: string[];
  setVisibleColumns: (cols: string[]) => void;
  onExport: () => void;
  isExporting: boolean;
}

export function TableToolbar<T extends AuthTableOrViewName>({
  title,
  searchable,
  filterable,
  exportable,
  refreshable,
  customToolbar,
  searchQuery,
  setSearchQuery,
  onSearchChange,
  showFilters,
  setShowFilters,
  showColumnSelector,
  setShowColumnSelector,
  showColumnsToggle,
  columns,
  visibleColumns,
  setVisibleColumns,
  onRefresh,
  onExport,
  loading,
  isExporting,
}: TableToolbarProps<T>) {

  const [internalSearchQuery, setInternalSearchQuery] = useState(searchQuery);
  const debouncedSearchQuery = useDebounce(internalSearchQuery, 300);
  const setSearchQueryRef = useRef(setSearchQuery);
  const onSearchChangeRef = useRef(onSearchChange);

  // Keep refs in sync with latest props without retriggering the search effect
  useEffect(() => {
    setSearchQueryRef.current = setSearchQuery;
  }, [setSearchQuery]);
  useEffect(() => {
    onSearchChangeRef.current = onSearchChange;
  }, [onSearchChange]);

  // Only react to content changes, not function identity changes
  useEffect(() => {
    setSearchQueryRef.current(debouncedSearchQuery);
    onSearchChangeRef.current?.(debouncedSearchQuery);
  }, [debouncedSearchQuery]);

  useEffect(() => {
    setInternalSearchQuery(searchQuery);
  }, [searchQuery]);


  return (
    <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
      {title && (
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          {title}
        </h3>
      )}
      
      <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
        {!customToolbar && (
          <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-1 sm:gap-3">
              {searchable && (
                <div className="relative flex-1 sm:max-w-sm">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
                  <input
                    type="text"
                    placeholder="Search..."
                    value={internalSearchQuery}
                    onChange={(e) => setInternalSearchQuery(e.target.value)}
                    className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              )}
              {filterable && (
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`flex items-center justify-center gap-2 px-3 py-2 text-sm sm:text-base border rounded-lg transition-colors min-w-0 ${
                    showFilters
                      ? "border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/50 dark:text-blue-300"
                      : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <FiFilter size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Filters</span>
                  <span className="sm:hidden">Filter</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Right-side controls should be available even when customToolbar is used */}
        <div className="flex w-full sm:w-auto sm:flex-none items-center gap-2 sm:gap-3 justify-end mt-1 sm:mt-0 ml-auto">
          {(showColumnsToggle || (!customToolbar && true)) && (
            <div className="relative">
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
                aria-label="Show/Hide Columns"
              >
                <FiEye size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Columns</span>
                <FiChevronDown size={12} className="sm:w-3.5 sm:h-3.5" />
              </button>
              <div className="absolute right-0 top-full z-50">
                <TableColumnSelector
                  columns={columns}
                  visibleColumns={visibleColumns}
                  setVisibleColumns={setVisibleColumns}
                  showColumnSelector={showColumnSelector}
                  setShowColumnSelector={setShowColumnSelector}
                />
              </div>
            </div>
          )}

          {refreshable && onRefresh && (
            <button
              onClick={onRefresh}
              disabled={loading}
              className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 flex-shrink-0"
              aria-label="Refresh data"
            >
              <FiRefreshCw size={14} className={`${loading ? "animate-spin" : ""}`} />
            </button>
          )}

          {exportable && (
            <button
              onClick={onExport}
              disabled={isExporting}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
            >
              <FiDownload size={14} />
              <span className="hidden sm:inline">{isExporting ? "Exporting..." : "Export"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
```

