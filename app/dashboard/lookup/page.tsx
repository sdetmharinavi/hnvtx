// path: app/dashboard/lookup/page.tsx
'use client';

import {
  PageHeader,
  useStandardHeaderActions,
} from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import { Card } from '@/components/common/ui/card';
import { useLookupTypes } from '@/components/lookup/lookup-hooks';
import { LookupModal } from '@/components/lookup/LookupModal';
import {
  ErrorState,
  LoadingState,
  NoCategoriesState,
  SelectCategoryPrompt,
} from '@/components/lookup/LookupTypesEmptyStates';
import { LookupTypesFilters } from '@/components/lookup/LookupTypesFilters';
import { LookupTypesTable } from '@/components/lookup/LookupTypesTable';
import { Filters } from '@/hooks/database';
import { useDeleteManager } from '@/hooks/useDeleteManager';
import { useSorting } from '@/hooks/useSorting';
import { useMemo } from 'react';
import { FiList } from 'react-icons/fi';
import { toast } from 'sonner';

export default function LookupTypesPage() {
  const deleteManager = useDeleteManager({
    tableName: 'lookup_types',
    onSuccess: () => {
      handleRefresh();
    },
  });

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
      lookupError,
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
      handleLookupUpdated,
    },
  } = useLookupTypes({ deleteHandler: deleteManager.deleteSingle });

  const {
    sortedData: sortedLookupTypes,
    handleSort,
    getSortDirection,
  } = useSorting({
    data: lookupTypes,
    defaultSortKey: 'category',
    defaultDirection: 'asc',
  });

  const filteredAndSortedLookupTypes = useMemo(() => {
    if (!searchTerm.trim()) return sortedLookupTypes;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return sortedLookupTypes.filter(
      (lookup) =>
        lookup.name?.toLowerCase().includes(lowerSearchTerm) ||
        lookup.code?.toLowerCase().includes(lowerSearchTerm) ||
        lookup.description?.toLowerCase().includes(lowerSearchTerm)
    );
  }, [sortedLookupTypes, searchTerm]);

  const serverFilters = useMemo((): Filters => {
    const f: Filters = { name: { operator: 'neq', value: 'DEFAULT' } };
    return f;
  }, []);

  const headerActions = useStandardHeaderActions({
    data: lookupTypes,
    onRefresh: async () => {
      await handleRefresh();
      toast.success('Refreshed successfully!');
    },
    onAddNew: handleAddNew,
    isLoading: isLoading,
    exportConfig: { tableName: 'lookup_types', filters: serverFilters },
  });

  const activeLookups = lookupTypes.filter((lookup) => lookup.status);
  const inactiveLookups = lookupTypes.filter((lookup) => !lookup.status);
  const headerStats = [
    { value: lookupTypes.length, label: 'Total Lookup Types' },
    { value: activeLookups.length, label: 'Active', color: 'success' as const },
    { value: inactiveLookups.length, label: 'Inactive', color: 'danger' as const },
  ];

  if (lookupError) {
    return (
      <ErrorDisplay
        error={lookupError.message}
        actions={[{ label: 'Retry', onClick: handleRefresh, variant: 'primary' }]}
      />
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Lookup Types"
        description="Manage lookup types"
        icon={<FiList />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading}
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
              Showing {filteredAndSortedLookupTypes.length} of {lookupTypes.length} lookup types for category:{' '}
              <strong className="text-gray-900 dark:text-gray-100">{`"${selectedCategory}"`}</strong>
              {searchTerm && (
                <span className="ml-2">(filtered by: <em>&quot;{searchTerm}&quot;</em>)</span>
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

      {!hasSelectedCategory && !isLoading && hasCategories && <SelectCategoryPrompt />}

      <LookupModal
        isOpen={isLookupModalOpen}
        onClose={handleModalClose}
        onLookupCreated={handleLookupCreated}
        onLookupUpdated={handleLookupUpdated}
        editingLookup={editingLookup}
        category={selectedCategory}
        categories={categories}
      />

      <ConfirmModal
        isOpen={deleteManager.isConfirmModalOpen}
        onConfirm={deleteManager.handleConfirm}
        onCancel={deleteManager.handleCancel}
        title="Confirm Deletion"
        message={deleteManager.confirmationMessage}
        type="danger"
        loading={deleteManager.isPending}
      />
    </div>
  );
}