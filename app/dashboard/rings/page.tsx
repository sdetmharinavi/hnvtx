// path: app/dashboard/rings/page.tsx
'use client';

import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal } from '@/components/common/ui';
import { RingModal } from '@/components/rings/RingModal';
import { RingSystemsModal } from '@/components/rings/RingSystemsModal';
import { RingsFilters } from '@/components/rings/RingsFilters';
import { createStandardActions } from '@/components/table/action-helpers';
import { DataTable } from '@/components/table/DataTable';
import { desiredRingColumnOrder } from '@/config/column-orders';
import { RingsColumns } from '@/config/table-columns/RingsTableColumns';
import { usePagedData, useTableQuery } from '@/hooks/database';
import { DataQueryHookParams, DataQueryHookReturn, useCrudManager } from '@/hooks/useCrudManager';
import { V_ringsRowSchema, RingsRowSchema, RingsInsertSchema } from '@/schemas/zod-schemas'; // Import InsertSchema
import { createClient } from '@/utils/supabase/client';
import { useMemo, useCallback, useState } from 'react';
import { GiLinkedRings } from 'react-icons/gi';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FaNetworkWired } from 'react-icons/fa';

const useRingsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_ringsRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();
  const { data, isLoading, error, refetch } = usePagedData<V_ringsRowSchema>(
    supabase, 'v_rings', {
      filters: { ...filters, ...(searchQuery ? { name: searchQuery } : {}) },
      limit: pageLimit, offset: (currentPage - 1) * pageLimit,
    }
  );
  return {
    data: data?.data || [], totalCount: data?.total_count || 0,
    activeCount: data?.active_count || 0, inactiveCount: data?.inactive_count || 0,
    isLoading, error, refetch,
  };
};

const RingsPage = () => {
  const router = useRouter();
  const supabase = createClient();
  
  const [isSystemsModalOpen, setIsSystemsModalOpen] = useState(false);
  const [selectedRingForSystems, setSelectedRingForSystems] = useState<V_ringsRowSchema | null>(null);

  const {
    data: rings, totalCount, activeCount, inactiveCount, isLoading, isMutating, refetch,
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
  const notUndefined = <T,>(x: T | undefined): x is T => x !== undefined;
  const orderedColumns = [
    ...desiredRingColumnOrder.map((k) => columns.find((c) => c.key === k)).filter(notUndefined),
    ...columns.filter((c) => !desiredRingColumnOrder.includes(c.key)),
  ];

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
        isLoading={isLoading}
      />
      <DataTable
        tableName="v_rings"
        data={rings} columns={orderedColumns} loading={isLoading} actions={tableActions}
        pagination={{
          current: pagination.currentPage, pageSize: pagination.pageLimit, total: totalCount, showSizeChanger: true,
          onChange: (page, pageSize) => { pagination.setCurrentPage(page); pagination.setPageLimit(pageSize); },
        }}
        customToolbar={<RingsFilters searchQuery={search.searchQuery} onSearchChange={search.setSearchQuery} />}
      />
      
      {/* ** Pass the correct props to the now "dumb" component.** */}
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
