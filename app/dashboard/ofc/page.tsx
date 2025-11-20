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
import {
  Ofc_cablesRowSchema,
  V_ofc_cables_completeRowSchema,
  Lookup_typesRowSchema,
  Maintenance_areasRowSchema,
} from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import OfcForm from '@/components/ofc/OfcForm/OfcForm';
import { SelectFilter } from '@/components/common/filters/FilterInputs';
import { SearchAndFilters } from '@/components/common/filters/SearchAndFilters';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { useUser } from '@/providers/UserProvider';
import { AiFillMerge } from 'react-icons/ai';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/hooks/data/localDb';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useOfcData } from '@/hooks/data/useOfcData';
import { TableAction } from '@/components/table';

const OfcPage = () => {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const { isSuperAdmin } = useUser();

  const {
    data: ofcData,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isMutating,
    isFetching,
    error,
    refetch,
    pagination,
    search,
    filters,
    editModal,
    bulkActions,
    deleteModal,
    actions: crudActions,
  } = useCrudManager<'ofc_cables', V_ofc_cables_completeRowSchema>({
    tableName: 'ofc_cables',
    dataQueryHook: useOfcData,
    displayNameField: 'route_name',
  });

  const isInitialLoad = isLoading && ofcData.length === 0;

  const { data: ofcTypesData } = useOfflineQuery<Lookup_typesRowSchema[]>(
    ['ofc-types-for-filter'],
    // Online
    async () => {
      const { data } = await createClient()
        .from('lookup_types')
        .select('*')
        .eq('category', 'OFC_TYPES');

      return (data ?? []).filter((item) => item.name?.trim().toUpperCase() !== 'DEFAULT');
    },
    // Offline
    async () =>
      await localDb.lookup_types
        .where('category') // Use the specific index
        .equals('OFC_TYPES')
        .filter((type) => type.name?.trim().toUpperCase() !== 'DEFAULT')
        .toArray()
  );
  const { data: maintenanceAreasData } = useOfflineQuery<Maintenance_areasRowSchema[]>(
    ['maintenance-areas-for-filter'],
    async () =>
      (await createClient().from('maintenance_areas').select('*').eq('status', true)).data ?? [],
    async () => await localDb.maintenance_areas.where({ status: true }).toArray()
  );
  const { data: ofcOwnersData } = useOfflineQuery<Lookup_typesRowSchema[]>(
    ['ofc-owners-for-filter'],
    // Online: Fetch all, then filter in JS to be case-insensitive/safe
    async () => {
      const { data } = await createClient()
        .from('lookup_types')
        .select('*')
        .eq('category', 'OFC_OWNER');

      return (data ?? []).filter((item) => item.name?.trim().toUpperCase() !== 'DEFAULT');
    },
    // Offline: Fetch by category index, then filter
    async () =>
      await localDb.lookup_types
        .where('category') // Use the specific index
        .equals('OFC_OWNER')
        .filter((owner) => owner.name?.trim().toUpperCase() !== 'DEFAULT')
        .toArray()
  );

  const ofcTypes = useMemo(() => ofcTypesData || [], [ofcTypesData]);
  const maintenanceAreas = useMemo(() => maintenanceAreasData || [], [maintenanceAreasData]);
  const ofcOwners = useMemo(() => ofcOwnersData || [], [ofcOwnersData]);

  const OFC_OWNERS_BSNL = useMemo(() => {
    const bsnlOwner = ofcOwners.find(
      (owner) =>
        owner.name?.toLowerCase().includes('bsnl') ||
        owner.name?.toLowerCase().includes('bharat sanchar')
    );
    return bsnlOwner ? { ofc_owner_id: bsnlOwner.id } : undefined;
  }, [ofcOwners]);

  const OFC_OWNERS_BBNL = useMemo(() => {
    const bbnlOwner = ofcOwners.find(
      (owner) =>
        owner.name?.toLowerCase().includes('bbnl') ||
        owner.name?.toLowerCase().includes('bharat broadband')
    );
    return bbnlOwner ? { ofc_owner_id: bbnlOwner.id } : undefined;
  }, [ofcOwners]);

  const columns = OfcTableColumns(ofcData);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_ofc_cables_complete]);
  const tableActions = useMemo(
    () =>
      createStandardActions<V_ofc_cables_completeRowSchema>({
        onEdit: editModal.openEdit,
        onView: (record) => router.push(`/dashboard/ofc/${record.id}`),
        onDelete: crudActions.handleDelete,
        onToggleStatus: crudActions.handleToggleStatus,
        canDelete: () => isSuperAdmin === true,
      }) as TableAction<'v_ofc_cables_complete'>[],
    [editModal.openEdit, router, crudActions, isSuperAdmin]
  );
  const headerActions = useStandardHeaderActions({
    data: ofcData as Ofc_cablesRowSchema[],
    onRefresh: async () => {
      await refetch();
      toast.success('Refreshed successfully!');
    },
    onAddNew: editModal.openAdd,
    isLoading: isLoading,
    exportConfig: {
      tableName: 'ofc_cables',
      filterOptions: [
        {
          label: 'bsnl',
          filters: OFC_OWNERS_BSNL,
          fileName: `bsnl_ofc_cables.xlsx`,
        },
        {
          label: 'bbnl',
          filters: OFC_OWNERS_BBNL,
          fileName: `bbnl_ofc_cables.xlsx`,
        },
      ],
    },
  });
  const headerStats = [
    { value: totalCount, label: 'Total OFC Cables' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  if (error)
    return (
      <ErrorDisplay
        error={error.message}
        actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]}
      />
    );

  return (
    <div className="mx-auto space-y-6 p-4 md:p-6">
      <PageHeader
        title="OFC Cable Management"
        description="Manage OFC cables and their related information."
        icon={<AiFillMerge />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isInitialLoad}
        isFetching={isFetching}
      />
      <BulkActions
        selectedCount={bulkActions.selectedCount}
        isOperationLoading={isMutating}
        onBulkDelete={bulkActions.handleBulkDelete}
        onBulkUpdateStatus={bulkActions.handleBulkUpdateStatus}
        onClearSelection={bulkActions.handleClearSelection}
        entityName="ofc cable"
        showStatusUpdate={true}
        canDelete={() => isSuperAdmin === true}
      />
      <DataTable
        tableName="v_ofc_cables_complete"
        data={ofcData}
        columns={orderedColumns}
        loading={isLoading}
        isFetching={isFetching || isMutating}
        actions={tableActions}
        selectable
        onRowSelect={(selectedRows) => {
          const validRows = selectedRows.filter(
            (row): row is V_ofc_cables_completeRowSchema & { id: string } => row.id != null
          );
          bulkActions.handleRowSelect(validRows);
        }}
        pagination={{
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, limit) => {
            pagination.setCurrentPage(page);
            pagination.setPageLimit(limit);
          },
        }}
        customToolbar={
          <SearchAndFilters
            searchTerm={search.searchQuery}
            onSearchChange={search.setSearchQuery}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters((p) => !p)}
            onClearFilters={() => {
              search.setSearchQuery('');
              filters.setFilters({});
            }}
            hasActiveFilters={Object.values(filters.filters).some(Boolean) || !!search.searchQuery}
            activeFilterCount={Object.values(filters.filters).filter(Boolean).length}
            searchPlaceholder="Search by Asset No, Route Name, or Transnet ID..."
          >
            <SelectFilter
              label="OFC Type"
              filterKey="ofc_type_id"
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={ofcTypes.map((t) => ({ value: t.id, label: t.name }))}
            />
            <SelectFilter
              label="Status"
              filterKey="status"
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={[
                { value: 'true', label: 'Active' },
                { value: 'false', label: 'Inactive' },
              ]}
            />
            <SelectFilter
              label="OFC Owner"
              filterKey="ofc_owner_id"
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={ofcOwners.map((o) => ({ value: o.id, label: o.name }))}
            />
            <SelectFilter
              label="Maintenance Terminal"
              filterKey="maintenance_terminal_id"
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={maintenanceAreas.map((m) => ({ value: m.id, label: m.name }))}
            />
          </SearchAndFilters>
        }
      />
      <OfcForm
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        ofcCable={editModal.record as Ofc_cablesRowSchema}
        onSubmit={crudActions.handleSave}
        pageLoading={isMutating}
      />
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        type="danger"
        loading={deleteModal.loading}
      />
    </div>
  );
};

export default OfcPage;
