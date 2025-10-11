'use client';

import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import { FiDatabase } from 'react-icons/fi';
import { toast } from 'sonner';
import {
  PageHeader,
  useStandardHeaderActions,
} from '@/components/common/page-header';
import { ErrorDisplay } from '@/components/common/ui';
import { ConfirmModal } from '@/components/common/ui/Modal/confirmModal';
import { createStandardActions } from '@/components/table/action-helpers';
import { DataTable } from '@/components/table/DataTable';
import type { TableAction } from '@/components/table/datatable-types';
import { SystemsTableColumns } from '@/config/table-columns/SystemsTableColumns';
import { Filters, usePagedData, useTableQuery, useRpcMutation, RpcFunctionArgs } from '@/hooks/database';
import {
  DataQueryHookParams,
  DataQueryHookReturn,
  useCrudManager,
} from '@/hooks/useCrudManager';
import { V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { SystemModal } from '@/components/systems/SystemModal';
import { SelectFilter } from '@/components/common/filters/FilterInputs';
import { SearchAndFilters } from '@/components/common/filters/SearchAndFilters';
import { SystemFormData } from '@/schemas/system-schemas';

const useSystemsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_systems_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();

  const searchFilters = useMemo(() => {
    const newFilters: Filters = { ...filters };
    if (searchQuery) {
      newFilters.or = {
        system_name: searchQuery,
        system_type_name: searchQuery,
        node_name: searchQuery,
        ip_address: searchQuery,
      };
    }
    return newFilters;
  }, [filters, searchQuery]);

  const { data, isLoading, isFetching, error, refetch } = usePagedData<V_systems_completeRowSchema>(supabase,
    'v_systems_complete',
     {
      filters: searchFilters,
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
    }
  );

  return {
    data: data?.data || [],
    totalCount: data?.total_count || 0,
    activeCount: data?.active_count || 0,
    inactiveCount: data?.inactive_count || 0,
    isLoading,
    isFetching,
    error,
    refetch,
  };
};

export default function SystemsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [showFilters, setShowFilters] = useState(false);

  const {
    data: systems, totalCount, activeCount, inactiveCount, isLoading, isFetching, error, refetch,
    pagination, search, filters, editModal, deleteModal, actions: crudActions,
  } = useCrudManager<'systems', V_systems_completeRowSchema>({
    tableName: 'systems',
    dataQueryHook: useSystemsData,
    searchColumn: 'system_name',
    displayNameField: 'system_name'
  });

  const isInitialLoad = isLoading && systems.length === 0;

  const upsertSystemMutation = useRpcMutation(supabase, 'upsert_system_with_details', {
    onSuccess: () => {
      toast.success(`System ${editModal.record ? 'updated' : 'created'} successfully.`);
      refetch();
      editModal.close();
    },
    onError: (err) => toast.error(`Failed to save system: ${err.message}`),
  });

  const { data: systemTypesResult = { data: [] } } = useTableQuery(createClient(), 'lookup_types', { filters: { category: 'SYSTEM_TYPES' } });
  const systemTypes = systemTypesResult.data;

  const handleView = useCallback((system: V_systems_completeRowSchema) => {
    if (system.is_ring_based) {
      router.push(`/dashboard/systems/${system.id}`);
    } else {
      toast.info("Detailed path provisioning is only available for ring-based systems.");
    }
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
    data: systems,
    onRefresh: () => { refetch(); toast.success('Systems refreshed.'); },
    onAddNew: editModal.openAdd,
    isLoading: isLoading,
    exportConfig: { tableName: 'v_systems_complete', fileName: 'systems' },
  });

  const headerStats = [
    { value: totalCount, label: 'Total Systems' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  const handleSave = useCallback((formData: SystemFormData) => {
    const selectedSystemType = systemTypes.find(st => st.id === formData.system_type_id);
    const isRingBased = selectedSystemType?.is_ring_based;
    const isSdh = selectedSystemType?.is_sdh;

    const payload: RpcFunctionArgs<'upsert_system_with_details'> = {
        p_id: editModal.record?.id ?? undefined,
        p_system_name: formData.system_name!,
        p_system_type_id: formData.system_type_id!,
        p_node_id: formData.node_id!,
        p_status: formData.status ?? true,
        p_ip_address: formData.ip_address || undefined,
        p_maintenance_terminal_id: formData.maintenance_terminal_id || undefined,
        p_commissioned_on: formData.commissioned_on || undefined,
        p_s_no: formData.s_no || undefined,
        p_remark: formData.remark || undefined,
        p_make: formData.make || undefined,
        p_ring_id: (isRingBased && formData.ring_id) ? formData.ring_id : undefined,
        p_gne: (isSdh && formData.gne) ? formData.gne : undefined,
    };
    upsertSystemMutation.mutate(payload);
  }, [editModal.record, upsertSystemMutation, systemTypes]);

  if (error) return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;

  return (
    <div className="p-6 space-y-6">
      <PageHeader
        title="System Management"
        description="Manage all network systems, including CPAN, MAAN, SDH, DWDM etc."
        icon={<FiDatabase />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isInitialLoad}
        isFetching={isFetching}
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
              options={(systemTypes || []).map(t => ({ value: t.name, label: t.name }))}
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
        onSubmit={handleSave}
        isLoading={upsertSystemMutation.isPending}
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