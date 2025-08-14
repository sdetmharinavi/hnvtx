"use client";

import { Input } from "@/components/common/ui/Input";
import { FiSearch } from "react-icons/fi";
import { snakeToTitleCase } from "@/utils/formatters";

interface LookupTypesFiltersProps {
  categories: Array<{ id: string; category: string }>;
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  searchTerm: string;
  onSearchTermChange: (term: string) => void;
  hasSelectedCategory: boolean;
}

export function LookupTypesFilters({
  categories,
  selectedCategory,
  onCategoryChange,
  searchTerm,
  onSearchTermChange,
  hasSelectedCategory
}: LookupTypesFiltersProps) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Select Category
        </label>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none"
        >
          <option value="">Select a category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.category}>
              {snakeToTitleCase(category.category)} ({category.category})
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1">
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Search
        </label>
        <div className="relative">
          <FiSearch className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform text-gray-400 dark:text-gray-500" />
          <Input
            type="text"
            placeholder="Search lookup types..."
            value={searchTerm}
            onChange={(e) => onSearchTermChange(e.target.value)}
            className="pl-10 dark:bg-gray-800 dark:text-gray-100"
            disabled={!hasSelectedCategory}
          />
        </div>
      </div>
    </div>
  );
}