// path: app/dashboard/systems/page.tsx

'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { FiDatabase } from 'react-icons/fi';
import { toast } from 'sonner';

import { SelectFilter } from '@/components/common/filters/FilterInputs';
import { SearchAndFilters } from '@/components/common/filters/SearchAndFilters';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ErrorDisplay } from '@/components/common/ui';
import { ConfirmModal } from '@/components/common/ui/Modal/confirmModal';
import { createStandardActions } from '@/components/table/action-helpers';
import { DataTable } from '@/components/table/DataTable';
import type { TableAction } from '@/components/table/datatable-types';
import { SystemsTableColumns } from '@/config/table-columns/SystemsTableColumns';
import { convertRichFiltersToSimpleJson, Filters, Row, usePagedSystemsComplete, useTableQuery } from '@/hooks/database';
import { DataQueryHookParams, DataQueryHookReturn, useCrudManager } from '@/hooks/useCrudManager';
import { Json } from '@/types/supabase-types';
// CORRECTED: Import the correct, auto-generated schema type
import { SystemsRowSchema, V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { SystemModal } from '@/components/systems/SystemModal';

// 1. ADAPTER HOOK: Correctly typed to return the auto-generated view schema
const useSystemsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_systems_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();
  
  const serverFilters = useMemo(() => {
    const richFilters: Filters = { ...filters };
    if (searchQuery) {
      richFilters.or = `(system_name.ilike.%${searchQuery}%,system_type_name.ilike.%${searchQuery}%)`;
    }
    return convertRichFiltersToSimpleJson(richFilters);
  }, [filters, searchQuery]);

  const { data, isLoading, error, refetch } = usePagedSystemsComplete(supabase, {
    filters: serverFilters as Json,
    limit: pageLimit,
    offset: (currentPage - 1) * pageLimit,
  });

  return {
    data: (data || []) as V_systems_completeRowSchema[],
    totalCount: data?.[0]?.total_count || 0,
    activeCount: data?.[0]?.active_count || 0,
    inactiveCount: data?.[0]?.inactive_count || 0,
    isLoading,
    error,
    refetch,
  };
};

export default function SystemsPage() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);

  // 2. USE THE CRUD MANAGER: Correctly typed with the base table and the auto-generated view schema
  const {
    data: systems, totalCount, activeCount, inactiveCount, isLoading, error, refetch,
    pagination, search, filters, editModal, deleteModal, actions: crudActions,
  } = useCrudManager<'systems', V_systems_completeRowSchema>({
    tableName: 'systems',
    dataQueryHook: useSystemsData,
    searchColumn: 'system_name',
  });

  const { data: systemTypes = [] } = useTableQuery(createClient(), 'lookup_types', { filters: { category: 'SYSTEM_TYPES' } });

  const handleView = useCallback((system: Row<'v_systems_complete'>) => {
    router.push(`/dashboard/systems/${system.id}`);
  }, [router]);

  const tableActions = useMemo(
    () => createStandardActions<V_systems_completeRowSchema>({
        onEdit: editModal.openEdit,
        onView: handleView,
        onDelete: crudActions.handleDelete,
        onToggleStatus: crudActions.handleToggleStatus,
      }),
    [editModal.openEdit, handleView, crudActions]
  );

  const headerActions = useStandardHeaderActions({
    data: systems as V_systems_completeRowSchema[],
    onRefresh: () => { refetch(); toast.success('Systems refreshed.'); },
    onAddNew: editModal.openAdd,
    isLoading: isLoading,
    exportConfig: { tableName: 'v_systems_complete', fileName: 'systems' },
  });

  if (error) return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="System Management"
        description="Manage all network systems, including CPAN, MAAN, SDH, and VMUX."
        icon={<FiDatabase />}
        stats={[
          { value: totalCount, label: 'Total Systems' },
          { value: activeCount, label: 'Active', color: 'success' },
          { value: inactiveCount, label: 'Inactive', color: 'danger' },
        ]}
        actions={headerActions}
        isLoading={isLoading}
      />
      <DataTable
        tableName="v_systems_complete"
        data={systems}
        columns={SystemsTableColumns(systems)}
        loading={isLoading}
        actions={tableActions as TableAction<'v_systems_complete'>[]}
        pagination={{
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, limit) => { pagination.setCurrentPage(page); pagination.setPageLimit(limit); },
        }}
        customToolbar={
          <SearchAndFilters
            searchTerm={search.searchQuery}
            onSearchChange={search.setSearchQuery}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(p => !p)}
            onClearFilters={() => { search.setSearchQuery(''); filters.setFilters({}); }}
            hasActiveFilters={Object.values(filters.filters).some(Boolean) || !!search.searchQuery}
            activeFilterCount={Object.values(filters.filters).filter(Boolean).length}
            searchPlaceholder="Search by system name or type..."
          >
            <SelectFilter
              label="System Type"
              filterKey="system_type_name"
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={systemTypes.map(t => ({ value: t.name, label: t.name }))}
            />
            <SelectFilter
              label="Status"
              filterKey="status"
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]}
            />
          </SearchAndFilters>
        }
      />

      <SystemModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        rowData={editModal.record}
        refetch={refetch}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        loading={deleteModal.loading}
        type="danger"
      />
    </div>
  );
}