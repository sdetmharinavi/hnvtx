// @/components/table/DataTable.tsx
import React, { useState, useMemo, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { useTableExcelDownload, useRPCExcelDownload, Column } from "@/hooks/database/excel-queries";
import { 
  TableToolbar,
  TableHeader,
  TableBody,
  TablePagination,
  TableColumnSelector,
  TableFilterPanel
} from "./";
import { DataTableProps, SortConfig } from "@/components/table/datatable-types";
import { AuthTableOrViewName, Row, Filters } from "@/hooks/database";

export function DataTable<T extends AuthTableOrViewName>({
  data = [],
  tableName,
  columns,
  loading = false,
  pagination,
  actions = [],
  searchable = true,
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
  exportOptions,
}: DataTableProps<T>): React.ReactElement {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<SortConfig<Row<T>> | null>(null);
  const [filters, setFilters] = useState<Filters>({});
  const [selectedRows, setSelectedRows] = useState<Row<T>[]>([]);
  const [visibleColumns, setVisibleColumns] = useState<string[]>(columns.map((col) => col.key));
  const [editingCell, setEditingCell] = useState<{ rowIndex: number; columnKey: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const [showColumnSelector, setShowColumnSelector] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const supabase = createClient();

  const tableExcelDownload = useTableExcelDownload<T>(supabase, tableName, {
    showToasts: true,
    onError: (error) => {
      console.error("Table download failed:", error);
      if (exportOptions?.fallbackToCsv !== false) {
        fallbackCsvExport();
      }
    },
  });
  
  const rpcExcelDownload = useRPCExcelDownload<T>(supabase, {
    showToasts: true,
    onError: (error) => {
      console.error("RPC download failed:", error);
      if (exportOptions?.fallbackToCsv !== false) {
        fallbackCsvExport();
      }
    },
  });

  const processedData = useMemo(() => {
    let filtered = [...data];
    if (searchQuery && searchable) {
      filtered = filtered.filter((item) =>
        columns.some((column) => {
          if (!column.searchable) return false;
          const value = column.dataIndex ? item[column.dataIndex as keyof typeof item] : undefined;
          return String(value || "")
            .toLowerCase()
            .includes(searchQuery.toLowerCase());
        })
      );
    }
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        filtered = filtered.filter((item) => {
          const itemValue = item[key as keyof Row<T>];
          if (Array.isArray(value)) {
            const iv = itemValue as unknown;
            if (iv === null || iv === undefined) return false;
            return (value as (string | number)[]).includes(iv as string | number);
          }
          return String(itemValue ?? "").toLowerCase().includes(String(value).toLowerCase());
        });
      }
    });
    if (sortConfig && sortable) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        if (aValue === null || aValue === undefined) return 1;
        if (bValue === null || bValue === undefined) return -1;
        if (typeof aValue === "string" && typeof bValue === "string") {
          return sortConfig.direction === "asc" ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
        }
        return sortConfig.direction === "asc" ? (aValue > bValue ? 1 : -1) : aValue < bValue ? 1 : -1;
      });
    }
    return filtered;
  }, [data, searchQuery, filters, sortConfig, columns, searchable, sortable]);

  const handleSort = (columnKey: keyof Row<T> & string) => {
    if (!sortable) return;
    setSortConfig((current) => {
      if (!current || current.key !== columnKey) return { key: columnKey, direction: "asc" };
      if (current.direction === "asc") return { key: columnKey, direction: "desc" };
      return null;
    });
  };

  const handleRowSelect = useCallback(
    (record: Row<T>, selected: boolean) => {
      if (!selectable) return;
      const newSelection = selected ? [...selectedRows, record] : selectedRows.filter((row) => row !== record);
      setSelectedRows(newSelection);
      onRowSelect?.(newSelection);
    },
    [selectedRows, selectable, onRowSelect]
  );

  const handleSelectAll = useCallback(
    (selected: boolean) => {
      if (!selectable) return;
      const newSelection = selected ? [...processedData] : [];
      setSelectedRows(newSelection);
      onRowSelect?.(newSelection);
    },
    [processedData, selectable, onRowSelect]
  );

  const handleCellEdit = (record: Row<T>, column: Column<Row<T>>, rowIndex: number) => {
    if (!column.editable) return;
    setEditingCell({ rowIndex, columnKey: column.key });
    setEditValue(String(record[column.dataIndex as keyof Row<T>] ?? ""));
  };

  const saveCellEdit = () => {
    if (!editingCell) return;
    const record = processedData[editingCell.rowIndex];
    const column = columns.find((col) => col.key === editingCell.columnKey);
    if (column && onCellEdit) {
      onCellEdit(record, column, editValue);
    }
    setEditingCell(null);
  };

  const cancelCellEdit = () => setEditingCell(null);

  const fallbackCsvExport = useCallback(() => {
    const visibleColumnsForExport = columns.filter((col) => visibleColumns.includes(col.key) && !col.hidden);
    const headers = visibleColumnsForExport.map((col) => col.title);
    const csvContent = [
      headers.join(","),
      ...processedData.map((row) =>
        visibleColumnsForExport
          .map((col) => {
            const value = row[col.dataIndex as keyof Row<T>] || "";
            const stringValue = String(value);
            if (stringValue.includes(",") || stringValue.includes('"') || stringValue.includes("\n")) {
              return `"${stringValue.replace(/"/g, '""')}"`;
            }
            return stringValue;
          })
          .join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = exportOptions?.fileName?.replace(/\.xlsx?$/, '.csv') || `${String(tableName)}-${new Date().toISOString().split("T")[0]}.csv`;
    a.style.display = "none";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [columns, visibleColumns, processedData, exportOptions?.fileName, tableName]);

  const handleExport = async () => {
    const visibleColumnsForExport = columns.filter((col) => visibleColumns.includes(col.key) && !col.hidden);

    if (onExport) {
      try {
        await onExport(processedData, visibleColumnsForExport);
      } catch (error) {
        console.error("Custom export failed:", error);
        if (exportOptions?.fallbackToCsv !== false) {
          fallbackCsvExport();
        }
      }
      return;
    }

    if (exportOptions?.fallbackToCsv === true) {
      fallbackCsvExport();
      return;
    }

    if (exportOptions?.rpcConfig) {
      const rpcOptions = {
        fileName: exportOptions.fileName || `${String(tableName)}-export.xlsx`,
        sheetName: exportOptions.sheetName || String(tableName),
        filters: exportOptions.filters,
        columns: visibleColumnsForExport as Column<Row<T>>[],
        maxRows: exportOptions.maxRows,
        customStyles: exportOptions.customStyles,
        rpcConfig: exportOptions.rpcConfig,
      };
      rpcExcelDownload.mutate(rpcOptions);
    } else {
      const tableOptions = {
        fileName: exportOptions?.fileName || `${String(tableName)}-export.xlsx`,
        sheetName: exportOptions?.sheetName || String(tableName),
        filters: exportOptions?.filters,
        columns: visibleColumnsForExport as Column<Row<T>>[],
        maxRows: exportOptions?.maxRows,
        customStyles: exportOptions?.customStyles,
      };
      tableExcelDownload.mutate(tableOptions);
    }
  };

  const visibleColumnsData = columns.filter((col) => visibleColumns.includes(col.key) && !col.hidden);
  const hasActions = actions.length > 0;
  const isExporting = tableExcelDownload.isPending || rpcExcelDownload.isPending;

  return (
    <div className={`relative bg-white dark:bg-gray-800 rounded-lg ${bordered ? "border border-gray-200 dark:border-gray-700" : ""} ${className}`}>
      <div className="relative">
        <TableToolbar
          title={title}
          searchable={searchable}
          filterable={filterable}
          exportable={exportable}
          refreshable={refreshable}
          customToolbar={customToolbar}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          showFilters={showFilters}
          setShowFilters={setShowFilters}
          showColumnSelector={showColumnSelector}
          setShowColumnSelector={setShowColumnSelector}
          onRefresh={onRefresh}
          onExport={handleExport}
          loading={loading}
          isExporting={isExporting}
        />

        <TableColumnSelector
          columns={columns}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
          showColumnSelector={showColumnSelector}
          setShowColumnSelector={setShowColumnSelector}
        />
      </div>

      <TableFilterPanel
        columns={columns}
        filters={filters}
        setFilters={setFilters}
        showFilters={showFilters}
        filterable={filterable}
      />

      <div className='overflow-x-auto'>
        <table className={`w-full ${bordered ? "border-separate border-spacing-0" : ""}`}>
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
            allSelected={selectedRows.length === processedData.length}
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
            setEditValue={setEditValue}
            setEditingCell={setEditingCell}
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