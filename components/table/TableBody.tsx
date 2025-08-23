// @/components/table/TableBody.tsx
import React, { useRef } from "react";
import { FiEdit3, FiCheck, FiX } from "react-icons/fi";
import { DataTableProps } from "@/components/table/datatable-types";
import { AuthTableOrViewName, Row } from "@/hooks/database";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";

interface TableBodyProps<T extends AuthTableOrViewName> extends Pick<DataTableProps<T>, "columns" | "selectable" | "bordered" | "density" | "actions" | "striped" | "hoverable" | "loading" | "emptyText"> {
  processedData: Row<T>[];
  visibleColumns: Column<Row<T>>[];
  hasActions: boolean;
  selectedRows: Row<T>[];
  editingCell: { rowIndex: number; columnKey: string } | null;
  editValue: string;
  setEditValue: (value: string) => void;
  setEditingCell: (cell: { rowIndex: number; columnKey: string } | null) => void;
  onRowSelect: (record: Row<T>, selected: boolean) => void;
  onCellEdit: (record: Row<T>, column: Column<Row<T>>, rowIndex: number) => void;
  saveCellEdit: () => void;
  cancelCellEdit: () => void;
}

const densityClasses = { compact: "py-1 px-3", default: "py-3 px-4", comfortable: "py-4 px-6" };

export function TableBody<T extends AuthTableOrViewName>({
  //   columns,
  processedData,
  visibleColumns,
  selectable,
  bordered,
  density,
  actions,
  hasActions,
  striped,
  hoverable,
  loading,
  emptyText,
  selectedRows,
  editingCell,
  editValue,
  setEditValue,
  //   setEditingCell,
  onRowSelect,
  onCellEdit,
  saveCellEdit,
  cancelCellEdit,
}: TableBodyProps<T>) {
  const editInputRef = useRef<HTMLInputElement>(null);

  if (loading) {
    return (
      <tbody>
        <tr>
          <td colSpan={visibleColumns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0)} className={bordered ? "border-b border-gray-200 dark:border-gray-700" : ""}>
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
          <td colSpan={visibleColumns.length + (selectable ? 1 : 0) + (hasActions ? 1 : 0)} className={bordered ? "border-b border-gray-200 dark:border-gray-700" : ""}>
            <div className='text-center py-12'>
              <div className='text-gray-400 dark:text-gray-500 text-lg mb-2'>📄</div>
              <p className='text-gray-500 dark:text-gray-400'>{emptyText}</p>
            </div>
          </td>
        </tr>
      </tbody>
    );
  }

  return (
    <tbody className={`bg-white dark:bg-gray-800 ${striped && !bordered ? "divide-y divide-gray-200 dark:divide-gray-700" : ""}`}>
      {processedData.map((record, rowIndex) => (
        <tr
          key={rowIndex}
          className={`${striped && rowIndex % 2 === 1 ? "bg-gray-50/50 dark:bg-gray-700/25" : ""} ${hoverable ? "hover:bg-gray-50 dark:hover:bg-gray-700/50" : ""} ${
            selectedRows.includes(record) ? "bg-blue-50 dark:bg-blue-900/20" : ""
          } transition-colors`}>
          {selectable && (
            <td className={`px-4 py-3 ${bordered ? `${rowIndex < processedData.length - 1 ? "border-b" : ""} border-r border-gray-200 dark:border-gray-700` : ""}`}>
              <input type='checkbox' checked={selectedRows.includes(record)} onChange={(e) => onRowSelect(record, e.target.checked)} className='rounded border-gray-300 text-blue-600 focus:ring-blue-500' />
            </td>
          )}
          {hasActions && (
            <td className={`${densityClasses[density ?? "default"]} text-right ${bordered ? `${rowIndex < processedData.length - 1 ? "border-b" : ""} border-gray-200 dark:border-gray-700` : ""}`}>
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
              } ${bordered ? `${rowIndex < processedData.length - 1 ? "border-b" : ""} ${colIndex < visibleColumns.length - 1 || hasActions ? "border-r" : ""} border-gray-200 dark:border-gray-700` : ""} overflow-hidden`}
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
                  <button onClick={saveCellEdit} className='p-1 text-green-600 hover:text-green-700'>
                    <FiCheck size={14} />
                  </button>
                  <button onClick={cancelCellEdit} className='p-1 text-red-600 hover:text-red-700'>
                    <FiX size={14} />
                  </button>
                </div>
              ) : (
                <div className='flex items-center gap-2 group min-w-0'>
                  {column.render ? (
                    column.render(record[column.dataIndex as keyof Row<T>], record, rowIndex)
                  ) : (
                    <span className='truncate'>{String(record[column.dataIndex as keyof Row<T>] ?? "—")}</span>
                  )}
                  {column.editable && <FiEdit3 size={12} className='opacity-0 group-hover:opacity-50 text-gray-400' />}
                </div>
              )}
            </td>
          ))}
        </tr>
      ))}
    </tbody>
  );
}
