// app/dashboard/systems/page.tsx
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
import { useRpcMutation, RpcFunctionArgs } from '@/hooks/database';
import {
  DataQueryHookParams,
  DataQueryHookReturn,
  useCrudManager,
} from '@/hooks/useCrudManager';
import { Lookup_typesRowSchema, V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { SystemModal } from '@/components/systems/SystemModal';
import { SelectFilter } from '@/components/common/filters/FilterInputs';
import { SearchAndFilters } from '@/components/common/filters/SearchAndFilters';
import { SystemFormData } from '@/schemas/system-schemas';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/data/localDb';

const useSystemsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_systems_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  const { data: allSystems = [], isLoading, isFetching, error, refetch } = useOfflineQuery(
    ['systems-data', 'all'],
    async () => {
      const { data, error } = await createClient().from('v_systems_complete').select('*');
      if (error) throw error;
      return data || [];
    },
    async () => {
      return await localDb.v_systems_complete.toArray();
    },
    { staleTime: 5 * 60 * 1000 }
  );

  const processedData = useMemo(() => {
    let filtered = allSystems;

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((system: V_systems_completeRowSchema) =>
        system.system_name?.toLowerCase().includes(lowerQuery) ||
        system.system_type_name?.toLowerCase().includes(lowerQuery) ||
        system.node_name?.toLowerCase().includes(lowerQuery) ||
        String(system.ip_address)?.toLowerCase().includes(lowerQuery)
      );
    }

    if (filters.system_type_name) {
      filtered = filtered.filter((system: V_systems_completeRowSchema) => system.system_type_name === filters.system_type_name);
    }
    if (filters.status) {
      const statusBool = filters.status === 'true';
      filtered = filtered.filter((system: V_systems_completeRowSchema) => system.status === statusBool);
    }

    const totalCount = filtered.length;
    const activeCount = filtered.filter((s: V_systems_completeRowSchema) => s.status === true).length;
    
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
    };
  }, [allSystems, searchQuery, filters, currentPage, pageLimit]);

  return {
    ...processedData,
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

  const { data: systemTypesResult } = useOfflineQuery<Lookup_typesRowSchema[]>(
    ['system-types-for-filter'],
    async () => (await createClient().from('lookup_types').select('*').eq('category', 'SYSTEM_TYPES')).data ?? [],
    async () => await localDb.lookup_types.where({ category: 'SYSTEM_TYPES' }).toArray()
  );
  const systemTypes = useMemo(() => systemTypesResult || [], [systemTypesResult]);

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