"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { createClient } from "@/utils/supabase/client";
import { useDeduplicated, useTableQuery } from "@/hooks/database";
import { useDeleteManager } from "@/hooks/useDeleteManager";
import { CategoriesTable } from "@/components/categories/CategoriesTable";
import { CategoriesHeader } from "@/components/categories/CategoriesHeader";
import { CategorySearch } from "@/components/categories/CategorySearch";
import { CategoryModal } from "@/components/categories/CategoryModal";
import { ConfirmModal } from "@/components/common/ui/Modal";
import { ErrorDisplay } from "@/components/categories/ErrorDisplay";
import { EmptyState } from "@/components/categories/EmptyState";
import { LoadingState } from "@/components/categories/LoadingState";
import { Categories, GroupedLookupsByCategory } from "@/components/categories/categories-types";



export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [categoryLookupCounts, setCategoryLookupCounts] = useState<
    Record<string, CategoryInfo>
  >({});

  const supabase = createClient();
  
  const deleteManager = useDeleteManager({
    tableName: 'lookup_types',
    onSuccess: handleRefresh,
  });

  const {
    data: categoriesDeduplicated = [],
    isLoading: dedupLoading,
    error: dedupError,
    refetch: refetchCategories,
  } = useDeduplicated(supabase, "lookup_types", {
    columns: ["category"],
    orderBy: [{ column: "created_at", ascending: true }],
  });

  const {
    data: groupedLookupsByCategory,
    isLoading: groupedLookupsByCategoryLoading,
    error: groupedLookupsByCategoryError,
    refetch: refetchGroupedLookupsByCategory,
  } = useTableQuery(supabase, "lookup_types", {
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

  const isLoading = dedupLoading || groupedLookupsByCategoryLoading || deleteManager.isPending;

  const refreshCategoryInfo = useCallback(() => {
    const counts: Record<string, CategoryInfo> = {}
    for (const category of categoriesDeduplicated) {
      const categoryLookups = groupedLookupsByCategory?.[category.category] || [];
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
  }, [categoriesDeduplicated, groupedLookupsByCategory, isLoading, refreshCategoryInfo]);

  async function handleRefresh() {
    try {
      await Promise.all([
        refetchCategories(),
        refetchGroupedLookupsByCategory(),
      ]);
      toast.success("Data refreshed successfully");
    } catch (error) {
      console.error("Error refreshing data:", error);
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
    handleRefresh();
  };

  const handleDeleteCategory = (categoryToDelete: string) => {
    deleteManager.deleteBulk({
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

  const filteredCategories = (categoriesDeduplicated as Categories[])?.filter(
    (category) =>
      (category.category &&
        category.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      formatCategoryName(category as Categories)
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 p-6 dark:bg-gray-900 dark:text-gray-100">
      <CategoriesHeader 
        isLoading={isLoading}
        onRefresh={handleRefresh}
        onCreate={openCreateModal}
      />

      <CategorySearch 
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {(dedupError || groupedLookupsByCategoryError) && (
        <ErrorDisplay 
          error={dedupError || groupedLookupsByCategoryError as Error}
          onRetry={handleRefresh}
        />
      )}

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
        isOpen={deleteManager.isConfirmModalOpen}
        onConfirm={deleteManager.handleConfirm}
        onCancel={deleteManager.handleCancel}
        title="Confirm Deletion"
        message={deleteManager.confirmationMessage}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        showIcon
        closeOnBackdrop
        closeOnEscape
        loading={deleteManager.isPending}
        size="md"
      />

      <CategoryModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onCategoryCreated={handleCategoryCreated}
        editingCategory={editingCategory || ""}
        categories={categoriesDeduplicated}
        lookupsByCategory={groupedLookupsByCategory}
      />
    </div>
  );
}

function formatCategoryName(category: Categories): string {
  return category.category
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

interface CategoryInfo {
  name: string;
  lookupCount: number;
  hasSystemDefaults: boolean;
}