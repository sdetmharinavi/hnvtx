// app/dashboard/rings/page.tsx
"use client";

import { useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { GiLinkedRings } from 'react-icons/gi';
import { FaNetworkWired } from 'react-icons/fa';

import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal } from '@/components/common/ui';
import { RingModal } from '@/components/rings/RingModal';
import { RingSystemsModal } from '@/components/rings/RingSystemsModal';
import { DataTable, TableAction } from '@/components/table';
import { SearchAndFilters } from '@/components/common/filters/SearchAndFilters';
import { SelectFilter } from '@/components/common/filters/FilterInputs';
import { createStandardActions } from '@/components/table/action-helpers';

import { useCrudManager } from '@/hooks/useCrudManager';
import { useRingsData } from '@/hooks/data/useRingsData';
import { V_ringsRowSchema, RingsRowSchema, RingsInsertSchema } from '@/schemas/zod-schemas';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { RingsColumns } from '@/config/table-columns/RingsTableColumns';

export default function RingsPage() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [isSystemsModalOpen, setIsSystemsModalOpen] = useState(false);
  const [selectedRingForSystems, setSelectedRingForSystems] = useState<V_ringsRowSchema | null>(null);

  const {
    data: rings,
    totalCount, activeCount, inactiveCount,
    isLoading, isMutating, isFetching, error, refetch,
    pagination, search, filters,
    editModal, deleteModal, actions: crudActions
  } = useCrudManager<'rings', V_ringsRowSchema>({
    tableName: 'rings',
    dataQueryHook: useRingsData,
    displayNameField: 'name',
    searchColumn: ['name', 'description', 'ring_type_name', 'maintenance_area_name'],
  });
  
  const { ringTypeOptions, maintenanceAreaOptions } = useMemo(() => {
    const uniqueRingTypes = new Map<string, { id: string; name: string }>();
    const uniqueMaintenanceAreas = new Map<string, { id: string; name: string }>();

    (rings || []).forEach(ring => {
      if (ring.ring_type_id && ring.ring_type_name && !uniqueRingTypes.has(ring.ring_type_id)) {
        uniqueRingTypes.set(ring.ring_type_id, { id: ring.ring_type_id, name: ring.ring_type_name });
      }
      if (ring.maintenance_terminal_id && ring.maintenance_area_name && !uniqueMaintenanceAreas.has(ring.maintenance_terminal_id)) {
        uniqueMaintenanceAreas.set(ring.maintenance_terminal_id, { id: ring.maintenance_terminal_id, name: ring.maintenance_area_name });
      }
    });

    return {
      ringTypeOptions: Array.from(uniqueRingTypes.values()).map(rt => ({ value: rt.id, label: rt.name })),
      maintenanceAreaOptions: Array.from(uniqueMaintenanceAreas.values()).map(ma => ({ value: ma.id, label: ma.name })),
    };
  }, [rings]);

  // THE FIX: Call the hooks at the top level of the component.
  const columns = RingsColumns(rings);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_rings]);

  const handleView = useCallback((record: V_ringsRowSchema) => {
    if (record.id) router.push(`/dashboard/rings/${record.id}`);
  }, [router]);

  const handleManageSystems = useCallback((record: V_ringsRowSchema) => {
    setSelectedRingForSystems(record);
    setIsSystemsModalOpen(true);
  }, []);

  const tableActions = useMemo((): TableAction<'v_rings'>[] => {
    const standardActions = createStandardActions<V_ringsRowSchema>({
      onEdit: editModal.openEdit,
      onView: handleView,
      onDelete: crudActions.handleDelete,
    });
    standardActions.unshift({
      key: 'manage-systems', label: 'Manage Systems',
      icon: <FaNetworkWired className='w-4 h-4' />,
      onClick: handleManageSystems, variant: 'secondary'
    });
    return standardActions;
  }, [editModal.openEdit, handleView, crudActions.handleDelete, handleManageSystems]);

  const isInitialLoad = isLoading && rings.length === 0;

  const headerActions = useStandardHeaderActions({
    data: rings as RingsRowSchema[],
    onRefresh: async () => { await refetch(); toast.success('Refreshed successfully!'); },
    onAddNew: editModal.openAdd,
    isLoading: isLoading,
    exportConfig: { tableName: 'rings' },
  });

  const headerStats = [
    { value: totalCount, label: 'Total Rings' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  if (error) {
    // You should handle the error state here, e.g., show an error message
  }

  return (
    <div className='mx-auto space-y-4 p-6'>
      <PageHeader
        title='Ring Management'
        description='Manage network rings and their related information.'
        icon={<GiLinkedRings />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isInitialLoad}
        isFetching={isFetching}
      />
      <DataTable
        tableName='v_rings'
        data={rings}
        columns={orderedColumns}
        loading={isLoading}
        actions={tableActions}
        isFetching={isFetching || isMutating}
        pagination={{
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            pagination.setCurrentPage(page);
            pagination.setPageLimit(pageSize);
          },
        }}
        customToolbar={
          <SearchAndFilters
            searchTerm={search.searchQuery}
            onSearchChange={search.setSearchQuery}
            showFilters={showFilters}
            onToggleFilters={() => setShowFilters(p => !p)}
            onClearFilters={() => filters.setFilters({})}
            hasActiveFilters={Object.values(filters.filters).some(Boolean)}
            activeFilterCount={Object.values(filters.filters).filter(Boolean).length}
          >
            <SelectFilter
              label="Ring Type"
              filterKey="ring_type_id"
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={ringTypeOptions}
            />
            <SelectFilter
              label="Maintenance Area"
              filterKey="maintenance_terminal_id"
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={maintenanceAreaOptions}
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

      <RingModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        onSubmit={crudActions.handleSave as (data: RingsInsertSchema) => void}
        editingRing={editModal.record as RingsRowSchema | null}
        ringTypes={ringTypeOptions.map(opt => ({ id: opt.value, name: opt.label, code: null }))}
        maintenanceAreas={maintenanceAreaOptions.map(opt => ({ id: opt.value, name: opt.label, code: null }))}
        isLoading={isMutating}
      />

      <RingSystemsModal
        isOpen={isSystemsModalOpen}
        onClose={() => setIsSystemsModalOpen(false)}
        ring={selectedRingForSystems}
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
        loading={deleteModal.loading}
      />
    </div>
  );
};