'use client';

import React, { memo, useState, useEffect } from 'react';
import { FiFilter, FiSearch } from 'react-icons/fi';
import { SearchableSelect } from '@/components/common/ui/select/SearchableSelect';
import { Filters} from '@/hooks/database';
import { useDebounce } from 'use-debounce'; // <-- IMPORT useDebounce
import { DEFAULTS } from '@/config/constants';
import {
  Employee_designationsRowSchema,
  Maintenance_areasRowSchema,
} from '@/schemas/zod-schemas';

interface EmployeeFiltersProps {
  searchQuery: string; // This prop is now used to set the initial value
  filters: Filters;
  showFilters: boolean;
  designations: Employee_designationsRowSchema[];
  maintenanceAreas: Maintenance_areasRowSchema[];
  onSearchChange: (value: string) => void;
  onFilterToggle: () => void;
  onDesignationChange: (value: string) => void;
  onStatusChange: (value: 'true' | 'false' | '') => void;
  onMaintenanceAreaChange: (value: string) => void;
}

const EmployeeFiltersComponent = memo(
  ({
    searchQuery,
    filters,
    showFilters,
    designations,
    maintenanceAreas,
    onSearchChange,
    onFilterToggle,
    onDesignationChange,
    onStatusChange,
    onMaintenanceAreaChange,
  }: EmployeeFiltersProps) => {
    // --- DEBOUNCING LOGIC ---
    const [internalSearch, setInternalSearch] = useState(searchQuery);
    const [debouncedSearch] = useDebounce(
      internalSearch,
      DEFAULTS.DEBOUNCE_DELAY
    );

    // Effect to call the parent's onSearchChange only when the debounced value changes
    useEffect(() => {
      onSearchChange(debouncedSearch);
    }, [debouncedSearch, onSearchChange]);

    // Effect to sync the internal state if the parent's state changes (e.g., from a "clear all" button)
    useEffect(() => {
      setInternalSearch(searchQuery);
    }, [searchQuery]);
    // --- END DEBOUNCING LOGIC ---

    return (
      <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div className="flex flex-1 flex-col gap-3 sm:flex-row">
            <div className="relative">
              <FiSearch className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400 dark:text-gray-500" />
              <input
                type="text"
                placeholder="Search employees..."
                value={internalSearch} // <-- Use internal state for immediate input feedback
                onChange={(e) => setInternalSearch(e.target.value)} // <-- Update internal state on every keystroke
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-600 sm:w-80"
              />
            </div>
            <button
              type="button"
              onClick={onFilterToggle}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 transition-colors ${
                showFilters
                  ? 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/50 dark:text-blue-200'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              <FiFilter className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 grid grid-cols-1 gap-3 border-t pt-4 dark:border-gray-700 sm:grid-cols-3">
            <SearchableSelect
              options={designations.map((d) => ({
                value: d.id,
                label: d.name,
              }))}
              value={filters.employee_designation_id as string}
              onChange={(v) => onDesignationChange(v ?? '')}
              placeholder="All Designations"
              searchPlaceholder="Search designations..."
              clearable={true}
            />
            <select
              value={filters.status as string}
              onChange={(e) =>
                onStatusChange(e.target.value as 'true' | 'false')
              }
              className="rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-600"
            >
              <option value="">All Status</option>
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
            <SearchableSelect
              options={maintenanceAreas.map((area) => ({
                value: area.id,
                label: `${area.name}${area.code ? ` (${area.code})` : ''}`,
              }))}
              value={filters.maintenance_terminal_id as string}
              onChange={(v) => onMaintenanceAreaChange(v ?? '')}
              placeholder="All Maintenance Areas"
              searchPlaceholder="Search areas..."
              clearable={true}
            />
          </div>
        )}
      </div>
    );
  }
);

EmployeeFiltersComponent.displayName = 'EmployeeFilters';
export default EmployeeFiltersComponent;
