'use client';

import React, { useRef } from 'react';
import { FiFilter, FiDownload, FiRefreshCw, FiEye, FiChevronDown, FiSearch } from 'react-icons/fi';
import { DataTableProps } from '@/components/table/datatable-types';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { Row } from '@/hooks/database';
import { TableColumnSelector } from './TableColumnSelector';
import { TableOrViewName } from '@/hooks/database';
import { useViewSettings } from '@/contexts/ViewSettingsContext';
// THE FIX: Import DebouncedInput
import { DebouncedInput } from '@/components/common/ui/Input/DebouncedInput';

interface TableToolbarProps<T extends TableOrViewName>
  extends Pick<
    DataTableProps<T>,
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

export function TableToolbar<T extends TableOrViewName>({
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
  const { showToolbar } = useViewSettings();
  const columnsButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      {showToolbar && (
        <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
          {title && (
            <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
              {title}
            </h3>
          )}

          <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
            {customToolbar ? (
              <div className="w-full">{customToolbar}</div>
            ) : (
              <div className="flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-1 sm:gap-3">
                  {searchable && (
                    <div className="relative flex-1 sm:max-w-sm">
                      {/* THE FIX: Use DebouncedInput with debounce prop */}
                      <DebouncedInput
                        placeholder="Search..."
                        value={searchQuery}
                        onChange={(value) => {
                          setSearchQuery(value);
                          onSearchChange?.(value);
                        }}
                        debounce={300}
                        className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        leftIcon={<FiSearch className="text-gray-400" />}
                        fullWidth
                      />
                    </div>
                  )}
                  {filterable && (
                    <button
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center justify-center gap-2 px-3 py-2 text-sm sm:text-base border rounded-lg transition-colors min-w-0 ${
                        showFilters
                          ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/50 dark:text-blue-300'
                          : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400'
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

            <div className="flex w-full sm:w-auto sm:flex-none items-center gap-2 sm:gap-3 justify-end mt-1 sm:mt-0 ml-auto">
              {(showColumnsToggle || (!customToolbar && true)) && (
                <>
                  <button
                    ref={columnsButtonRef}
                    onClick={() => setShowColumnSelector(!showColumnSelector)}
                    className={`flex items-center justify-center gap-2 px-3 py-2 text-sm border rounded-lg transition-colors ${
                      showColumnSelector
                        ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/50 dark:text-blue-300'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                    aria-label="Show/Hide Columns"
                  >
                    <FiEye size={14} className="sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Columns</span>
                    <FiChevronDown
                      size={12}
                      className={`sm:w-3.5 sm:h-3.5 transition-transform ${
                        showColumnSelector ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <TableColumnSelector
                    columns={columns.filter((c) => !c.hidden)}
                    visibleColumns={visibleColumns}
                    setVisibleColumns={setVisibleColumns}
                    showColumnSelector={showColumnSelector}
                    setShowColumnSelector={setShowColumnSelector}
                    triggerRef={columnsButtonRef}
                  />
                </>
              )}

              {refreshable && onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 shrink-0"
                  aria-label="Refresh data"
                >
                  <FiRefreshCw size={14} className={`${loading ? 'animate-spin' : ''}`} />
                </button>
              )}

              {exportable && (
                <button
                  onClick={onExport}
                  disabled={isExporting}
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
                >
                  <FiDownload size={14} />
                  <span className="hidden sm:inline">
                    {isExporting ? 'Exporting...' : 'Export'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
