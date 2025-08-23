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