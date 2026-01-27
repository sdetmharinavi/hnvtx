'use client';
import { useState, useCallback } from 'react';
import { ChevronDown, Filter, Search, ChevronUp, X } from 'lucide-react';
import { BsnlSearchFilters } from '@/schemas/custom-schemas';
import { MultiSelectFilter } from '@/components/common/filters/MultiSelectFilter';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import { Filters } from '@/hooks/database';

interface AdvancedSearchBarProps {
  filters: BsnlSearchFilters;
  onFiltersChange: (filters: BsnlSearchFilters) => void;
  onClear: () => void;
  typeOptions?: string[];
  regionOptions?: string[];
  nodeTypeOptions?: string[];
}

export function AdvancedSearchBar({
  filters,
  onFiltersChange,
  onClear,
  typeOptions = [],
  regionOptions = [],
  nodeTypeOptions = [],
}: AdvancedSearchBarProps) {
  const [showFilters, setShowFilters] = useState(false);

  const toOptions = (items: string[]): Option[] =>
    items.map((item) => ({ value: item, label: item }));

  // FIX: Memoize proxy to prevent unnecessary re-renders in children
  const setFiltersProxy = useCallback(
    (update: Filters | ((prev: Filters) => Filters)) => {
      const currentGeneric = filters as unknown as Filters;
      let nextGeneric: Filters;

      if (typeof update === 'function') {
        nextGeneric = update(currentGeneric);
      } else {
        nextGeneric = update;
      }
      onFiltersChange(nextGeneric as BsnlSearchFilters);
    },
    [filters, onFiltersChange]
  );

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFiltersChange({ ...filters, status: e.target.value || undefined });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search systems, cables, nodes..."
            value={filters.query || ''}
            onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border rounded-md transition-colors ${
              showFilters
                ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-900/30 dark:border-blue-500 dark:text-blue-300'
                : 'border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
            }`}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {showFilters ? (
              <ChevronUp className="h-4 w-4 ml-1" />
            ) : (
              <ChevronDown className="h-4 w-4 ml-1" />
            )}
          </button>
          <button
            onClick={onClear}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            title="Clear all filters"
          >
            <X className="h-4 w-4 mr-1" />
            Clear
          </button>
        </div>
      </div>

      {showFilters && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              value={filters.status || ''}
              onChange={handleStatusChange}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm bg-white dark:bg-gray-800 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div className="relative">
            <MultiSelectFilter
              label="System/Cable Type"
              filterKey="type"
              filters={filters as unknown as Filters}
              setFilters={setFiltersProxy}
              options={toOptions(typeOptions)}
            />
          </div>

          <div className="relative">
            <MultiSelectFilter
              label="Region / Area"
              filterKey="region"
              filters={filters as unknown as Filters}
              setFilters={setFiltersProxy}
              options={toOptions(regionOptions)}
            />
          </div>

          <div className="relative">
            <MultiSelectFilter
              label="Node Type"
              filterKey="nodeType"
              filters={filters as unknown as Filters}
              setFilters={setFiltersProxy}
              options={toOptions(nodeTypeOptions)}
            />
          </div>
        </div>
      )}
    </div>
  );
}