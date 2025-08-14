"use client";

import { Card } from "@/components/common/ui/Card";
import { LookupModal } from "@/components/lookup/LookupModal";
import { useLookupTypes } from "@/components/lookup/lookup-hooks";
import { LookupTypesHeader } from "@/components/lookup/LookupTypesHeader";
import { LookupTypesFilters } from "@/components/lookup/LookupTypesFilters";
import { LookupTypesTable } from "@/components/lookup/LookupTypesTable";
import {
  NoCategoriesState,
  SelectCategoryPrompt,
  LoadingState,
  ErrorState
} from "@/components/lookup/LookupTypesEmptyStates";

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
              Showing {lookupTypes.length} of {lookupTypes.length} lookup
              types for category: <strong className="text-gray-900 dark:text-gray-100">{`"${selectedCategory}"`}</strong>
            </p>
          </div>

          <LookupTypesTable
            lookups={lookupTypes}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onToggleStatus={handleToggleStatus}
            selectedCategory={selectedCategory}
            searchTerm={searchTerm}
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