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
import { LookupTypesTable } from '@/components/lookup/LookupTypesTable';
import { useSorting } from '@/hooks/useSorting';
import { useMemo, useCallback, useEffect } from 'react';
import { FiList } from 'react-icons/fi';
import { toast } from 'sonner';
import { useCrudManager } from '@/hooks/useCrudManager';
import { Lookup_typesRowSchema, Lookup_typesInsertSchema } from '@/schemas/zod-schemas';
import { useLookupTypesData } from '@/hooks/data/useLookupTypesData';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { createClient } from '@/utils/supabase/client';
import { localDb } from '@/hooks/data/localDb';
import { useLookupActions } from '@/components/lookup/lookup-hooks';
import { useUser } from '@/providers/UserProvider';
import { UserRole } from '@/types/user-roles';
import { snakeToTitleCase } from '@/utils/formatters';
import { FilterConfig, GenericFilterBar } from '@/components/common/filters/GenericFilterBar'; // IMPORT

export default function LookupTypesPage() {
  const {
    handlers: { handleCategoryChange },
    selectedCategory,
  } = useLookupActions();

  const { isSuperAdmin, role } = useUser();

  // --- PERMISSIONS ---
  const canManage = isSuperAdmin || role === UserRole.ADMIN;
  const canDelete = !!isSuperAdmin || role === UserRole.ADMINPRO;

  const {
    data: lookupTypes,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading: isLoadingLookups,
    isMutating,
    error,
    refetch,
    search,
    filters,
    editModal,
    deleteModal,
    actions: crudActions,
  } = useCrudManager<'lookup_types', Lookup_typesRowSchema>({
    tableName: 'lookup_types',
    dataQueryHook: useLookupTypesData,
    displayNameField: 'name',
    syncTables: ['lookup_types', 'v_lookup_types'],
  });

  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    error: categoriesError,
    refetch: refetchCategories,
  } = useOfflineQuery<Lookup_typesRowSchema[]>(
    ['unique-categories-v2'],
    async () => {
      const { data, error: dbError } = await createClient().from('lookup_types').select('*');
      if (dbError) throw dbError;
      const unique = Array.from(new Map(data.map((item) => [item.category, item])).values());
      return unique.sort((a, b) => a.category.localeCompare(b.category));
    },
    async () => {
      const allLookups = await localDb.lookup_types.toArray();
      const unique = Array.from(new Map(allLookups.map((item) => [item.category, item])).values());
      return unique.sort((a, b) => a.category.localeCompare(b.category));
    }
  );
  const categories = useMemo(() => categoriesData || [], [categoriesData]);

  useEffect(() => {
    // Only set if actually changed to prevent loops or empty overrides
    if (selectedCategory && filters.filters.category !== selectedCategory) {
      filters.setFilters({ category: selectedCategory });
    }
  }, [selectedCategory, filters]);

  const {
    sortedData: sortedLookupTypes,
    handleSort,
    getSortDirection,
  } = useSorting({
    data: lookupTypes,
    defaultSortKey: 'sort_order',
    defaultDirection: 'asc',
  });

  const handleRefresh = useCallback(async () => {
    await Promise.all([refetch(), refetchCategories()]);
    toast.success('Data refreshed successfully');
  }, [refetch, refetchCategories]);

  const hasCategories = categories.length > 0;
  const hasSelectedCategory = !!selectedCategory;
  const isLoading = isLoadingLookups || isLoadingCategories;

  const headerActions = useStandardHeaderActions({
    data: lookupTypes,
    onRefresh: handleRefresh,
    onAddNew: canManage
      ? hasSelectedCategory
        ? editModal.openAdd
        : () => toast.error('Please select a category first.')
      : undefined,
    isLoading: isLoading,
    exportConfig: canManage
      ? {
          tableName: 'lookup_types',
          filterOptions: [
            {
              label: 'selected lookups',
              filters: { category: selectedCategory },
              fileName: `selected_lookups.xlsx`,
            },
          ],
        }
      : undefined,
  });

  const headerStats = [
    { value: totalCount, label: 'Total Types' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  const handleToggleStatusAdapter = (id: string, currentStatus: boolean) => {
    const record = lookupTypes.find((lt) => lt.id === id);
    if (record) {
      crudActions.handleToggleStatus({ ...record, status: currentStatus });
    }
  };

  const handleModalSubmit = (data: Lookup_typesInsertSchema) => {
    crudActions.handleSave(data);
  };

  // --- FILTER CONFIG ---
  const filterConfigs = useMemo<FilterConfig[]>(() => {
    const categoryOptions = categories.map((c) => ({
      value: c.category,
      label: `${snakeToTitleCase(c.category)} (${c.category})`,
    }));

    return [
      {
        key: 'category',
        label: 'Category',
        options: categoryOptions,
        type: 'native-select',
        placeholder: 'Select a category',
      },
    ];
  }, [categories]);

  const handleFilterChange = (key: string, value: string | null) => {
    if (key === 'category' && value) {
      handleCategoryChange(value);
    }
  };

  if (categoriesError) {
    return (
      <ErrorDisplay
        error={categoriesError.message}
        actions={[{ label: 'Retry', onClick: handleRefresh, variant: 'primary' }]}
      />
    );
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

      {/* REPLACED WITH GENERIC FILTER BAR */}
      {!hasCategories && !isLoading ? (
        <NoCategoriesState error={categoriesError ?? undefined} isLoading={isLoading} />
      ) : (
        <GenericFilterBar
          searchQuery={search.searchQuery}
          onSearchChange={search.setSearchQuery}
          searchPlaceholder="Search lookup types..."
          filters={{ category: selectedCategory }}
          onFilterChange={handleFilterChange}
          filterConfigs={filterConfigs}
        />
      )}

      {error && hasSelectedCategory && <ErrorState error={error} onRetry={handleRefresh} />}
      {isLoading && hasSelectedCategory && <LoadingState selectedCategory={selectedCategory} />}

      {hasSelectedCategory && !isLoading && !error && (
        <Card className="overflow-hidden">
          <div className="border-b bg-gray-50 dark:bg-gray-800 dark:border-gray-700 p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {lookupTypes.length} lookup types for category:{' '}
              <strong className="text-gray-900 dark:text-gray-100">{`"${selectedCategory}"`}</strong>
            </p>
          </div>
          <LookupTypesTable
            lookups={sortedLookupTypes}
            onEdit={canManage ? editModal.openEdit : undefined}
            onDelete={canDelete ? crudActions.handleDelete : undefined}
            onToggleStatus={canManage ? handleToggleStatusAdapter : undefined}
            selectedCategory={selectedCategory}
            searchTerm={search.searchQuery}
            onSort={handleSort}
            getSortDirection={getSortDirection}
            canManage={canManage}
          />
        </Card>
      )}

      {!hasSelectedCategory && !isLoading && hasCategories && <SelectCategoryPrompt />}

      <LookupModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        onSubmit={handleModalSubmit}
        isLoading={isMutating}
        editingLookup={editModal.record}
        category={selectedCategory}
        categories={categories}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        type="danger"
        loading={deleteModal.loading}
      />
    </div>
  );
}
