// path: app/dashboard/rings/page.tsx
'use client';

import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal } from '@/components/common/ui';
import { RingModal } from '@/components/rings/RingModal';
import { RingSystemsModal } from '@/components/rings/RingSystemsModal'; // <-- Import the new modal
import { RingsFilters } from '@/components/rings/RingsFilters';
import { createStandardActions } from '@/components/table/action-helpers';
import { DataTable } from '@/components/table/DataTable';
import { desiredRingColumnOrder } from '@/config/column-orders';
import { RingsColumns } from '@/config/table-columns/RingsTableColumns';
import { usePagedData, useTableQuery } from '@/hooks/database';
import { DataQueryHookParams, DataQueryHookReturn, useCrudManager } from '@/hooks/useCrudManager';
import { V_rings_with_countRowSchema, RingsRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useMemo, useCallback, useState } from 'react'; // <-- Import useState
import { GiLinkedRings } from 'react-icons/gi';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FaNetworkWired } from 'react-icons/fa'; // <-- A suitable icon

const useRingsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_rings_with_countRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();
  const { data, isLoading, error, refetch } = usePagedData<V_rings_with_countRowSchema>(
    supabase, 'v_rings_with_count', {
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
  
  // ADDED: State to manage the new RingSystemsModal
  const [isSystemsModalOpen, setIsSystemsModalOpen] = useState(false);
  const [selectedRingForSystems, setSelectedRingForSystems] = useState<V_rings_with_countRowSchema | null>(null);

  const {
    data: rings, totalCount, activeCount, inactiveCount, isLoading, refetch,
    pagination, search, editModal, deleteModal, actions: crudActions,
  } = useCrudManager<'rings', V_rings_with_countRowSchema>({
    tableName: 'rings', dataQueryHook: useRingsData,
  });

  const { data: ringTypes = [] } = useTableQuery(supabase, 'lookup_types', {
    filters: { category: 'RING_TYPES', name: { operator: 'neq', value: 'DEFAULT' } },
    orderBy: [{ column: 'name' }]
  });
  const { data: maintenanceAreas = [] } = useTableQuery(supabase, 'maintenance_areas', {
    filters: { status: true }, orderBy: [{ column: 'name' }]
  });

  const columns = RingsColumns(rings);
  const notUndefined = <T,>(x: T | undefined): x is T => x !== undefined;
  const orderedColumns = [
    ...desiredRingColumnOrder.map((k) => columns.find((c) => c.key === k)).filter(notUndefined),
    ...columns.filter((c) => !desiredRingColumnOrder.includes(c.key)),
  ];

  const handleView = useCallback((record: V_rings_with_countRowSchema) => {
    if (record.id) {
      router.push(`/dashboard/rings/${record.id}`);
    } else {
      toast.error("Cannot view ring: Missing ID.");
    }
  }, [router]);

  // ADDED: Handler to open the new modal
  const handleManageSystems = useCallback((record: V_rings_with_countRowSchema) => {
    setSelectedRingForSystems(record);
    setIsSystemsModalOpen(true);
  }, []);

  const tableActions = useMemo(() => {
    const standardActions = createStandardActions<V_rings_with_countRowSchema>({
      onEdit: editModal.openEdit,
      onView: handleView,
      onDelete: crudActions.handleDelete,
    });
    // Add our new custom action
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
        tableName="v_rings_with_count"
        data={rings} columns={orderedColumns} loading={isLoading} actions={tableActions}
        pagination={{
          current: pagination.currentPage, pageSize: pagination.pageLimit, total: totalCount, showSizeChanger: true,
          onChange: (page, pageSize) => { pagination.setCurrentPage(page); pagination.setPageLimit(pageSize); },
        }}
        customToolbar={<RingsFilters searchQuery={search.searchQuery} onSearchChange={search.setSearchQuery} />}
      />
      
      {/* Modals */}
      
      <RingModal
        isOpen={editModal.isOpen} onClose={editModal.close} editingRing={editModal.record as RingsRowSchema | null}
        onCreated={crudActions.handleSave as (ring: RingsRowSchema) => void}
        onUpdated={crudActions.handleSave as (ring: RingsRowSchema) => void}
        ringTypes={ringTypes.map(rt => ({ id: rt.id, name: rt.name, code: rt.code }))}
        maintenanceAreas={maintenanceAreas.map(ma => ({ id: ma.id, name: ma.name, code: ma.code }))}
      />

      {/* ADDED: The new modal instance */}
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
