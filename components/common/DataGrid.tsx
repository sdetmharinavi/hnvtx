// components/common/DataGrid.tsx
import React, { ReactNode } from 'react';
import { FancyEmptyState } from '@/components/common/ui/FancyEmptyState';
import { TablePagination } from '@/components/table';
import { Search } from 'lucide-react';

interface DataGridProps<T> {
  data: T[];
  /** Function to render a single item card */
  renderItem: (item: T) => ReactNode;
  /** Optional pagination config to show pagination controls at the bottom of the grid */
  pagination?: {
    current: number;
    pageSize: number;
    total: number;
    onChange: (page: number, pageSize: number) => void;
  };
  isLoading?: boolean;
  isEmpty?: boolean;
  /** Custom empty state component, otherwise defaults to a generic one */
  emptyState?: ReactNode;
  /** Additional class for the grid container */
  className?: string;
}

export function DataGrid<T>({
  data,
  renderItem,
  pagination,
  isLoading = false,
  isEmpty = false,
  emptyState,
  className = '',
}: DataGridProps<T>) {
  // Loading Skeletons for Grid
  if (isLoading) {
    return (
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className='h-64 rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 animate-pulse'
          >
            <div className='h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4'></div>
            <div className='space-y-2'>
              <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded'></div>
              <div className='h-3 bg-gray-200 dark:bg-gray-700 rounded w-5/6'></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isEmpty || data.length === 0) {
    return (
      <div className='col-span-full'>
        {emptyState || (
          <div className='py-16'>
            <FancyEmptyState
              icon={Search}
              title='No items found'
              description='Try adjusting your filters or search query.'
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      <div
        className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 ${className}`}
      >
        {data.map((item, index) => (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          <React.Fragment key={(item as any).id || index}>{renderItem(item)}</React.Fragment>
        ))}
      </div>

      {/* Integrated Pagination for Grid View */}
      {pagination && pagination.total > 0 && (
        <div className='bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden'>
          <TablePagination pagination={{ ...pagination, showSizeChanger: true }} bordered={false} />
        </div>
      )}
    </div>
  );
}
