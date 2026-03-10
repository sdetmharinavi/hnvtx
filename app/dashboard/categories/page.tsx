// app/dashboard/categories/page.tsx
"use client";

import { CategoriesTable } from "@/components/categories/CategoriesTable";
import { EmptyState } from "@/components/categories/EmptyState";
import { LoadingState } from "@/components/categories/LoadingState";
import { formatCategoryName } from "@/components/categories/utils";
import {
  PageHeader,
  useStandardHeaderActions,
} from "@/components/common/page-header";
import { ErrorDisplay } from "@/components/common/ui";
import { Filters } from "@/hooks/database";
import { useMemo, useState } from "react";
import { FiLayers } from "react-icons/fi";
import { toast } from "sonner";
import { useCategoriesData } from "@/hooks/data/useCategoriesData";
import { GenericFilterBar } from "@/components/common/filters/GenericFilterBar";

export default function CategoriesPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const {
    categories: categoriesDeduplicated,
    groupedLookups: groupedLookupsByCategory,
    categoryCounts: categoryLookupCounts,
    isLoading,
    error,
    refetch: refetchCategories,
  } = useCategoriesData();

  const filteredCategories = useMemo(
    () =>
      categoriesDeduplicated.filter(
        (category) =>
          (category.category &&
            category.category
              .toLowerCase()
              .includes(searchTerm.toLowerCase())) ||
          formatCategoryName(category)
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
      ),
    [categoriesDeduplicated, searchTerm],
  );

  const serverFilters = useMemo(
    (): Filters => ({ name: { operator: "eq", value: "DEFAULT" } }),
    [],
  );

  const headerActions = useStandardHeaderActions({
    data: categoriesDeduplicated,
    onRefresh: async () => {
      await refetchCategories();
      toast.success("Refreshed!");
    },
    isLoading: isLoading,
    exportConfig: {
      tableName: "lookup_types",
      fileName: "Categories",
      filters: serverFilters,
    },
  });

  const headerStats = useMemo(() => {
    const activeCategories = categoriesDeduplicated.filter((category) => {
      const info = categoryLookupCounts[category.category];
      return (
        info &&
        (groupedLookupsByCategory?.[category.category] || []).some(
          (l) => l.status,
        )
      );
    });
    return [
      { value: categoriesDeduplicated.length, label: "Total Categories" },
      {
        value: activeCategories.length,
        label: "Active",
        color: "success" as const,
      },
      {
        value: categoriesDeduplicated.length - activeCategories.length,
        label: "Inactive",
        color: "danger" as const,
      },
    ];
  }, [categoriesDeduplicated, categoryLookupCounts, groupedLookupsByCategory]);

  if (error) {
    return (
      <ErrorDisplay
        error={error.message}
        actions={[
          {
            label: "Retry",
            onClick: () => refetchCategories(),
            variant: "primary",
          },
        ]}
      />
    );
  }

  return (
    <div className="space-y-6 p-6 dark:bg-gray-900 dark:text-gray-100">
      <PageHeader
        title="Categories Viewer"
        description="Read-only view of system-wide categories and lookup types."
        icon={<FiLayers />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading}
      />

      <GenericFilterBar
        searchQuery={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="Search unique categories..."
        filters={{}}
        onFilterChange={() => {}}
        filterConfigs={[]}
      />

      {isLoading && <LoadingState />}

      {!isLoading && (
        <CategoriesTable
          categories={filteredCategories}
          categoryLookupCounts={categoryLookupCounts}
          totalCategories={categoriesDeduplicated.length}
          onEdit={() => {}}
          onDelete={() => {}}
          isDeleting={false}
          searchTerm={searchTerm}
          canEdit={false}
          canDelete={false}
        />
      )}

      {categoriesDeduplicated.length === 0 && !isLoading && (
        <EmptyState onCreate={() => {}} />
      )}
    </div>
  );
}
