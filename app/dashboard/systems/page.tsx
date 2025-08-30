'use client';

import { useMemo, useState, useCallback } from 'react';
import {
  FiEdit,
  FiEye,
  FiMapPin,
  FiPlus,
  FiSearch,
  FiServer,
  FiTrash2,
  FiRefreshCw,
  FiX,
} from 'react-icons/fi';
import { toast } from 'sonner';
import { useDebounce } from 'use-debounce';
import { useRouter } from 'next/navigation';

import {
  convertRichFiltersToSimpleJson,
  Filters,
  useGetLookupTypesByCategory,
  usePagedSystemsComplete,
  useTableDelete,
} from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { AddSystemModal } from '@/components/systems/add-system-modal';
import { ConfirmModal } from '@/components/common/ui/Modal/confirmModal';
import { DataTable } from '@/components/table/DataTable';
import { Row } from '@/hooks/database';
import {
  PageSkeleton,
  StatsCardsSkeleton,
} from '@/components/common/ui/table/TableSkeleton';
import { DEFAULTS } from '@/config/constants';
import {
  DataQueryHookParams,
  DataQueryHookReturn,
  useCrudManager,
} from '@/hooks/useCrudManager';
import { SystemRowsWithCount } from '@/types/view-row-types';
import { Json } from '@/types/supabase-types';
import { SystemsTableColumns } from '@/config/table-columns/SystemsTableColumns';
import { createStandardActions } from '@/components/table/action-helpers';
import { useIsSuperAdmin } from '@/hooks/useAdminUsers';
import { useStandardHeaderActions } from '@/components/common/PageHeader';
import { ErrorDisplay } from '@/components/common/ui';
import { SearchAndFilters } from '@/components/common/filters/SearchAndFilters';
import { SelectFilter } from '@/components/common/filters/FilterInputs';

interface SystemStats {
  total: number;
  active: number;
  inactive: number;
  unknown: number;
}

// 1. ADAPTER HOOK: Makes `useSystemsData` compatible with `useCrudManager`
const useSystemsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<SystemRowsWithCount> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();
  // Build the server filters object that the RPC function expects.
  const serverFilters = useMemo(() => {
    const richFilters: Filters = { ...filters };

    if (searchQuery) {
      richFilters.or = `system_name.ilike.%${searchQuery}%,system_type_name.ilike.%${searchQuery}%,status.ilike.%${searchQuery}%`;
    }
    return convertRichFiltersToSimpleJson(richFilters);
  }, [filters, searchQuery]);

  const { data, isLoading, error, refetch } = usePagedSystemsComplete(
    supabase,
    {
      filters: serverFilters as Json,
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
    }
  );

  // Calculate counts from the full dataset
  const totalCount = data?.[0]?.total_count || 0;
  const activeCount = data?.[0]?.active_count || 0;
  const inactiveCount = data?.[0]?.inactive_count || 0;

  return {
    data: data || [],
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    error,
    refetch,
  };
};

export default function SystemsPage() {
  const supabase = createClient();
  const router = useRouter();

  // 2. USE THE CRUD MANAGER with the adapter hook and both generic types
  const {
    data: paginatedSystems,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isMutating,
    error: systemsError,
    refetch,
    pagination,
    search,
    filters: crudFilters,
    editModal,
    // viewModal,
    bulkActions,
    deleteModal,
    actions: crudActions,
  } = useCrudManager<'systems', SystemRowsWithCount>({
    tableName: 'systems',
    dataQueryHook: useSystemsData,
    searchColumn: 'system_name', // This can be considered the "primary" search field for display purposes
  });

  // --- State Management ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const { data: isSuperAdmin } = useIsSuperAdmin();
  const [showFilters, setShowFilters] = useState(false);
  const handleClearFilters = () => {
    crudFilters.setFilters({});
    search.setSearchQuery('');
  };
  const activeFilterCount = Object.values(crudFilters.filters).filter(
    Boolean
  ).length;
  const hasActiveFilters = activeFilterCount > 0 || !!search.searchQuery;

  const { data: systemTypes = [], isLoading: isLoadingSystemTypes } =
    useGetLookupTypesByCategory(supabase, 'SYSTEM_TYPES');

  // --- Action Handlers ---
  const handleView = useCallback(
    (system: Row<'v_systems_complete'>) => {
      router.push(`/systems/${system.id}`);
    },
    [router]
  );

  const handleEdit = useCallback(
    (system: Row<'v_systems_complete'>) => {
      router.push(`/systems/${system.id}/edit`);
    },
    [router]
  );

  const handleRefresh = useCallback(() => {
    refetch();
    toast.success('Systems data refreshed');
  }, [refetch]);

  // --- Table Column Configuration ---
  const columns = SystemsTableColumns(paginatedSystems);

  const tableActions = useMemo(
    () =>
      createStandardActions({
        onEdit: editModal.openEdit,
        onView: (record) => handleView(record),
        onDelete: crudActions.handleDelete,
        onToggleStatus: crudActions.handleToggleStatus,
        canDelete: () => isSuperAdmin === true,
      }),
    [crudActions, editModal.openEdit, router, isSuperAdmin]
  );

  const headerStats = [
    { value: totalCount, label: 'Total Systems' },
    {
      value: activeCount,
      label: 'Active',
      color: 'success' as const,
    },
    {
      value: inactiveCount,
      label: 'Inactive',
      color: 'danger' as const,
    },
  ];

  const headerActions = useStandardHeaderActions({
    onRefresh: async () => {
      await refetch();
      toast.success('Refreshed successfully!');
    },
    onAddNew: editModal.openAdd,
    isLoading: isMutating,
    exportConfig: {
      tableName: 'systems',
      // filters: {
      //   system_type_id: {
      //     operator: 'neq',
      //     value: '',
      //   },
      // },
    },
  });

  // --- Loading State ---
  if (isLoading && !paginatedSystems.length) {
    return <PageSkeleton />;
  }

  if (systemsError) {
    return (
      <ErrorDisplay
        error={systemsError.message}
        actions={[
          {
            label: 'Retry',
            onClick: refetch,
            variant: 'primary',
          },
        ]}
      />
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-6 dark:bg-gray-900">
        <div className="mx-auto">
          {/* Header */}
          <div className="mb-6">
            <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h1 className="flex items-center gap-2 text-2xl font-bold text-gray-900 dark:text-white">
                  <FiServer className="text-blue-600" /> Systems
                </h1>
                <p className="mt-1 text-gray-600 dark:text-gray-400">
                  Manage and monitor all network systems across your
                  infrastructure.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleRefresh}
                  disabled={isLoading}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                >
                  <FiRefreshCw
                    className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`}
                  />
                  Refresh
                </button>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white shadow-sm transition-colors hover:bg-blue-700"
                >
                  <FiPlus /> Add System
                </button>
              </div>
            </div>

            {/* Stats */}
            {isLoading && paginatedSystems.length === 0 ? (
              <StatsCardsSkeleton count={4} />
            ) : (
              <div className="grid grid-cols-1 gap-4 text-center sm:grid-cols-2 md:grid-cols-4">
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="text-3xl font-bold text-gray-900 dark:text-white">
                    {totalCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Total Systems
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                    {activeCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Active Systems
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">
                    {inactiveCount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Inactive Systems
                  </div>
                </div>
                <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                  <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {isLoading ? '...' : systemTypes?.length.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    System Types
                  </div>
                </div>
              </div>
            )}
          </div>

          <DataTable
            title="Systems"
            data={paginatedSystems}
            columns={columns}
            pagination={{
              current: pagination.currentPage,
              pageSize: pagination.pageLimit,
              total: totalCount,
              onChange: (page, limit) => {
                pagination.setCurrentPage(page);
                pagination.setPageLimit(limit);
              },
            }}
            actions={tableActions}
            searchable={true}
            filterable={true}
            sortable={true}
            selectable={true}
            exportable={true}
            refreshable={true}
            density="default"
            bordered={true}
            striped={true}
            hoverable={true}
            className="mt-6"
            emptyText="No systems found matching your criteria"
            tableName="v_systems_complete"
            loading={isLoading}
            customToolbar={
              <SearchAndFilters
                searchTerm={search.searchQuery}
                onSearchChange={search.setSearchQuery}
                showFilters={showFilters}
                onToggleFilters={() => setShowFilters((p) => !p)}
                onClearFilters={handleClearFilters}
                hasActiveFilters={hasActiveFilters}
                activeFilterCount={activeFilterCount}
                searchPlaceholder="Search by Asset No or Route Name or Transnet ID..."
              >
                {/* THIS IS THE CLEANER, TYPE-SAFE WAY */}
                <SelectFilter
                  label="System Type"
                  filterKey="system_type_id"
                  filters={crudFilters.filters}
                  setFilters={crudFilters.setFilters}
                  options={systemTypes.map((t) => ({
                    value: t.id,
                    label: t.code,
                  }))}
                />
              </SearchAndFilters>
            }
          />
        </div>
      </div>

      {/* Modals */}
      <AddSystemModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        showIcon
        closeOnBackdrop
        closeOnEscape
        loading={deleteModal.loading}
        size="md"
      />
    </>
  );
}
