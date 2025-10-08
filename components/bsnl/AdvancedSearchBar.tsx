'use client';
import { useState } from 'react';
import { ChevronDown, Filter, Search, ChevronUp } from 'lucide-react';
import { BsnlSearchFilters } from '@/schemas/custom-schemas';
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
  // Simplified handler for single-select dropdowns
  const handleFilterChange = (filterKey: keyof BsnlSearchFilters, value: string) => {
    onFiltersChange({ ...filters, [filterKey]: value || undefined });
  };
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6 shadow-sm">
      <div className="flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-4">
        <div className="flex-1 relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search by name, asset no, etc..."
            value={filters.query || ''}
            onChange={(e) => onFiltersChange({ ...filters, query: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent dark:bg-gray-700 dark:text-white"
          />
        </div>
        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex-1 sm:flex-none flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
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
            className="flex-1 sm:flex-none px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
          >
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
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm bg-white dark:bg-gray-700 dark:text-white"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              System/Cable Type
            </label>
            <select
              value={filters.type || ''}
              onChange={(e) => handleFilterChange('type', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm bg-white dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Types</option>
              {typeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Region
            </label>
            <select
              value={filters.region || ''}
              onChange={(e) => handleFilterChange('region', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm bg-white dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Regions</option>
              {regionOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Node Type
            </label>
            <select
              value={filters.nodeType || ''}
              onChange={(e) => handleFilterChange('nodeType', e.target.value)}
              className="w-full border border-gray-300 dark:border-gray-600 rounded-md p-2 text-sm bg-white dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Node Types</option>
              {nodeTypeOptions.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </div>
  );
}
