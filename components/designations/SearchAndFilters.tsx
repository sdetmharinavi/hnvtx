import { MdFilterList as Filter, MdSearch as Search, MdClear as Clear } from "react-icons/md";

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (term: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  filters: { status?: string };
  onFilterChange: (filters: { status?: string }) => void;
  onClearFilters: () => void;
}

export function SearchAndFilters({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  filters,
  onFilterChange,
  onClearFilters,
}: SearchAndFiltersProps) {
  return (
    <div className='border-b border-gray-200 dark:border-gray-700 p-4'>
      <div className='mb-4 flex items-center gap-4'>
        <div className='relative flex-1'>
          <Search className='absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400 dark:text-gray-500' />
          <input
            type='text'
            placeholder='Search designations...'
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className='w-full rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white py-2 pr-4 pl-10 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-600'
          />
          {searchTerm && (
            <button onClick={() => onSearchChange("")} className='absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600'>
              <Clear className='h-4 w-4' />
            </button>
          )}
        </div>
        <button
          onClick={onToggleFilters}
          className='flex items-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700'>
          <Filter className='h-4 w-4' />
          Filters
        </button>
      </div>
      {showFilters && (
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg bg-gray-50 dark:bg-gray-700 p-4'>
          <div>
            <label className='mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300'>Status</label>
            <select
              value={filters.status?.toString() ?? ""}
              onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
              className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-600'>
              <option value=''>All Status</option>
              <option value='true'>Active</option>
              <option value='false'>Inactive</option>
            </select>
          </div>
          <div className='flex items-end'>
            <button onClick={onClearFilters} className='px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'>
              Clear Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}