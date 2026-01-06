'use client';

import React, { memo } from 'react';
import { FiGrid, FiList, FiSearch } from 'react-icons/fi';
import { Input } from '@/components/common/ui/Input';
import { SearchableSelect, Option } from '@/components/common/ui/select/SearchableSelect';

export type FilterConfig = {
  key: string;
  label: string;
  options: Option[];
  placeholder?: string;
  isLoading?: boolean;
  type?: 'select' | 'native-select'; // Expandable for other types later
};

interface GenericFilterBarProps {
  // Search Props
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  // Filter Props
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: Record<string, any>;
  onFilterChange: (key: string, value: string | null) => void;
  filterConfigs: FilterConfig[];

  // View Mode Props (Optional)
  viewMode?: 'grid' | 'table';
  onViewModeChange?: (mode: 'grid' | 'table') => void;

  // Style
  className?: string;
}

export const GenericFilterBar = memo(
  ({
    searchQuery,
    onSearchChange,
    searchPlaceholder = 'Search...',
    filters,
    onFilterChange,
    filterConfigs,
    viewMode,
    onViewModeChange,
    className = '',
  }: GenericFilterBarProps) => {
    return (
      <div
        className={`bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row gap-4 justify-between items-center sticky top-20 z-10 ${className}`}
      >
        {/* Search Section */}
        <div className="w-full lg:w-96">
          <Input
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<FiSearch className="text-gray-400" />}
            fullWidth
            clearable
          />
        </div>

        {/* Filters & Toggles Section */}
        <div className="flex w-full lg:w-auto gap-3 overflow-x-auto pb-2 lg:pb-0 items-center">
          {filterConfigs.map((config) => (
            <div key={config.key} className="min-w-[160px]">
              {config.type === 'native-select' ? (
                <select
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 dark:text-white"
                  value={String(filters[config.key] ?? '')}
                  onChange={(e) => onFilterChange(config.key, e.target.value || null)}
                >
                  <option value="">{config.placeholder || `All ${config.label}`}</option>
                  {config.options.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <SearchableSelect
                  placeholder={config.placeholder || config.label}
                  options={config.options}
                  value={String(filters[config.key] ?? '')}
                  onChange={(v) => onFilterChange(config.key, v)}
                  isLoading={config.isLoading}
                  clearable
                />
              )}
            </div>
          ))}

          {/* View Mode Toggle */}
          {viewMode && onViewModeChange && (
            <div className="hidden sm:flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 h-10 shrink-0 ml-auto lg:ml-0">
              <button
                onClick={() => onViewModeChange('grid')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'grid'
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="Grid View"
              >
                <FiGrid />
              </button>
              <button
                onClick={() => onViewModeChange('table')}
                className={`p-2 rounded-md transition-all ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
                title="Table View"
              >
                <FiList />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }
);

GenericFilterBar.displayName = 'GenericFilterBar';
