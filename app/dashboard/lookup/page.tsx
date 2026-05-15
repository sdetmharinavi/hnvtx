// app/dashboard/lookup/page.tsx
'use client';

import { useStandardHeaderActions } from '@/components/common/page-header';
import { PageSpinner } from '@/components/common/ui';
import dynamic from 'next/dynamic';
import {
  ErrorState,
  LoadingState,
  NoCategoriesState,
  SelectCategoryPrompt,
} from '@/components/lookup/LookupTypesEmptyStates';
import { useMemo, useCallback, useEffect } from 'react';
import { FiList } from 'react-icons/fi';
import { toast } from 'sonner';
import { useCrudManager } from '@/hooks/useCrudManager';
import { Lookup_typesRowSchema, Lookup_typesInsertSchema } from '@/schemas/zod-schemas';
import { useLookupTypesData } from '@/hooks/data/useLookupTypesData';
import { createClient } from '@/utils/supabase/client';
import { useLookupActions } from '@/components/lookup/lookup-hooks';
import { useUser } from '@/providers/UserProvider';
import { snakeToTitleCase } from '@/utils/formatters';
import { FilterConfig } from '@/components/common/filters/GenericFilterBar';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { DataTable } from '@/components/table';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { createStandardActions } from '@/components/table/action-helpers';
import { Row } from '@/hooks/database';
import { PERMISSIONS } from '@/config/permissions';
import { StatProps } from '@/components/common/page-header/StatCard';
import { useQuery } from '@tanstack/react-query';

const LookupModal = dynamic(
  () => import('@/components/lookup/LookupModal').then((mod) => mod.LookupModal),
  { loading: () => <PageSpinner text='Loading Lookup Form...' /> },
);

export default function LookupTypesPage() {
  const {
    handlers: { handleCategoryChange },
    selectedCategory,
  } = useLookupActions();

  const { canAccess } = useUser();
  const canManage = canAccess(PERMISSIONS.canManage);
  const canDelete = canAccess(PERMISSIONS.canDeleteCritical);

  const crud = useCrudManager<'lookup_types', Lookup_typesRowSchema>({
    tableName: 'lookup_types',
    dataQueryHook: useLookupTypesData,
    displayNameField: 'name',
    syncTables: ['lookup_types', 'v_lookup_types'],
  });

  const {
    data: lookupTypes,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading: isLoadingLookups,
    isMutating,
    isFetching,
    error,
    refetch,
    filters,
    editModal,
    actions: crudActions,
  } = crud;

  // THE FIX: Replaced useOfflineQuery with standard useQuery
  const {
    data: categoriesData,
    isLoading: isLoadingCategories,
    error: categoriesError,
    refetch: refetchCategories,
  } = useQuery({
    queryKey: ['unique-categories-list'],
    queryFn: async () => {
      const { data, error: dbError } = await createClient()
        .from('lookup_types')
        .select('category, id') // Just need unique categories
        .order('category');

      if (dbError) throw dbError;

      // Client-side unique because distinct() isn't directly exposed in this simple client usage
      // without using .rpc or a view.
      const unique = Array.from(new Map(data.map((item) => [item.category, item])).values());
      
      // Map to simplified schema expected by UI
      return unique.sort((a, b) => a.category.localeCompare(b.category)) as unknown as Lookup_typesRowSchema[];
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const categories = useMemo(() => categoriesData || [], [categoriesData]);

  // Sync the URL param 'category' with the internal filters
  useEffect(() => {
    if (selectedCategory && filters.filters.category !== selectedCategory) {
      filters.setFilters({ category: selectedCategory });
    }
  }, [selectedCategory, filters]);

  const isOnline = useOnlineStatus();

  const handleRefresh = useCallback(async () => {
    if (isOnline) {
      await refetch();
      await refetchCategories();
    } else {
      await Promise.all([refetch(), refetchCategories()]);
    }
    toast.success('Data refreshed successfully');
  }, [refetch, refetchCategories, isOnline]);

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
    isFetching: isFetching,
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

  const headerStats = useMemo<StatProps[]>(() => {
    if (!hasSelectedCategory) return [];

    const currentStatus = filters.filters.status;

    return [
      {
        value: totalCount,
        label: 'Total Types',
        color: 'default',
        onClick: () =>
          filters.setFilters((prev) => {
            const next = { ...prev };
            delete next.status;
            return next;
          }),
        isActive: !currentStatus,
      },
      {
        value: activeCount,
        label: 'Active',
        color: 'success',
        onClick: () => filters.setFilters((prev) => ({ ...prev, status: 'true' })),
        isActive: currentStatus === 'true',
      },
      {
        value: inactiveCount,
        label: 'Inactive',
        color: 'danger',
        onClick: () => filters.setFilters((prev) => ({ ...prev, status: 'false' })),
        isActive: currentStatus === 'false',
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    hasSelectedCategory,
    totalCount,
    activeCount,
    inactiveCount,
    filters.filters.status,
    filters.setFilters,
  ]);

  const handleModalSubmit = (data: Lookup_typesInsertSchema) => {
    crudActions.handleSave(data);
  };

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

  const columns: Column<Lookup_typesRowSchema>[] = useMemo(
    () => [
      { key: 'sort_order', title: 'Order', dataIndex: 'sort_order', width: 80, sortable: true },
      { key: 'name', title: 'Name', dataIndex: 'name', sortable: true, searchable: true },
      { key: 'code', title: 'Short Code', dataIndex: 'code', width: 120, sortable: true },
      { key: 'description', title: 'Description', dataIndex: 'description', width: 250 },
      {
        key: 'status',
        title: 'Status',
        dataIndex: 'status',
        width: 100,
        render: (val: unknown) => (
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
              val
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
            }`}
          >
            {val ? 'Active' : 'Inactive'}
          </span>
        ),
      },
    ],
    [],
  );

  const tableActions = useMemo(
    () =>
      createStandardActions({
        onEdit: canManage ? editModal.openEdit : undefined,
        onDelete: canDelete ? crudActions.handleDelete : undefined,
        onToggleStatus: canManage ? crudActions.handleToggleStatus : undefined,
      }),
    [
      canManage,
      canDelete,
      editModal.openEdit,
      crudActions.handleDelete,
      crudActions.handleToggleStatus,
    ],
  );

  let content = null;

  if (categoriesError) {
    content = <ErrorState error={categoriesError} onRetry={handleRefresh} />;
  } else if (!hasCategories && !isLoading) {
    content = <NoCategoriesState error={categoriesError ?? undefined} isLoading={isLoading} />;
  } else if (!hasSelectedCategory && !isLoading && hasCategories) {
    content = <SelectCategoryPrompt />;
  } else if (isLoading && hasSelectedCategory) {
    content = <LoadingState selectedCategory={selectedCategory} />;
  } else if (error && hasSelectedCategory) {
    content = <ErrorState error={error} onRetry={handleRefresh} />;
  } else {
    content = (
      <DataTable
        autoHideEmptyColumns={true}
        tableName='lookup_types'
        data={lookupTypes as Row<'lookup_types'>[]}
        columns={columns as unknown as Column<Row<'lookup_types'>>[]}
        actions={tableActions}
        loading={isLoading}
        searchable={true}
        filterable={false}
        pagination={{
          current: crud.pagination.currentPage,
          pageSize: crud.pagination.pageLimit,
          total: totalCount,
          onChange: (p, s) => {
            crud.pagination.setCurrentPage(p);
            crud.pagination.setPageLimit(s);
          },
        }}
        customToolbar={<></>}
      />
    );
  }

  return (
    <DashboardPageLayout
      crud={crud}
      header={{
        title: 'Lookup Types',
        description: 'Manage lookup types for various categories.',
        icon: <FiList />,
        stats: hasSelectedCategory ? headerStats : [],
        actions: headerActions,
        isLoading: isLoading,
      }}
      searchPlaceholder='Search lookup types...'
      filters={{ category: selectedCategory }}
      onFilterChange={handleFilterChange}
      filterConfigs={filterConfigs}
      renderGrid={() => <div className='p-4'>{content}</div>}
      renderTable={() => <div className='p-4'>{content}</div>}
      modals={
        <LookupModal
          isOpen={editModal.isOpen}
          onClose={editModal.close}
          onSubmit={handleModalSubmit}
          isLoading={isMutating}
          editingLookup={editModal.record}
          category={selectedCategory}
          categories={categories}
        />
      }
    />
  );
}