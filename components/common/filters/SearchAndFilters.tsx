import { motion } from "framer-motion";
import { FiSearch, FiX, FiFilter, FiChevronDown, FiChevronUp } from "react-icons/fi";

interface SearchAndFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  onClearFilters: () => void;
  hasActiveFilters: boolean;
  activeFilterCount: number; // More descriptive than a boolean
  searchPlaceholder?: string;
  children: React.ReactNode;
}

export function SearchAndFilters({
  searchTerm,
  onSearchChange,
  showFilters,
  onToggleFilters,
  onClearFilters,
  hasActiveFilters,
  activeFilterCount,
  searchPlaceholder = "Search...",
  children,
}: SearchAndFiltersProps) {
  return (
    <div className="space-y-3 sm:space-y-4 w-full p-4 border-b border-gray-200 dark:border-gray-700">
      {/* Search and Controls Row */}
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-3 sm:justify-between sm:items-center">
        {/* Search Input */}
        <div className="flex-1 sm:max-w-md lg:max-w-xl">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            />
          </div>
        </div>

        {/* Filter and Clear Buttons */}
        <div className="flex gap-2 sm:gap-3">
          <button
            onClick={onToggleFilters}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 border rounded-lg font-medium text-sm sm:text-base transition-all duration-200 flex-1 sm:flex-none justify-center sm:justify-start ${
              showFilters || activeFilterCount > 0
                ? "border-blue-500 bg-blue-50 text-blue-700 dark:border-blue-400 dark:bg-blue-900/30 dark:text-blue-300 shadow-sm"
                : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400"
            }`}
          >
            <FiFilter size={16} className="w-4 h-4 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Filters</span>
            <span className="sm:hidden">Filter</span>
            {showFilters ? <FiChevronUp size={14} /> : <FiChevronDown size={14} />}
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 sm:px-2 py-0.5 font-semibold min-w-[18px] sm:min-w-[20px] text-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium border border-transparent hover:border-red-200 flex-shrink-0"
            >
              <FiX className="w-4 h-4" />
              <span className="hidden sm:inline">Clear All</span>
              <span className="sm:hidden">Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Collapsible Filter Panel */}
      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="overflow-hidden"
        >
          <div className="pt-3 sm:pt-4">
            <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {children}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}