// app/dashboard/rings/page.tsx
'use client';

import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal } from '@/components/common/ui';
import { RingModal } from '@/components/rings/RingModal';
import { RingSystemsModal } from '@/components/rings/RingSystemsModal';
import { RingsFilters } from '@/components/rings/RingsFilters';
import { createStandardActions } from '@/components/table/action-helpers';
import { DataTable } from '@/components/table/DataTable';
import { RingsColumns } from '@/config/table-columns/RingsTableColumns';
import { DataQueryHookParams, DataQueryHookReturn, useCrudManager } from '@/hooks/useCrudManager';
import { V_ringsRowSchema, RingsRowSchema, RingsInsertSchema, Lookup_typesRowSchema, Maintenance_areasRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useMemo, useCallback, useState } from 'react';
import { GiLinkedRings } from 'react-icons/gi';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { FaNetworkWired } from 'react-icons/fa';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/data/localDb';

// OFFLINE-FIRST REFACTOR: This data hook is refactored to use useOfflineQuery
const useRingsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_ringsRowSchema> => {
  const { currentPage, pageLimit, searchQuery } = params;

  // 1. Online Fetcher: Fetches all data from the Supabase view.
  const onlineQueryFn = async (): Promise<V_ringsRowSchema[]> => {
    const { data, error } = await createClient().from('v_rings').select('*');
    if (error) throw error;
    return data || [];
  };

  // 2. Offline Fetcher: Fetches all data from the local Dexie table.
  const offlineQueryFn = async (): Promise<V_ringsRowSchema[]> => {
    return await localDb.v_rings.toArray();
  };

  const { data: allRings = [], isLoading, isFetching, error, refetch } = useOfflineQuery(
    ['rings-data', 'all'],
    onlineQueryFn,
    offlineQueryFn,
    { staleTime: 5 * 60 * 1000 }
  );
  
  // 3. Client-side filtering and pagination
  const processedData = useMemo(() => {
    let filtered = allRings;
    
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      filtered = filtered.filter((ring: V_ringsRowSchema) =>
        ring.name?.toLowerCase().includes(lowerQuery) ||
        ring.description?.toLowerCase().includes(lowerQuery) ||
        ring.ring_type_name?.toLowerCase().includes(lowerQuery) ||
        ring.maintenance_area_name?.toLowerCase().includes(lowerQuery)
      );
    }
    
    const totalCount = filtered.length;
    const activeCount = filtered.filter((r: V_ringsRowSchema) => r.status === true).length;

    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
    };
  }, [allRings, searchQuery, currentPage, pageLimit]);

  return {
    ...processedData,
    isLoading,
    isFetching,
    error,
    refetch,
  };
};

const RingsPage = () => {
  const router = useRouter();
  const [isSystemsModalOpen, setIsSystemsModalOpen] = useState(false);
  const [selectedRingForSystems, setSelectedRingForSystems] = useState<V_ringsRowSchema | null>(null);

  const {
    data: rings, totalCount, activeCount, inactiveCount, isLoading, isMutating, isFetching, refetch,
    pagination, search, editModal, deleteModal, actions: crudActions,
  } = useCrudManager<'rings', V_ringsRowSchema>({
    tableName: 'rings', dataQueryHook: useRingsData,
  });
  
  // Offline-first queries for filter dropdowns
  const { data: ringTypesData } = useOfflineQuery<Lookup_typesRowSchema[]>(
    ['ring-types-for-filter'],
    async () => (await createClient().from('lookup_types').select('*').eq('category', 'RING_TYPES').neq('name', 'DEFAULT')).data ?? [],
    async () => await localDb.lookup_types.where({ category: 'RING_TYPES' }).filter(rt => rt.name !== 'DEFAULT').toArray()
  );
  const ringTypes = useMemo(() => ringTypesData || [], [ringTypesData]);

  const { data: maintenanceAreasData } = useOfflineQuery<Maintenance_areasRowSchema[]>(
    ['maintenance-areas-for-filter'],
    async () => (await createClient().from('maintenance_areas').select('*').eq('status', true)).data ?? [],
    async () => await localDb.maintenance_areas.where({ status: true }).toArray()
  );
  const maintenanceAreas = useMemo(() => maintenanceAreasData || [], [maintenanceAreasData]);

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