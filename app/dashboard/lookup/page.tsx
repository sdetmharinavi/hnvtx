// path: app/dashboard/lookup/page.tsx
'use client';

import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import { Card } from '@/components/common/ui/card';
import { LookupModal } from '@/components/lookup/LookupModal';
import {
  ErrorState,
  LoadingState,
  NoCategoriesState,
  SelectCategoryPrompt,
} from '@/components/lookup/LookupTypesEmptyStates';
import { LookupTypesFilters } from '@/components/lookup/LookupTypesFilters';
import { LookupTypesTable } from '@/components/lookup/LookupTypesTable';
import { useDeleteManager } from '@/hooks/useDeleteManager';
import { useSorting } from '@/hooks/useSorting';
import { useMemo, useCallback, useEffect } from 'react'; // Changed useState to useEffect
import { FiList } from 'react-icons/fi';
import { toast } from 'sonner';
import { useCrudManager } from '@/hooks/useCrudManager';
import { Lookup_typesRowSchema, Lookup_typesInsertSchema } from '@/schemas/zod-schemas';
import { useLookupTypesData } from '@/hooks/data/useLookupTypesData';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { useLookupActions } from '@/components/lookup/lookup-hooks';

export default function LookupTypesPage() {
  const { handlers: { handleCategoryChange }, selectedCategory } = useLookupActions();

  const {
    data: lookupTypes, totalCount, activeCount, inactiveCount,
    isLoading: isLoadingLookups, error, refetch,
    search, filters, editModal,
    actions: crudActions,
  } = useCrudManager<'lookup_types', Lookup_typesRowSchema>({
    tableName: 'lookup_types',
    dataQueryHook: useLookupTypesData,
    displayNameField: 'name',
  });
  
  const { data: categoriesData, isLoading: isLoadingCategories, error: categoriesError } = useOfflineQuery<Lookup_typesRowSchema[]>(
      ['unique-categories'],
      async () => {
          const { data, error: dbError } = await createClient().from('lookup_types').select('*').neq('name', 'DEFAULT');
          if(dbError) throw dbError;
          const unique = Array.from(new Map(data.map(item => [item.category, item])).values());
          return unique;
      },
      async () => {
          const allLookups = await localDb.lookup_types.filter(l => l.name !== 'DEFAULT').toArray();
          const unique = Array.from(new Map(allLookups.map(item => [item.category, item])).values());
          return unique;
      }
  );
  const categories = useMemo(() => categoriesData || [], [categoriesData]);

  // THE FIX: Use useEffect to sync the selectedCategory from the URL to the filters state.
  // This ensures that when the URL changes (via dropdown navigation), the filters update and the table re-renders.
  useEffect(() => {
    filters.setFilters({ category: selectedCategory });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, filters.setFilters]);

  const deleteManager = useDeleteManager({
    tableName: 'lookup_types',
    onSuccess: refetch,
  });

  const { sortedData: sortedLookupTypes, handleSort, getSortDirection } = useSorting({
    data: lookupTypes,
    defaultSortKey: 'sort_order',
  });
  
  const handleRefresh = useCallback(async () => {
    await refetch();
    toast.success('Data refreshed successfully');
  }, [refetch]);

  const hasCategories = categories.length > 0;
  const hasSelectedCategory = !!selectedCategory;
  const isLoading = isLoadingLookups || isLoadingCategories;

  const headerActions = useStandardHeaderActions({
    data: lookupTypes,
    onRefresh: handleRefresh,
    onAddNew: hasSelectedCategory ? editModal.openAdd : () => toast.error('Please select a category first.'),
    isLoading: isLoading,
    exportConfig: { tableName: 'lookup_types', filters: { category: selectedCategory } },
  });

  const headerStats = [
    { value: totalCount, label: 'Total Types in Category' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  const handleToggleStatusAdapter = (id: string, currentStatus: boolean) => {
    const record = lookupTypes.find(lt => lt.id === id);
    if (record) {
      crudActions.handleToggleStatus({ ...record, status: currentStatus });
    }
  };

  if (categoriesError) {
    return <ErrorDisplay error={categoriesError.message} actions={[{ label: 'Retry', onClick: handleRefresh, variant: 'primary' }]} />;
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Lookup Types"
        description="Manage lookup types for various categories."
        icon={<FiList />}
        stats={hasSelectedCategory ? headerStats : []}
        actions={headerActions}
        isLoading={isLoading}
      />

      {!hasCategories && !isLoading ? (
        <NoCategoriesState
          error={categoriesError ?? undefined}
          isLoading={isLoading}
        />
      ) : (
        <LookupTypesFilters
          categories={categories}
          selectedCategory={selectedCategory}
          onCategoryChange={handleCategoryChange}
          searchTerm={search.searchQuery}
          onSearchTermChange={search.setSearchQuery}
          hasSelectedCategory={hasSelectedCategory}
        />
      )}
      
      {error && hasSelectedCategory && <ErrorState error={error} onRetry={handleRefresh} />}
      {isLoading && hasSelectedCategory && <LoadingState selectedCategory={selectedCategory} />}

      {hasSelectedCategory && !isLoading && !error && (
        <Card className="overflow-hidden">
          <div className="border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {lookupTypes.length} of {totalCount} lookup types for category:{' '}
              <strong className="text-gray-900 dark:text-gray-100">{`"${selectedCategory}"`}</strong>
            </p>
          </div>
          <LookupTypesTable
            lookups={sortedLookupTypes}
            onEdit={editModal.openEdit}
            onDelete={crudActions.handleDelete}
            onToggleStatus={handleToggleStatusAdapter}
            selectedCategory={selectedCategory}
            searchTerm={search.searchQuery}
            onSort={handleSort}
            getSortDirection={getSortDirection}
          />
        </Card>
      )}

      {!hasSelectedCategory && !isLoading && hasCategories && <SelectCategoryPrompt />}

      <LookupModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        onLookupCreated={(data) => crudActions.handleSave(data)}
        onLookupUpdated={(data) => crudActions.handleSave(data as Lookup_typesInsertSchema)}
        editingLookup={editModal.record}
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