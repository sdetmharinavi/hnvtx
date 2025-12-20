// @/components/table/TableBody.tsx
import React, { useRef, useEffect } from "react";
import { FiEdit3, FiCheck, FiX } from "react-icons/fi";
import { DataTableProps, TableAction } from "@/components/table/datatable-types";
import { TableOrViewName, Row } from "@/hooks/database";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import { TruncateTooltip } from "@/components/common/TruncateTooltip";
import { TableSkeleton } from "@/components/common/ui/table/TableSkeleton";
import { FancyEmptyState } from "@/components/common/ui/FancyEmptyState";

// Define a type for your row that guarantees a unique identifier
type DataRow<T extends TableOrViewName> = Row<T> & { id: string | number };

interface TableBodyProps<T extends TableOrViewName> extends Pick<DataTableProps<T>, "columns" | "selectable" | "bordered" | "density" | "striped" | "hoverable" | "loading" | "emptyText"> {
  actions?: TableAction<T>[];
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
  isLoading: boolean;
}

interface TableRowProps<T extends TableOrViewName> extends Omit<TableBodyProps<T>, 'processedData' | 'loading' | 'emptyText'> {
    record: DataRow<T>;
    rowIndex: number;
    isSelected: boolean;
}

const densityClasses = { compact: "py-1 px-3", default: "py-3 px-4", comfortable: "py-4 px-6" };

// Base Table Row component (generic). We'll memoize it below with a type assertion to preserve generics.
function TableRowBase<T extends TableOrViewName>({
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
    cancelCellEdit,
    // isLoading,
}: TableRowProps<T>) {
    const editInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (editingCell && editingCell.rowIndex === rowIndex) {
            editInputRef.current?.focus();
            editInputRef.current?.select();
        }
    }, [editingCell, rowIndex]);

    // Loading UI is handled at the TableBodyBase level.
    
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
            <td className={`w-32 ${densityClasses[density ?? "default"]} text-center whitespace-nowrap overflow-hidden ${bordered ? `${rowIndex < selectedRows.length - 1 ? "border-b" : ""} border-gray-200 dark:border-gray-700` : ""}`}
                style={{ width: 128, minWidth: 128, maxWidth: 128 }}>
              <div className='flex items-center justify-center gap-1'>
                {actions?.map((action) => {
                  const isHidden = typeof action.hidden === 'function' ? action.hidden(record) : action.hidden;
                  if (isHidden) return null;
                  
                  const isDisabled = typeof action.disabled === 'function' ? action.disabled(record) : action.disabled;
                  const variants = {
                    primary: "text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300",
                    secondary: "text-gray-600 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300",
                    danger: "text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300",
                    success: "text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300",
                  };
                  
                  const icon = action.getIcon ? action.getIcon(record) : action.icon;
                  const variant = action.variant || 'secondary';
                  
                  return (
                    <button
                      key={action.key}
                      onClick={() => !isDisabled && action.onClick(record, rowIndex)}
                      disabled={isDisabled}
                      className={`p-1 rounded transition-colors ${isDisabled ? "opacity-50 cursor-not-allowed" : variants[variant]}`}
                      title={action.label}
                    >
                      {icon}
                    </button>
                  );
                })}
              </div>
            </td>
          )}
          {visibleColumns.map((column, colIndex) => (
            <td
              key={column.key}
              // Added 'relative' so the absolute edit overlay positions correctly over this cell
              className={`relative ${densityClasses[density ?? "default"]} text-sm text-gray-900 dark:text-white whitespace-nowrap ${column.align === "center" ? "text-center" : column.align === "right" ? "text-right" : ""} ${
                column.editable ? "cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600/50" : ""
              } ${bordered ? `${rowIndex < selectedRows.length - 1 ? "border-b" : ""} ${colIndex < visibleColumns.length - 1 || hasActions ? "border-r" : ""} border-gray-200 dark:border-gray-700` : ""} overflow-hidden`}
              style={{
                width: column.width,
                minWidth: column.width ? undefined : "100px",
                maxWidth: "350px"
              }}
              onClick={() => column.editable && onCellEdit(record, column, rowIndex)}>
              {editingCell?.rowIndex === rowIndex && editingCell?.columnKey === column.key ? (
                // Use absolute positioning with z-index to pop out of the cell boundaries if needed
                <div 
                    className='absolute inset-y-0 left-0 z-50 flex items-center gap-1 bg-white dark:bg-gray-800 px-2 shadow-lg ring-1 ring-black/5 dark:ring-white/10 min-w-full w-auto'
                    onClick={(e) => e.stopPropagation()}
                >
                  <input
                    ref={editInputRef}
                    type='text'
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveCellEdit();
                      if (e.key === "Escape") cancelCellEdit();
                    }}
                    className='min-w-[80px] flex-1 px-2 py-1 text-sm border border-blue-500 rounded bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500'
                  />
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                        type="button"
                        onClick={saveCellEdit} 
                        className='p-1.5 text-green-600 hover:text-green-700 bg-green-50 dark:bg-green-900/30 rounded hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors' 
                        aria-label="Save"
                        title="Save (Enter)"
                    >
                        <FiCheck size={14} />
                    </button>
                    <button 
                        type="button"
                        onClick={cancelCellEdit} 
                        className='p-1.5 text-red-600 hover:text-red-700 bg-red-50 dark:bg-red-900/30 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors' 
                        aria-label="Cancel"
                        title="Cancel (Esc)"
                    >
                        <FiX size={14} />
                    </button>
                  </div>
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
const MemoizedTableRow = React.memo(TableRowBase) as <T extends TableOrViewName>(
  props: TableRowProps<T>
) => React.ReactElement;

// Base TableBody component (generic). We'll memoize with a type assertion below to preserve generics.
function TableBodyBase<T extends TableOrViewName>({
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
            <div className='py-6'>
              <TableSkeleton
                rows={processedData.length || 5}
                columns={visibleColumns.length + (rest.selectable ? 1 : 0) + (rest.hasActions ? 1 : 0)}
                showHeader={false}
              />
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
             <FancyEmptyState 
                title="No Data Found" 
                description={emptyText || "Try adjusting your search or filters."} 
             />
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
            key={`${record.id} + ${rowIndex}`}
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

export const TableBody = React.memo(TableBodyBase) as <T extends TableOrViewName>(
  props: TableBodyProps<T>
) => React.ReactElement;