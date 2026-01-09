// components/common/filters/GenericFilterBar.tsx
'use client';

import React, { memo } from 'react';
import { FiGrid, FiList, FiSearch } from 'react-icons/fi';
import { Input } from '@/components/common/ui/Input';
import { SearchableSelect, Option } from '@/components/common/ui/select/SearchableSelect';
import { MultiSelectFilter } from '@/components/common/filters/MultiSelectFilter';
import { Filters } from '@/hooks/database';

export type FilterConfig = {
  key: string;
  label: string;
  options: Option[];
  placeholder?: string;
  isLoading?: boolean;
  // Added 'multi-select' type
  type?: 'select' | 'native-select' | 'multi-select';
};

interface GenericFilterBarProps {
  // Search Props
  searchQuery: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;

  // Filter Props
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filters: Record<string, any>;
  // For standard single filters
  onFilterChange: (key: string, value: string | null) => void;
  // For multi-select filters (direct state setter needed for complex logic)
  setFilters?: React.Dispatch<React.SetStateAction<Filters>>;
  filterConfigs: FilterConfig[];

  // View Mode Props (Optional)
  viewMode?: 'grid' | 'table';
  onViewModeChange?: (mode: 'grid' | 'table') => void;

  // Custom Actions (Optional - e.g., "Print Feed" in Diary)
  extraActions?: React.ReactNode;

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
    setFilters,
    filterConfigs,
    viewMode,
    onViewModeChange,
    extraActions,
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
        <div className="flex w-full lg:w-auto gap-3 overflow-x-auto pb-2 lg:pb-0 items-center no-scrollbar">
          {filterConfigs.map((config) => {
            // 1. Multi-Select
            if (config.type === 'multi-select') {
              if (!setFilters) {
                console.warn(
                  `GenericFilterBar: setFilters prop required for multi-select filter '${config.key}'`
                );
                return null;
              }
              return (
                <div key={config.key} className="min-w-[180px]">
                  {/* We hide the label inside the bar to save space, passing empty string */}
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

            // 2. Native Select
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

            // 3. Searchable Select (Default)
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

          {/* Extra Actions (Buttons) */}
          {extraActions && (
            <div className="flex items-center gap-2 border-l border-gray-200 dark:border-gray-700 pl-3 ml-1">
              {extraActions}
            </div>
          )}

          {/* View Mode Toggle */}
          {viewMode && onViewModeChange && (
            // THE FIX: Changed 'hidden sm:flex' to 'flex' to make it visible on mobile
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
