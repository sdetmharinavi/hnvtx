// @/components/table/TableFilterPanel.tsx
import React, { useState, useEffect } from "react";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import { AuthTableOrViewName, Row, Filters } from "@/hooks/database";
import { useDebounce } from "@/hooks/useDebounce";

interface TableFilterPanelProps<T extends AuthTableOrViewName> {
  columns: Column<Row<T>>[];
  filters: Filters;
  setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  showFilters: boolean;
  filterable: boolean;
}

const DebouncedInput = ({ value, onChange, placeholder, className }: { value: string; onChange: (value: string) => void; placeholder: string; className: string; }) => {
    const [internalValue, setInternalValue] = useState(value);
    const debouncedValue = useDebounce(internalValue, 500);

    useEffect(() => {
        onChange(debouncedValue);
    }, [debouncedValue, onChange]);

    useEffect(() => {
        setInternalValue(value);
    }, [value]);

    return (
        <input
            type='text'
            value={internalValue}
            onChange={(e) => setInternalValue(e.target.value)}
            placeholder={placeholder}
            className={className}
        />
    );
};

export function TableFilterPanel<T extends AuthTableOrViewName>({
  columns,
  filters,
  setFilters,
  showFilters,
  filterable,
}: TableFilterPanelProps<T>) {
  if (!showFilters || !filterable) return null;

  return (
    <div className='mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg'>
      {columns
        .filter((col) => col.filterable)
        .map((column) => (
          <div key={column.key} className='flex flex-col gap-1'>
            <label className='text-xs font-medium text-gray-700 dark:text-gray-300'>{column.title}</label>
            {column.filterOptions ? (
              <select
                value={String(filters[column.dataIndex] ?? '')}
                onChange={(e) => setFilters({ ...filters, [column.dataIndex]: e.target.value })}
                className='px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white'
              >
                <option value=''>All</option>
                {column.filterOptions.map((option) => (
                  <option key={String(option.value)} value={String(option.value)}>
                    {option.label}
                  </option>
                ))}
              </select>
            ) : (
              <DebouncedInput
                value={typeof filters[column.dataIndex] === 'string' ? (filters[column.dataIndex] as string) : ''}
                onChange={(value) => setFilters(prev => ({ ...prev, [column.dataIndex]: value }))}
                placeholder={`Filter ${column.title.toLowerCase()}...`}
                className='px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400'
              />
            )}
          </div>
        ))}
      {Object.keys(filters).length > 0 && (
        <div className='flex items-end'>
          <button 
            onClick={() => setFilters({})} 
            className='px-3 py-1.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors'
          >
            Clear All
          </button>
        </div>
      )}
    </div>
  );
}