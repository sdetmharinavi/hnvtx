// components/common/filters/GenericFilterBar.tsx
'use client';

import React, { memo } from 'react';
import { FiGrid, FiList, FiSearch } from 'react-icons/fi';
// THE FIX: Import DebouncedInput instead of standard Input
import { DebouncedInput } from '@/components/common/ui/Input/DebouncedInput';
import { SearchableSelect, Option } from '@/components/common/ui/select/SearchableSelect';
import { MultiSelectFilter } from '@/components/common/filters/MultiSelectFilter';
import { Filters } from '@/hooks/database';

export type FilterConfig = {
  key: string;
  label: string;
  options: Option[];
  placeholder?: string;
  isLoading?: boolean;
  type?: 'select' | 'native-select' | 'multi-select';
};

interface GenericFilterBarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: Record<string, any>;
  onFilterChange: (key: string, value: string | null) => void;
  setFilters?: React.Dispatch<React.SetStateAction<Filters>>;
  filterConfigs: FilterConfig[];
  viewMode?: 'grid' | 'table';
  onViewModeChange?: (mode: 'grid' | 'table') => void;
  extraActions?: React.ReactNode;
  className?: string;
}

export const GenericFilterBar = memo(
  ({
    searchQuery,
    onSearchChange,
    searchPlaceholder = 'Search...',
    filters,
    onFilterChange,
    setFilters,
    filterConfigs,
    viewMode,
    onViewModeChange,
    extraActions,
    className = '',
  }: GenericFilterBarProps) => {
    return (
      <div
        className={`bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm flex flex-col lg:flex-row flex-wrap gap-4 justify-between items-center sticky top-20 z-10 ${className}`}
      >
        {/* Search Section */}
        <div className="w-full lg:w-96">
          {/* THE FIX: Use DebouncedInput to prevent parent re-renders on every keystroke */}
          <DebouncedInput
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={onSearchChange}
            leftIcon={<FiSearch className="text-gray-400" />}
            fullWidth
            clearable
            debounce={300} // Wait 300ms after typing stops before triggering search
          />
        </div>

        {/* Filters & Toggles Section */}
        <div className="flex w-full lg:w-auto gap-3 overflow-x-auto pb-2 lg:pb-0 items-center no-scrollbar flex-wrap">
          {filterConfigs.map((config) => {
            if (config.type === 'multi-select') {
              if (!setFilters) {
                console.warn(
                  `GenericFilterBar: setFilters prop required for multi-select filter '${config.key}'`
                );
                return null;
              }
              return (
                <div key={config.key} className="min-w-[180px]">
                  <MultiSelectFilter
                    label={config.label}
                    filterKey={config.key}
                    filters={filters}
                    setFilters={setFilters}
                    options={config.options}
                  />
                </div>
              );
            }

            if (config.type === 'native-select') {
              return (
                <div key={config.key} className="min-w-[140px]">
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
                </div>
              );
            }

            return (
              <div key={config.key} className="min-w-[160px]">
                <SearchableSelect
                  placeholder={config.placeholder || config.label}
                  options={config.options}
                  value={String(filters[config.key] ?? '')}
                  onChange={(v) => onFilterChange(config.key, v)}
                  isLoading={config.isLoading}
                  clearable
                />
              </div>
            );
          })}

          {extraActions && (
            <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-3 ml-1">
              {extraActions}
            </div>
          )}

          {viewMode && onViewModeChange && (
            <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1 h-10 shrink-0 ml-auto lg:ml-0">
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
