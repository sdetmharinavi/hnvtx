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