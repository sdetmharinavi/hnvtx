import { FiSearch } from "react-icons/fi";

interface RingsFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function RingsFilters({ searchQuery, onSearchChange }: RingsFiltersProps) {
  return (
    <div className="w-full">
      <div className="flex-1 sm:max-w-md lg:max-w-xl">
        <div className="relative">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search rings..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
          />
        </div>
      </div>
    </div>
  );
}

export default RingsFilters;
