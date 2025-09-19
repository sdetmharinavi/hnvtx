'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { FiDatabase } from 'react-icons/fi';
import { toast } from 'sonner';

import { SelectFilter } from '@/components/common/filters/FilterInputs';
import { SearchAndFilters } from '@/components/common/filters/SearchAndFilters';
import {
  PageHeader,
  useStandardHeaderActions,
} from '@/components/common/page-header';
import { ErrorDisplay } from '@/components/common/ui';
import { ConfirmModal } from '@/components/common/ui/Modal/confirmModal';
import { PageSkeleton } from '@/components/common/ui/table/TableSkeleton';
import { SystemModal } from '@/components/systems/system-modal';
import { createStandardActions } from '@/components/table/action-helpers';
import { DataTable } from '@/components/table/DataTable';
import { SystemsTableColumns } from '@/config/table-columns/SystemsTableColumns';
import {
  convertRichFiltersToSimpleJson,
  Filters,
  Row,
  useGetLookupTypesByCategory,
  usePagedSystemsComplete,
} from '@/hooks/database';
import { useIsSuperAdmin } from '@/hooks/useAdminUsers';
import {
  DataQueryHookParams,
  DataQueryHookReturn,
  useCrudManager,
} from '@/hooks/useCrudManager';
import { Json } from '@/types/supabase-types';
import { SystemRowsWithCountWithRelations } from '@/types/view-row-types';
import { createClient } from '@/utils/supabase/client';

// 1. ADAPTER HOOK: Makes `useSystemsData` compatible with `useCrudManager`
const useSystemsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<SystemRowsWithCountWithRelations> => {
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
    data: (data || []).map((item) => ({
      ...item,
      maintenance_terminal_id: null, // Add missing field
      node_id: null, // Add missing field
      system_type_id: null, // Add missing field
    })),
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
    viewModal,
    bulkActions,
    deleteModal,
    actions: crudActions,
  } = useCrudManager<'systems', SystemRowsWithCountWithRelations>({
    tableName: 'systems',
    dataQueryHook: useSystemsData,
    searchColumn: 'system_name', // This can be considered the "primary" search field for display purposes
  });

  // --- State Management ---
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
      router.push(`/dashboard/systems/${system.id}`);
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

  // --- tableActions ---
  const tableActions = useMemo(
    () =>
      createStandardActions<SystemRowsWithCountWithRelations>({
        onEdit: editModal.openEdit,
        onView: handleView,
        onDelete: crudActions.handleDelete,
        onToggleStatus: crudActions.handleToggleStatus,
        canDelete: () => isSuperAdmin === true,
      }),
    [
      editModal.openEdit,
      handleView,
      crudActions.handleDelete,
      crudActions.handleToggleStatus,
      isSuperAdmin,
    ]
  );

  // --- Define header content using the hook ---
  const headerActions = useStandardHeaderActions({
    data: paginatedSystems as Row<'systems'>[],
    onRefresh: async () => {
      await refetch();
      toast.success('Refreshed successfully!');
    },
    onAddNew: editModal.openAdd,
    isLoading: isLoading,
    exportConfig: { tableName: 'systems' },
  });

  const headerStats = [
    { value: totalCount, label: 'Total Systems', color: 'primary' as const },
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
    {
      value: systemTypes.length,
      label: 'System Types',
      color: 'default' as const,
    },
  ];

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
          <PageHeader
            title="System Management"
            description="Manage network systems and their related information."
            icon={<FiDatabase />}
            stats={headerStats}
            actions={headerActions}
            isLoading={isLoading}
          />

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
      <SystemModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        rowData={editModal.record as SystemRowsWithCountWithRelations | null}
        refetch={refetch}
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
