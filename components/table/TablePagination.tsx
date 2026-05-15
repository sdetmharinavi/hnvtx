// @/components/table/TablePagination.tsx
import React from 'react';
import { FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight } from 'react-icons/fi';
import { TablePaginationProps } from '@/components/table/datatable-types';
import { DEFAULTS } from '@/constants/constants';

export function TablePagination({ pagination, bordered }: TablePaginationProps) {
  if (!pagination || pagination.total <= 0) return null;

  return (
    <div
      className={`px-4 py-3 ${bordered ? 'border-t border-gray-200 dark:border-gray-700' : ''} flex flex-col sm:flex-row items-center justify-between gap-4 w-full`}
    >
      {/* Items Count & Size Selector - Wraps gracefully */}
      <div className='flex flex-wrap items-center justify-center sm:justify-start gap-3 text-sm text-gray-700 dark:text-gray-300 w-full sm:w-auto'>
        <span className='whitespace-nowrap'>
          Showing {(pagination.current - 1) * pagination.pageSize + 1} to{' '}
          {Math.min(pagination.current * pagination.pageSize, pagination.total)} of{' '}
          {pagination.total}
        </span>
        {pagination.showSizeChanger && (
          <select
            value={pagination.pageSize}
            onChange={(e) => pagination.onChange(1, Number(e.target.value))}
            className='px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-sm focus:ring-blue-500 focus:border-blue-500 outline-none'
          >
            {(pagination.pageSizeOptions || DEFAULTS.PAGE_SIZE_OPTIONS).map((size) => (
              <option key={size} value={size}>
                {size} / page
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Navigation Buttons - Ensured to fit on mobile */}
      <div className='flex items-center justify-center gap-1.5 sm:gap-2 w-full sm:w-auto'>
        <button
          onClick={() => pagination.onChange(1, pagination.pageSize)}
          disabled={pagination.current === 1}
          className='p-1.5 sm:p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          aria-label='First page'
        >
          <FiChevronsLeft size={16} />
        </button>
        <button
          onClick={() => pagination.onChange(pagination.current - 1, pagination.pageSize)}
          disabled={pagination.current === 1}
          className='p-1.5 sm:p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          aria-label='Previous page'
        >
          <FiChevronLeft size={16} />
        </button>

        <span className='px-2 sm:px-4 py-1 sm:py-2 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap font-medium'>
          {pagination.current} / {Math.ceil(pagination.total / pagination.pageSize)}
        </span>

        <button
          onClick={() => pagination.onChange(pagination.current + 1, pagination.pageSize)}
          disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
          className='p-1.5 sm:p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          aria-label='Next page'
        >
          <FiChevronRight size={16} />
        </button>
        <button
          onClick={() =>
            pagination.onChange(
              Math.ceil(pagination.total / pagination.pageSize),
              pagination.pageSize,
            )
          }
          disabled={pagination.current >= Math.ceil(pagination.total / pagination.pageSize)}
          className='p-1.5 sm:p-2 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors'
          aria-label='Last page'
        >
          <FiChevronsRight size={16} />
        </button>
      </div>
    </div>
  );
}
