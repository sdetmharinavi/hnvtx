// app/dashboard/ofc/components/OfcFilters.tsx
import React, { memo } from "react";
import { FiFilter, FiSearch } from "react-icons/fi";
import { SearchableSelect } from "@/components/common/ui/select/SearchableSelect";
import type { OfcCablesFilters as OfcFiltersType } from "@/components/ofc/ofc-types";
import { Filters } from "@/hooks/database";

interface OfcFiltersProps {
  filters: Filters;
  showFilters: boolean;
  ofcTypes: { id: string; name: string }[];
  maintenanceAreas: { id: string; name: string; code?: string | null }[];
  onFiltersChange: (newFilters: Partial<OfcFiltersType>) => void;
  onFilterToggle: () => void;
}

const OfcFiltersComponent = ({
  filters,
  showFilters,
  ofcTypes,
  maintenanceAreas,
  onFiltersChange,
  onFilterToggle,
}: OfcFiltersProps) => {
  return (
    <div className="mb-6 rounded-lg border bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800">
      <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        {/* Search Input */}
        <div className="relative flex-1">
          <FiSearch className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Search by Asset No or Route Name..."
            value={filters.search}
            onChange={(e) => onFiltersChange({ search: e.target.value })}
            onKeyDown={(e) => e.stopPropagation()}
            className="w-full rounded-md border border-gray-300 py-2 pr-4 pl-10 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:ring-blue-600 sm:w-80"
          />
        </div>
        {/* Filter Toggle Button */}
        <button
          type="button"
          onClick={onFilterToggle}
          className={`flex items-center gap-2 rounded-md border px-3 py-2 transition-colors ${
            showFilters
              ? "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-900/50 dark:text-blue-200"
              : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
          }`}
        >
          <FiFilter className="h-4 w-4" />
          Filters
        </button>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <div className="mt-4 grid grid-cols-1 gap-3 border-t pt-4 dark:border-gray-700 sm:grid-cols-3">
          <SearchableSelect
            options={ofcTypes.map((d) => ({ value: d.id, label: d.name }))}
            value={filters.ofc_type_id}
            onChange={(v) => onFiltersChange({ ofc_type_id: v ?? "" })}
            placeholder="All OFC Types"
            searchPlaceholder="Search types..."
            clearable
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ status: e.target.value as "true" | "false" | "" })}
            className="rounded-md border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-600"
          >
            <option value="">All Statuses</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <SearchableSelect
            options={maintenanceAreas.map((area) => ({
              value: area.id,
              label: `${area.name}${area.code ? ` (${area.code})` : ""}`,
            }))}
            value={filters.maintenance_terminal_id}
            onChange={(v) => onFiltersChange({ maintenance_terminal_id: v ?? "" })}
            placeholder="All Maintenance Areas"
            searchPlaceholder="Search areas..."
            clearable
            className="dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
      )}
    </div>
  );
};

OfcFiltersComponent.displayName = "OfcFilters";

export const OfcFilters = memo(OfcFiltersComponent);