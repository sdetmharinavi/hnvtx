"use client";

import { Card } from "@/components/common/ui/Card";
import { LookupModal } from "@/components/lookup/LookupModal";
import { useLookupTypes } from "@/components/lookup/lookup-hooks";
import { LookupTypesHeader } from "@/components/lookup/LookupTypesHeader";
import { LookupTypesFilters } from "@/components/lookup/LookupTypesFilters";
import { LookupTypesTable } from "@/components/lookup/LookupTypesTable";
import { useSorting } from "@/hooks/useSorting";
import {
  NoCategoriesState,
  SelectCategoryPrompt,
  LoadingState,
  ErrorState
} from "@/components/lookup/LookupTypesEmptyStates";
import { useMemo } from "react";

export default function LookupTypesPage() {
  const {
    state: {
      selectedCategory,
      isLookupModalOpen,
      searchTerm,
      editingLookup,
      categories,
      lookupTypes,
      isLoading,
      hasCategories,
      hasSelectedCategory,
      categoriesError,
      lookupError
    },
    handlers: {
      setSearchTerm,
      handleCategoryChange,
      handleRefresh,
      handleAddNew,
      handleEdit,
      handleDelete,
      handleToggleStatus,
      handleModalClose,
      handleLookupCreated,
      handleLookupUpdated
    }
  } = useLookupTypes();

  // Apply sorting to lookup types
  const {
    sortedData: sortedLookupTypes,
    handleSort,
    getSortDirection
  } = useSorting({
    data: lookupTypes,
    defaultSortKey: 'name',
    defaultDirection: 'asc',
    options: {
      caseSensitive: false,
      numericSort: true
    }
  });

  // Filter sorted data based on search term
  const filteredAndSortedLookupTypes = useMemo(() => {
    if (!searchTerm.trim()) return sortedLookupTypes;
    
    const lowerSearchTerm = searchTerm.toLowerCase();
    return sortedLookupTypes.filter(lookup => 
      lookup.name?.toLowerCase().includes(lowerSearchTerm) ||
      lookup.code?.toLowerCase().includes(lowerSearchTerm) ||
      lookup.description?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [sortedLookupTypes, searchTerm]);

  return (
    <div className="space-y-6 p-6">
      <LookupTypesHeader
        onRefresh={handleRefresh}
        onAddNew={handleAddNew}
        isLoading={isLoading}
        hasSelectedCategory={hasSelectedCategory}
      />

      {!hasCategories && !isLoading && (
        <NoCategoriesState error={categoriesError as Error} isLoading={isLoading} />
      )}

      {hasCategories && (
        <LookupTypesFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          hasSelectedCategory={hasSelectedCategory}
        />
      )}

      {lookupError && hasSelectedCategory && (
        <ErrorState error={lookupError} onRetry={handleRefresh} />
      )}

      {isLoading && hasSelectedCategory && (
        <LoadingState selectedCategory={selectedCategory} />
      )}

      {hasSelectedCategory && !isLoading && !lookupError && (
        <Card className="overflow-hidden">
          <div className="border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredAndSortedLookupTypes.length} of {lookupTypes.length} lookup
              types for category: <strong className="text-gray-900 dark:text-gray-100">{`"${selectedCategory}"`}</strong>
              {searchTerm && (
                <span className="ml-2">
                  (filtered by: <em>&quot;{searchTerm}&quot;</em>)
                </span>
              )}
            </p>
          </div>

          <LookupTypesTable
            lookups={filteredAndSortedLookupTypes}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            selectedCategory={selectedCategory}
            searchTerm={searchTerm}
            onSort={handleSort}
            getSortDirection={getSortDirection}
          />
        </Card>
      )}

      {!hasSelectedCategory && !isLoading && hasCategories && (
        <SelectCategoryPrompt />
      )}

      <LookupModal
        isOpen={isLookupModalOpen}
        onClose={handleModalClose}
        onLookupCreated={handleLookupCreated}
        onLookupUpdated={handleLookupUpdated}
        editingLookup={editingLookup}
        category={selectedCategory}
        categories={categories}
      />
    </div>
  );
}