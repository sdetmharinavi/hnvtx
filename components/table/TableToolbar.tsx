// @/components/table/TableToolbar.tsx
import React from "react";
import { FiSearch, FiFilter, FiDownload, FiRefreshCw, FiEye, FiChevronDown } from "react-icons/fi";
import { DataTableProps } from "@/components/table/datatable-types";
import { AuthTableOrViewName } from "@/hooks/database";

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
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  showColumnSelector: boolean;
  setShowColumnSelector: (show: boolean) => void;
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
  showFilters,
  setShowFilters,
  showColumnSelector,
  setShowColumnSelector,
  onRefresh,
  onExport,
  loading,
  isExporting,
}: TableToolbarProps<T>) {
  return (
    <div className="p-3 sm:p-4 border-b border-gray-200 dark:border-gray-700">
      {title && (
        <h3 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
          {title}
        </h3>
      )}
      
      <div className="space-y-3 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
        {/* Search and Filter Section */}
        {!customToolbar && (
          <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:flex-1 sm:gap-3 sm:items-center">
            {searchable && (
              <div className="relative flex-1 sm:max-w-sm">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm sm:text-base" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
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
        )}

        {/* Custom Toolbar Section */}
        {customToolbar && (
          <div className="flex flex-col space-y-2 sm:space-y-0 sm:flex-row sm:flex-1 sm:gap-3 sm:items-center">
            <div className="flex-1">
              {customToolbar}
            </div>
            
            {/* Action Buttons - Mobile: Full width row, Desktop: Inline */}
            <div className="flex flex-wrap gap-2 sm:gap-3 sm:flex-nowrap">
              <button
                onClick={() => setShowColumnSelector(!showColumnSelector)}
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 flex-1 sm:flex-none min-w-0"
              >
                <FiEye size={14} className="sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Columns</span>
                <span className="sm:hidden">Cols</span>
                <FiChevronDown size={12} className="sm:w-3.5 sm:h-3.5" />
              </button>
              
              {refreshable && onRefresh && (
                <button 
                  onClick={onRefresh} 
                  disabled={loading} 
                  className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50 flex-shrink-0"
                >
                  <FiRefreshCw size={14} className={`sm:w-4 sm:h-4 ${loading ? "animate-spin" : ""}`} />
                </button>
              )}
              
              {exportable && (
                <button 
                  onClick={onExport} 
                  disabled={isExporting} 
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors flex-1 sm:flex-none min-w-0"
                >
                  <FiDownload size={14} className="sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">
                    {isExporting ? "Exporting..." : "Export"}
                  </span>
                  <span className="sm:hidden">
                    {isExporting ? "..." : "Export"}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons for Non-Custom Toolbar (Mobile Only) */}
        {!customToolbar && (exportable || refreshable) && (
          <div className="flex gap-2 sm:hidden">
            {refreshable && onRefresh && (
              <button 
                onClick={onRefresh} 
                disabled={loading} 
                className="p-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                <FiRefreshCw size={16} className={loading ? "animate-spin" : ""} />
              </button>
            )}
            {exportable && (
              <button 
                onClick={onExport} 
                disabled={isExporting} 
                className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors flex-1"
              >
                <FiDownload size={16} />
                {isExporting ? "Exporting..." : "Export"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}