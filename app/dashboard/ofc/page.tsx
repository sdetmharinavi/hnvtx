// app/dashboard/ofc/page.tsx
'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { BulkActions } from '@/components/common/BulkActions';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import { createStandardActions } from '@/components/table/action-helpers';
import { DataTable } from '@/components/table/DataTable';
import { OfcTableColumns } from '@/config/table-columns/OfcTableColumns';
import { buildRpcFilters } from '@/hooks/database';
import { DataQueryHookParams, DataQueryHookReturn, useCrudManager } from '@/hooks/useCrudManager';
import { Ofc_cablesRowSchema, V_ofc_cables_completeRowSchema, Lookup_typesRowSchema, Maintenance_areasRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import OfcForm from '@/components/ofc/OfcForm/OfcForm';
import { SelectFilter } from '@/components/common/filters/FilterInputs';
import { SearchAndFilters } from '@/components/common/filters/SearchAndFilters';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { useUser } from '@/providers/UserProvider';
import { AiFillMerge } from 'react-icons/ai';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/data/localDb';
import { DEFAULTS } from '@/constants/constants';

const useOfcData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_ofc_cables_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  const onlineQueryFn = async (): Promise<V_ofc_cables_completeRowSchema[]> => {
    const rpcFilters = buildRpcFilters({
      ...filters,
      or: searchQuery
        ? `(route_name.ilike.%${searchQuery}%,asset_no.ilike.%${searchQuery}%,transnet_id.ilike.%${searchQuery}%,sn_name.ilike.%${searchQuery}%,en_name.ilike.%${searchQuery}%,ofc_owner_name.ilike.%${searchQuery}%)`
        : undefined
    });
    const { data, error } = await createClient().rpc('get_paged_data', {
      p_view_name: 'v_ofc_cables_complete',
      p_limit: DEFAULTS.PAGE_SIZE,
      p_offset: 0,
      p_filters: rpcFilters
    });
    if (error) throw error;
    return (data as { data: V_ofc_cables_completeRowSchema[] })?.data || [];
  };

  const offlineQueryFn = async (): Promise<V_ofc_cables_completeRowSchema[]> => {
    return await localDb.v_ofc_cables_complete.toArray();
  };

  const { data: allCables = [], isLoading, isFetching, error, refetch } = useOfflineQuery(
    ['ofc-cables-data', searchQuery, filters],
    onlineQueryFn,
    offlineQueryFn,
    { staleTime: DEFAULTS.CACHE_TIME }
  );
  
  const processedData = useMemo(() => {
    let filtered = allCables;
    // Client-side filtering for offline mode
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((cable: V_ofc_cables_completeRowSchema) =>
        cable.route_name?.toLowerCase().includes(lowerQuery) ||
        cable.asset_no?.toLowerCase().includes(lowerQuery) ||
        cable.transnet_id?.toLowerCase().includes(lowerQuery) ||
        cable.sn_name?.toLowerCase().includes(lowerQuery) ||
        cable.en_name?.toLowerCase().includes(lowerQuery) ||
        cable.ofc_owner_name?.toLowerCase().includes(lowerQuery)
      );
    }
    if (filters.ofc_type_id) filtered = filtered.filter(c => c.ofc_type_id === filters.ofc_type_id);
    if (filters.status) filtered = filtered.filter(c => c.status === (filters.status === 'true'));
    if (filters.ofc_owner_id) filtered = filtered.filter(c => c.ofc_owner_id === filters.ofc_owner_id);
    if (filters.maintenance_terminal_id) filtered = filtered.filter(c => c.maintenance_terminal_id === filters.maintenance_terminal_id);

    const totalCount = filtered.length;
    const activeCount = filtered.filter(c => c.status === true).length;
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return { data: paginatedData, totalCount, activeCount, inactiveCount: totalCount - activeCount };
  }, [allCables, searchQuery, filters, currentPage, pageLimit]);

  return { ...processedData, isLoading, isFetching, error, refetch };
};

const OfcPage = () => {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const { isSuperAdmin } = useUser();

  const {
    data: ofcData, totalCount, activeCount, inactiveCount, isLoading, isMutating, isFetching, error, refetch,
    pagination, search, filters, editModal, bulkActions, deleteModal, actions: crudActions,
  } = useCrudManager<'ofc_cables', V_ofc_cables_completeRowSchema>({
    tableName: 'ofc_cables', dataQueryHook: useOfcData, displayNameField: 'route_name',
  });

  const isInitialLoad = isLoading && ofcData.length === 0;

  const { data: ofcTypesData } = useOfflineQuery<Lookup_typesRowSchema[]>(['ofc-types-for-filter'],
    async () => (await createClient().from('lookup_types').select('*').eq('category', 'OFC_TYPES')).data ?? [],
    async () => await localDb.lookup_types.where({ category: 'OFC_TYPES' }).toArray()
  );
  const { data: maintenanceAreasData } = useOfflineQuery<Maintenance_areasRowSchema[]>(['maintenance-areas-for-filter'],
    async () => (await createClient().from('maintenance_areas').select('*').eq('status', true)).data ?? [],
    async () => await localDb.maintenance_areas.where({ status: true }).toArray()
  );
  const { data: ofcOwnersData } = useOfflineQuery<Lookup_typesRowSchema[]>(['ofc-owners-for-filter'],
    async () => (await createClient().from('lookup_types').select('*').eq('category', 'OFC_OWNER')).data ?? [],
    async () => await localDb.lookup_types.where({ category: 'OFC_OWNER' }).toArray()
  );

  const ofcTypes = useMemo(() => ofcTypesData || [], [ofcTypesData]);
  const maintenanceAreas = useMemo(() => maintenanceAreasData || [], [maintenanceAreasData]);
  const ofcOwners = useMemo(() => ofcOwnersData || [], [ofcOwnersData]);

  const columns = OfcTableColumns(ofcData);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_ofc_cables_complete]);
  const tableActions = useMemo(() => createStandardActions<V_ofc_cables_completeRowSchema>({ onEdit: editModal.openEdit, onView: (record) => router.push(`/dashboard/ofc/${record.id}`), onDelete: crudActions.handleDelete, onToggleStatus: crudActions.handleToggleStatus, canDelete: () => isSuperAdmin === true }), [editModal.openEdit, router, crudActions, isSuperAdmin]);
  const headerActions = useStandardHeaderActions({ data: ofcData as Ofc_cablesRowSchema[], onRefresh: async () => { await refetch(); toast.success('Refreshed successfully!'); }, onAddNew: editModal.openAdd, isLoading: isLoading, exportConfig: { tableName: 'ofc_cables' } });
  const headerStats = [
    { value: totalCount, label: 'Total OFC Cables' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  if (error) return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;

  return (
    <div className="mx-auto space-y-6 p-4 md:p-6">
      <PageHeader title="OFC Cable Management" description="Manage OFC cables and their related information." icon={<AiFillMerge />} stats={headerStats} actions={headerActions} isLoading={isInitialLoad} isFetching={isFetching} />
      <BulkActions selectedCount={bulkActions.selectedCount} isOperationLoading={isMutating} onBulkDelete={bulkActions.handleBulkDelete} onBulkUpdateStatus={bulkActions.handleBulkUpdateStatus} onClearSelection={bulkActions.handleClearSelection} entityName="ofc cable" showStatusUpdate={true} canDelete={() => isSuperAdmin === true} />
      <DataTable
        tableName="v_ofc_cables_complete"
        data={ofcData}
        columns={orderedColumns}
        loading={isLoading}
        isFetching={isFetching || isMutating}
        actions={tableActions}
        selectable
        onRowSelect={(selectedRows) => { const validRows = selectedRows.filter((row): row is V_ofc_cables_completeRowSchema & { id: string } => row.id != null); bulkActions.handleRowSelect(validRows); }}
        pagination={{
          current: pagination.currentPage, pageSize: pagination.pageLimit, total: totalCount, showSizeChanger: true,
          onChange: (page, limit) => { pagination.setCurrentPage(page); pagination.setPageLimit(limit); },
        }}
        customToolbar={
          <SearchAndFilters
            searchTerm={search.searchQuery} onSearchChange={search.setSearchQuery} showFilters={showFilters}
            onToggleFilters={() => setShowFilters(p => !p)} onClearFilters={() => { search.setSearchQuery(''); filters.setFilters({}); }}
            hasActiveFilters={Object.values(filters.filters).some(Boolean) || !!search.searchQuery} activeFilterCount={Object.values(filters.filters).filter(Boolean).length}
            searchPlaceholder="Search by Asset No, Route Name, or Transnet ID..."
          >
            <SelectFilter label="OFC Type" filterKey="ofc_type_id" filters={filters.filters} setFilters={filters.setFilters} options={ofcTypes.map((t) => ({ value: t.id, label: t.name }))} />
            <SelectFilter label="Status" filterKey="status" filters={filters.filters} setFilters={filters.setFilters} options={[{ value: 'true', label: 'Active' }, { value: 'false', label: 'Inactive' }]} />
            <SelectFilter label="OFC Owner" filterKey="ofc_owner_id" filters={filters.filters} setFilters={filters.setFilters} options={ofcOwners.map((o) => ({ value: o.id, label: o.name }))} />
            <SelectFilter label="Maintenance Terminal" filterKey="maintenance_terminal_id" filters={filters.filters} setFilters={filters.setFilters} options={maintenanceAreas.map((m) => ({ value: m.id, label: m.name }))} />
          </SearchAndFilters>
        }
      />
      <OfcForm isOpen={editModal.isOpen} onClose={editModal.close} ofcCable={editModal.record as Ofc_cablesRowSchema} onSubmit={crudActions.handleSave} pageLoading={isMutating} />
      <ConfirmModal isOpen={deleteModal.isOpen} onConfirm={deleteModal.onConfirm} onCancel={deleteModal.onCancel} title="Confirm Deletion" message={deleteModal.message} type="danger" loading={deleteModal.loading} />
    </div>
  );
};

export default OfcPage;