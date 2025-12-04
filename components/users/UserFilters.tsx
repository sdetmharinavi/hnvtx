import { motion } from "framer-motion";
import { FiSearch, FiX, FiFilter, FiChevronDown, FiChevronUp } from "react-icons/fi";
import { UserRole } from "@/types/user-roles";

interface UserFiltersProps {
  searchQuery: string;
  roleFilter: string;
  statusFilter: string;
  emailVerificationFilter: string;
  showFilters: boolean;
  onSearchChange: (value: string) => void;
  onRoleFilterChange: (value: string) => void;
  onStatusFilterChange: (value: string) => void;
  onEmailVerificationFilterChange: (value: string) => void;
  onToggleFilters: () => void;
  onClearFilters: () => void;
}

export function UserFilters({
  searchQuery,
  roleFilter,
  statusFilter,
  emailVerificationFilter,
  showFilters,
  onSearchChange,
  onRoleFilterChange,
  onStatusFilterChange,
  onEmailVerificationFilterChange,
  onToggleFilters,
  onClearFilters,
}: UserFiltersProps) {
  const hasActiveFilters = !!(searchQuery || roleFilter || statusFilter || emailVerificationFilter);
  const activeFilterCount = [roleFilter, statusFilter, emailVerificationFilter].filter(Boolean).length;

  return (
    <div className="space-y-3 sm:space-y-4 w-full">
      {/* Search and Controls Row */}
      <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:gap-3 sm:justify-between sm:items-center">
        {/* Search Input */}
        <div className="flex-1 sm:max-w-md lg:max-w-xl">
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
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
            {showFilters ? (
              <FiChevronUp size={14} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            ) : (
              <FiChevronDown size={14} className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
            )}
            {activeFilterCount > 0 && (
              <span className="bg-blue-600 text-white text-xs rounded-full px-1.5 sm:px-2 py-0.5 font-semibold min-w-[18px] sm:min-w-[20px] text-center leading-none">
                {activeFilterCount}
              </span>
            )}
          </button>

          {hasActiveFilters && (
            <button
              onClick={onClearFilters}
              className="flex items-center gap-2 px-3 sm:px-4 py-2.5 sm:py-2 text-sm sm:text-base text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium border border-transparent hover:border-red-200 shrink-0"
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
          <div className="p-3 sm:p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-600">
            {/* Mobile: Stack all filters, Desktop: Grid layout */}
            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 sm:gap-4">
              {/* Role Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Filter by Role
                </label>
                <select
                  value={roleFilter}
                  onChange={(e) => onRoleFilterChange(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">All Roles</option>
                  {Object.values(UserRole).map((role) => (
                    <option key={role} value={role}>
                      {role.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Filter by Status
                </label>
                <select
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                  <option value="pending">Pending</option>
                </select>
              </div>

              {/* Email Verification Filter */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Status
                </label>
                <select
                  value={emailVerificationFilter}
                  onChange={(e) => onEmailVerificationFilterChange(e.target.value)}
                  className="w-full px-3 py-2.5 sm:py-2 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="">All</option>
                  <option value="verified">Verified</option>
                  <option value="unverified">Unverified</option>
                </select>
              </div>
            </div>

            {/* Mobile: Show clear filters button inside panel */}
            {hasActiveFilters && (
              <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 sm:hidden">
                <button
                  onClick={onClearFilters}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors font-medium border border-red-200 dark:border-red-800"
                >
                  <FiX className="w-4 h-4" />
                  Clear All Filters
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
}