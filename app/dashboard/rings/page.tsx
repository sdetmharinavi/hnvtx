'use client';

import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal } from '@/components/common/ui';
import { RingModal } from '@/components/rings/RingModal';
import { RingSystemsModal } from '@/components/rings/RingSystemsModal';
import { RingsFilters } from '@/components/rings/RingsFilters';
import { createStandardActions } from '@/components/table/action-helpers';
import { DataTable } from '@/components/table/DataTable';
import { RingsColumns } from '@/config/table-columns/RingsTableColumns';
import { usePagedData, useTableQuery } from '@/hooks/database';
import { DataQueryHookParams, DataQueryHookReturn, useCrudManager } from '@/hooks/useCrudManager';
import { V_ringsRowSchema, RingsRowSchema, RingsInsertSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useMemo, useCallback, useState } from 'react';
import { GiLinkedRings } from 'react-icons/gi';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FaNetworkWired } from 'react-icons/fa';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';

const useRingsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_ringsRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();
  
  // THE FIX: Correctly construct the search filter string for the 'or' clause
  const searchFilters = useMemo(() => {
    const newFilters = { ...filters };
    if (searchQuery) {
      newFilters.or = `(name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,ring_type_name.ilike.%${searchQuery}%,maintenance_area_name.ilike.%${searchQuery}%)`;
    }
    return newFilters;
  }, [filters, searchQuery]);

  const { data, isLoading, isFetching, error, refetch } = usePagedData<V_ringsRowSchema>(
    supabase, 'v_rings', {
      filters: searchFilters, // Use the corrected filters
      limit: pageLimit, 
      offset: (currentPage - 1) * pageLimit,
    }
  );

  return {
    data: data?.data || [], totalCount: data?.total_count || 0,
    activeCount: data?.active_count || 0, inactiveCount: data?.inactive_count || 0,
    isLoading, isFetching, error, refetch,
  };
};

const RingsPage = () => {
  const router = useRouter();
  const supabase = createClient();

  const [isSystemsModalOpen, setIsSystemsModalOpen] = useState(false);
  const [selectedRingForSystems, setSelectedRingForSystems] = useState<V_ringsRowSchema | null>(null);

  const {
    data: rings, totalCount, activeCount, inactiveCount, isLoading, isMutating, isFetching, refetch,
    pagination, search, editModal, deleteModal, actions: crudActions,
  } = useCrudManager<'rings', V_ringsRowSchema>({
    tableName: 'rings', dataQueryHook: useRingsData,
  });

  const { data: ringTypesData } = useTableQuery(supabase, 'lookup_types', {
    filters: { category: 'RING_TYPES', name: { operator: 'neq', value: 'DEFAULT' } },
    orderBy: [{ column: 'name' }]
  });
  const ringTypes = ringTypesData?.data || [];
  const { data: maintenanceAreasData } = useTableQuery(supabase, 'maintenance_areas', {
    filters: { status: true }, orderBy: [{ column: 'name' }]
  });
  const maintenanceAreas = maintenanceAreasData?.data || [];

  const columns = RingsColumns(rings);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_rings])
  const handleView = useCallback((record: V_ringsRowSchema) => {
    if (record.id) {
      router.push(`/dashboard/rings/${record.id}`);
    } else {
      toast.error("Cannot view ring: Missing ID.");
    }
  }, [router]);

  const handleManageSystems = useCallback((record: V_ringsRowSchema) => {
    setSelectedRingForSystems(record);
    setIsSystemsModalOpen(true);
  }, []);

  const tableActions = useMemo(() => {
    const standardActions = createStandardActions<V_ringsRowSchema>({
      onEdit: editModal.openEdit,
      onView: handleView,
      onDelete: crudActions.handleDelete,
    });
    standardActions.unshift({
      key: 'manage-systems',
      label: 'Manage Systems',
      icon: <FaNetworkWired className="w-4 h-4" />,
      onClick: handleManageSystems,
      variant: 'secondary',
    });
    return standardActions;
  }, [editModal.openEdit, handleView, crudActions.handleDelete, handleManageSystems]);

  const isInitialLoad = isLoading && !isFetching;

  const headerActions = useStandardHeaderActions({
    data: rings as RingsRowSchema[],
    onRefresh: async () => { await refetch(); toast.success('Refreshed successfully!'); },
    onAddNew: editModal.openAdd, isLoading: isLoading, exportConfig: { tableName: 'rings' },
  });

  const headerStats = [
    { value: totalCount, label: 'Total Rings' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  return (
    <div className="mx-auto space-y-4 p-6">
      <PageHeader
        title="Ring Management"
        description="Manage network rings and their related information."
        icon={<GiLinkedRings />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isInitialLoad}
        isFetching={isFetching}
      />
      <DataTable
        tableName="v_rings"
        data={rings} columns={orderedColumns} loading={isLoading} actions={tableActions}
        isFetching={isFetching}
        pagination={{
          current: pagination.currentPage, pageSize: pagination.pageLimit, total: totalCount, showSizeChanger: true,
          onChange: (page, pageSize) => { pagination.setCurrentPage(page); pagination.setPageLimit(pageSize); },
        }}
        customToolbar={<RingsFilters searchQuery={search.searchQuery} onSearchChange={search.setSearchQuery} />}
      />

      <RingModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        editingRing={editModal.record as RingsRowSchema | null}
        onSubmit={crudActions.handleSave as (data: RingsInsertSchema) => void}
        isLoading={isMutating}
        ringTypes={ringTypes.map(rt => ({ id: rt.id, name: rt.name, code: rt.code }))}
        maintenanceAreas={maintenanceAreas.map(ma => ({ id: ma.id, name: ma.name, code: ma.code }))}
      />

      <RingSystemsModal
        isOpen={isSystemsModalOpen}
        onClose={() => setIsSystemsModalOpen(false)}
        ring={selectedRingForSystems}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen} onConfirm={deleteModal.onConfirm} onCancel={deleteModal.onCancel}
        title="Confirm Deletion" message={deleteModal.message} confirmText="Delete"
        cancelText="Cancel" type="danger" showIcon loading={deleteModal.loading}
      />
    </div>
  );
};

export default RingsPage;