// path: app/dashboard/categories/page.tsx
'use client';

import { CategoriesTable } from '@/components/categories/CategoriesTable';
import { CategoryModal } from '@/components/categories/CategoryModal';
import { CategorySearch } from '@/components/categories/CategorySearch';
import { EmptyState } from '@/components/categories/EmptyState';
import { LoadingState } from '@/components/categories/LoadingState';
import { formatCategoryName } from '@/components/categories/utils';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay } from '@/components/common/ui';
import { ConfirmModal } from '@/components/common/ui/Modal';
import { Filters, useDeduplicated, useTableQuery, useTableInsert } from '@/hooks/database';
import { useDeleteManager } from '@/hooks/useDeleteManager';
import { Lookup_typesInsertSchema, Lookup_typesRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiLayers } from 'react-icons/fi';
import { toast } from 'sonner';
import { GroupedLookupsByCategory, CategoryInfo } from '@/components/categories/categories-types';
import { useMutation } from '@tanstack/react-query';

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryLookupCounts, setCategoryLookupCounts] = useState<Record<string, CategoryInfo>>({});

  const supabase = createClient();

  const { data: categoriesResult, isLoading: dedupLoading, error: dedupError, refetch: refetchCategories } = useDeduplicated(supabase, 'lookup_types', {
    columns: ['category'],
    orderBy: [{ column: 'created_at', ascending: true }],
  });
  const categoriesDeduplicated = useMemo(() => categoriesResult?.data || [], [categoriesResult]);

  const { data: groupedLookupsByCategory, isLoading: groupedLookupsByCategoryLoading, error: groupedLookupsByCategoryError, refetch: refetchGroupedLookupsByCategory } = useTableQuery(supabase, 'lookup_types', {
    select: (result): GroupedLookupsByCategory => {
      const allLookups = result.data || [];
      return allLookups.reduce((accumulator, currentLookup) => {
        const category = currentLookup.category;
        if (!accumulator[category]) accumulator[category] = [];
        accumulator[category].push(currentLookup);
        return accumulator;
      }, {} as GroupedLookupsByCategory);
    },
  });

  const bulkDeleteManager = useDeleteManager({
    tableName: 'lookup_types',
    onSuccess: () => {
      refetchCategories();
      toast.success('Category and all associated lookups deleted.');
    },
  });

  const { mutate: createCategory, isPending: isCreating } = useTableInsert(supabase, 'lookup_types');

  // THE FIX: Create a dedicated mutation for the bulk rename operation.
  const { mutate: renameCategory, isPending: isRenaming } = useMutation({
    mutationFn: async ({ oldCategory, newCategory }: { oldCategory: string; newCategory: string }) => {
      const { error } = await supabase
        .from('lookup_types')
        .update({ category: newCategory })
        .eq('category', oldCategory);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Category renamed successfully.");
      handleRefresh();
      handleModalClose();
    },
    onError: (error: Error) => toast.error(`Failed to rename category: ${error.message}`),
  });

  const isLoading = dedupLoading || groupedLookupsByCategoryLoading || isCreating || isRenaming;

  const refreshCategoryInfo = useCallback(() => {
    const counts: Record<string, CategoryInfo> = {};
    for (const category of categoriesDeduplicated) {
      const categoryLookups = groupedLookupsByCategory?.[category.category] || [];
      counts[category.category] = {
        name: category.category,
        lookupCount: categoryLookups.length,
        hasSystemDefaults: categoryLookups.some(lookup => lookup.is_system_default),
      };
    }
    setCategoryLookupCounts(counts);
  }, [categoriesDeduplicated, groupedLookupsByCategory]);

  useEffect(() => {
    if (!isLoading) refreshCategoryInfo();
  }, [isLoading, refreshCategoryInfo]);

  const handleRefresh = useCallback(async () => {
    try {
      await Promise.all([refetchCategories(), refetchGroupedLookupsByCategory()]);
      toast.success('Data refreshed successfully');
    } catch (error) {
      toast.error('Failed to refresh data.');
      console.log(error);
    }
  }, [refetchCategories, refetchGroupedLookupsByCategory]);

  const handleEdit = useCallback((categoryName: string) => {
    setEditingCategory(categoryName);
    setIsModalOpen(true);
  }, []);

  const handleDeleteCategory = useCallback((categoryToDelete: string) => {
    bulkDeleteManager.deleteBulk({
      column: 'category',
      value: categoryToDelete,
      displayName: formatCategoryName({ category: categoryToDelete } as Lookup_typesRowSchema),
    });
  }, [bulkDeleteManager]);

  const openCreateModal = useCallback(() => {
    setEditingCategory(null);
    setIsModalOpen(true);
  }, []);

  const handleModalClose = useCallback(() => {
    setIsModalOpen(false);
    setEditingCategory(null);
  }, []);

  // THE FIX: This handler now uses the correct mutation for each case (create vs. edit/rename).
  const handleSaveCategory = useCallback((data: Lookup_typesInsertSchema, isEditing: boolean) => {
    const formattedCategory = data.category.trim().toUpperCase().replace(/\s+/g, "_").replace(/[^A-Z0-9_]/g, "");

    if (!formattedCategory) {
      toast.error("Please enter a valid category name");
      return;
    }

    if (isEditing) {
      if (!editingCategory) return;
      renameCategory({ oldCategory: editingCategory, newCategory: formattedCategory });
    } else {
      if (categoriesDeduplicated.some(cat => cat.category === formattedCategory)) {
        toast.error("A category with this name already exists.");
        return;
      }
      const createData = { ...data, category: formattedCategory };
      createCategory(createData, {
        onSuccess: () => {
          toast.success("Category created successfully.");
          handleRefresh();
          handleModalClose();
        },
        onError: (error: Error) => toast.error(`Failed to create category: ${error.message}`),
      });
    }
  }, [editingCategory, createCategory, renameCategory, handleRefresh, handleModalClose, categoriesDeduplicated]);

  const filteredCategories = useMemo(() =>
    categoriesDeduplicated.filter(
      (category) =>
        (category.category && category.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
        formatCategoryName(category).toLowerCase().includes(searchTerm.toLowerCase())
    ), [categoriesDeduplicated, searchTerm]);

  const serverFilters = useMemo((): Filters => ({ name: { operator: 'eq', value: 'DEFAULT' } }), []);
  const headerActions = useStandardHeaderActions({
    data: categoriesDeduplicated, onRefresh: handleRefresh, onAddNew: openCreateModal,
    isLoading: isLoading, exportConfig: { tableName: 'lookup_types', fileName: 'Categories', filters: serverFilters },
  });

  const headerStats = useMemo(() => {
    const activeCategories = categoriesDeduplicated.filter((category) => {
      const info = categoryLookupCounts[category.category];
      return info && (groupedLookupsByCategory?.[category.category] || []).some(l => l.status);
    });
    return [
      { value: categoriesDeduplicated.length, label: 'Total Categories' },
      { value: activeCategories.length, label: 'Active', color: 'success' as const },
      { value: categoriesDeduplicated.length - activeCategories.length, label: 'Inactive', color: 'danger' as const },
    ];
  }, [categoriesDeduplicated, categoryLookupCounts, groupedLookupsByCategory]);

  const error = dedupError || groupedLookupsByCategoryError;

  if (error) {
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: handleRefresh, variant: 'primary' }]} />;
  }

  return (
    <div className="space-y-6 p-6 dark:bg-gray-900 dark:text-gray-100">
      <PageHeader title="Categories" description="Manage categories and their related information." icon={<FiLayers />} stats={headerStats} actions={headerActions} isLoading={isLoading} />
      <CategorySearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />
      {isLoading && <LoadingState />}
      {!isLoading && !error && (
        <CategoriesTable categories={filteredCategories} categoryLookupCounts={categoryLookupCounts} totalCategories={categoriesDeduplicated.length} onEdit={handleEdit} onDelete={handleDeleteCategory} isDeleting={bulkDeleteManager.isPending} searchTerm={searchTerm} />
      )}
      {categoriesDeduplicated.length === 0 && !isLoading && !error && <EmptyState onCreate={openCreateModal} />}
      <ConfirmModal isOpen={bulkDeleteManager.isConfirmModalOpen} onConfirm={bulkDeleteManager.handleConfirm} onCancel={bulkDeleteManager.handleCancel} title="Confirm Deletion" message={bulkDeleteManager.confirmationMessage} confirmText="Delete" cancelText="Cancel" type="danger" showIcon loading={bulkDeleteManager.isPending} />
      <CategoryModal isOpen={isModalOpen} onClose={handleModalClose} onSubmit={handleSaveCategory} isLoading={isLoading} editingCategory={editingCategory} categories={categoriesDeduplicated} lookupsByCategory={groupedLookupsByCategory} />
    </div>
  );
}