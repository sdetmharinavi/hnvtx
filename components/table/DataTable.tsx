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