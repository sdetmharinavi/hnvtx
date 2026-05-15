// @/components/table/TableFilterPanel.tsx
import React from "react";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import { TableOrViewName, Row, Filters } from "@/hooks/database";
import { DebouncedInput } from "@/components/common/ui/Input/DebouncedInput";

interface TableFilterPanelProps<T extends TableOrViewName> {
  columns: Column<Row<T>>[];
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  showFilters: boolean;
  filterable: boolean;
}

export function TableFilterPanel<T extends TableOrViewName>({
  columns,
  filters,
  setFilters,
  showFilters,
  filterable,
}: TableFilterPanelProps<T>) {
  if (!showFilters || !filterable) return null;

  // Extract filterable columns to avoid unnecessary processing
  const filterableColumns = columns.filter((col) => col.filterable);

  if (filterableColumns.length === 0) return null;

  return (
    <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border-t border-gray-200 dark:border-gray-700 shadow-inner'>
      {filterableColumns.map((column) => (
        <div key={column.key} className='flex flex-col gap-1.5'>
          <label className='text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider pl-1'>
            {column.title}
          </label>
          
          {column.filterOptions ? (
            <select
              value={String(filters[column.dataIndex] ?? '')}
              onChange={(e) => setFilters(prev => {
                  const newFilters = { ...prev };
                  if (e.target.value === '') {
                      delete newFilters[column.dataIndex];
                  } else {
                      newFilters[column.dataIndex] = e.target.value;
                  }
                  return newFilters;
              })}
              className='w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow'
            >
              <option value=''>All {column.title}s</option>
              {column.filterOptions.map((option) => (
                <option key={String(option.value)} value={String(option.value)}>
                  {option.label}
                </option>
              ))}
            </select>
          ) : (
            <DebouncedInput
              value={typeof filters[column.dataIndex] === 'string' ? (filters[column.dataIndex] as string) : ''}
              onChange={(value) => setFilters(prev => {
                  const newFilters = { ...prev };
                  if (value === '') {
                      delete newFilters[column.dataIndex];
                  } else {
                      newFilters[column.dataIndex] = value;
                  }
                  return newFilters;
              })}
              placeholder={`Filter by ${column.title.toLowerCase()}...`}
              className="py-2 text-sm bg-white dark:bg-gray-800"
              debounce={400}
            />
          )}
        </div>
      ))}

      {/* Clear Filters Button - Only show if there are active column filters */}
      {Object.keys(filters).filter(k => k !== 'or' && filters[k] !== undefined && filters[k] !== '').length > 0 && (
        <div className='flex items-end pb-[2px]'>
          <button 
            onClick={() => {
              // Only clear column-specific filters, retain 'or' (global search) if it exists
              setFilters(prev => {
                  const resetFilters: Filters = {};
                  if (prev.or) resetFilters.or = prev.or;
                  return resetFilters;
              });
            }} 
            className='px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors border border-transparent hover:border-red-200 dark:hover:border-red-800/50'
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
}