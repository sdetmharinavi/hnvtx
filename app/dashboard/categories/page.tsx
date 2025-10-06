'use client';

import { CategoriesTable } from '@/components/categories/CategoriesTable';
import { CategoryModal } from '@/components/categories/CategoryModal';
import { CategorySearch } from '@/components/categories/CategorySearch';
import { EmptyState } from '@/components/categories/EmptyState';
import { LoadingState } from '@/components/categories/LoadingState';
import { formatCategoryName } from '@/components/categories/utils';
import {
  PageHeader,
  useStandardHeaderActions,
} from '@/components/common/page-header';
import { ErrorDisplay } from '@/components/common/ui';
import { ConfirmModal } from '@/components/common/ui/Modal';
import { Filters, useDeduplicated, useTableQuery } from '@/hooks/database';
import { useDelete } from '@/hooks/useDelete';
import { useDeleteManager } from '@/hooks/useDeleteManager';
import { Lookup_typesRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiLayers } from 'react-icons/fi';
import { toast } from 'sonner';

type GroupedLookupsByCategory = Record<string, Lookup_typesRowSchema[]>;
export interface CategoryInfo {
  name: string;
  lookupCount: number;
  hasSystemDefaults: boolean;
}

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryLookupCounts, setCategoryLookupCounts] = useState<
    Record<string, CategoryInfo>
  >({});
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null
  );

  const supabase = createClient();

  const {
    data: categoriesDeduplicated = [],
    isLoading: dedupLoading,
    error: dedupError,
    refetch: refetchCategories,
  } = useDeduplicated(supabase, 'lookup_types', {
    columns: ['category'],
    orderBy: [{ column: 'created_at', ascending: true }],
  });

  const {
    data: groupedLookupsByCategory,
    isLoading: groupedLookupsByCategoryLoading,
    error: groupedLookupsByCategoryError,
    refetch: refetchGroupedLookupsByCategory,
  } = useTableQuery(supabase, 'lookup_types', {
    select: (allLookups): GroupedLookupsByCategory => {
      if (!allLookups) return {};
      return allLookups.reduce((accumulator, currentLookup) => {
        const category = currentLookup.category;
        if (!accumulator[category]) {
          accumulator[category] = [];
        }
        accumulator[category].push(currentLookup);
        return accumulator;
      }, {} as GroupedLookupsByCategory);
    },
  });

  const deleteManager = useDelete({
    tableName: 'lookup_types',
    onSuccess: () => {
      if (selectedCategoryId === deleteManager.itemToDelete?.id) {
        setSelectedCategoryId(null);
      }
      refetchCategories();
    },
  });

  const isLoading =
    dedupLoading || groupedLookupsByCategoryLoading || deleteManager.isPending;

  const refreshCategoryInfo = useCallback(() => {
    const counts: Record<string, CategoryInfo> = {};
    for (const category of categoriesDeduplicated) {
      const categoryLookups =
        groupedLookupsByCategory?.[category.category] || [];
      counts[category.category] = {
        name: category.category,
        lookupCount: categoryLookups.length,
        hasSystemDefaults: categoryLookups.some(
          (lookup) => lookup.is_system_default
        ),
      };
    }
    setCategoryLookupCounts(counts);
  }, [categoriesDeduplicated, groupedLookupsByCategory]);

  useEffect(() => {
    if (!isLoading) {
      refreshCategoryInfo();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  async function handleRefresh() {
    try {
      await Promise.all([
        refetchCategories(),
        refetchGroupedLookupsByCategory(),
      ]);
      if (!isModalOpen) {
        toast.success('Data refreshed successfully');
      }
    } catch (error) {
      console.error('Error refreshing data:', error);
    }
  }

  const handleCategoryCreated = async () => {
    setIsModalOpen(false);
    setEditingCategory(null);
    handleRefresh();
  };

  const handleEdit = (categoryName: string) => {
    setEditingCategory(categoryName);
    setIsModalOpen(true);
    // handleRefresh();
  };

  const bulkDeleteManager = useDeleteManager({
    tableName: 'lookup_types',
    onSuccess: () => {
      if (selectedCategoryId === deleteManager.itemToDelete?.id) {
        setSelectedCategoryId(null);
      }
      refetchCategories();
    },
  });
  const handleDeleteCategory = (categoryToDelete: string) => {
    bulkDeleteManager.deleteBulk({
      column: 'category',
      value: categoryToDelete,
      displayName: categoryToDelete,
    });
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };

  const filteredCategories = (
    categoriesDeduplicated as Lookup_typesRowSchema[]
  )?.filter(
    (category) =>
      (category.category &&
        category.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      formatCategoryName(category as Lookup_typesRowSchema)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  // --- Define header content using the hook ---
  const serverFilters = useMemo(() => {
    const f: Filters = {
      // Filter to download only categories with name not equal to "DEFAULT"
      name: {
        operator: 'eq',
        value: 'DEFAULT',
      },
    };
    return f;
  }, []);
  const headerActions = useStandardHeaderActions({
    data: categoriesDeduplicated,
    onRefresh: async () => {
      await refetchCategories();
      toast.success('Refreshed successfully!');
    },
    onAddNew: openCreateModal,
    isLoading: isLoading,
    exportConfig: {
      tableName: 'lookup_types',
      fileName: 'Categories',
      filters: serverFilters,
    },
  });

  const activeCategories = categoriesDeduplicated.filter(
    (category) => category.status
  );
  const inactiveCategories = categoriesDeduplicated.filter(
    (category) => !category.status
  );

  const headerStats = [
    { value: categoriesDeduplicated.length, label: 'Total Categories' },
    {
      value: activeCategories.length,
      label: 'Active',
      color: 'success' as const,
    },
    {
      value: inactiveCategories.length,
      label: 'Inactive',
      color: 'danger' as const,
    },
  ];
  const error = dedupError || groupedLookupsByCategoryError;

  if (error) {
    return (
      <ErrorDisplay
        error={error.message}
        actions={[
          {
            label: 'Retry',
            onClick: refetchCategories,
            variant: 'primary',
          },
        ]}
      />
    );
  }

  return (
    <div className="space-y-6 p-6 dark:bg-gray-900 dark:text-gray-100">
      <PageHeader
        title="Categories"
        description="Manage categories and their related information."
        icon={<FiLayers />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading}
      />

      <CategorySearch searchTerm={searchTerm} onSearchChange={setSearchTerm} />

      {isLoading && <LoadingState />}

      {!isLoading && !dedupError && !groupedLookupsByCategoryError && (
        <CategoriesTable
          categories={filteredCategories}
          categoryLookupCounts={categoryLookupCounts}
          totalCategories={categoriesDeduplicated.length}
          onEdit={handleEdit}
          onDelete={handleDeleteCategory}
          isDeleting={deleteManager.isPending}
          searchTerm={searchTerm}
        />
      )}

      {categoriesDeduplicated.length === 0 && !isLoading && !dedupError && (
        <EmptyState onCreate={openCreateModal} />
      )}

      <ConfirmModal
        isOpen={bulkDeleteManager.isConfirmModalOpen}
        onConfirm={bulkDeleteManager.handleConfirm}
        onCancel={bulkDeleteManager.handleCancel}
        title="Confirm Deletion"
        message={bulkDeleteManager.confirmationMessage}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        showIcon
        closeOnBackdrop
        closeOnEscape
        loading={bulkDeleteManager.isPending}
        size="md"
      />

      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onCategoryCreated={handleCategoryCreated}
        editingCategory={editingCategory || ''}
        categories={categoriesDeduplicated}
        lookupsByCategory={groupedLookupsByCategory}
      />
    </div>
  );
}
