// app/dashboard/rings/page.tsx
"use client";

import { useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { GiLinkedRings } from 'react-icons/gi';
import { FaNetworkWired } from 'react-icons/fa';

import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal, StatusBadge, ErrorDisplay } from '@/components/common/ui'; // Added ErrorDisplay import
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
import { Row } from '@/hooks/database';
import { FiMapPin } from 'react-icons/fi';
import { useUser } from '@/providers/UserProvider';
import { UserRole } from '@/types/user-roles';

const STATUS_OPTIONS = {
    OFC: [
        { value: 'Pending', label: 'Pending' },
        { value: 'Partial Ready', label: 'Partial Ready' },
        { value: 'Ready', label: 'Ready' }
    ],
    SPEC: [
        { value: 'Pending', label: 'Pending' },
        { value: 'Survey', label: 'Survey' },
        { value: 'Issued', label: 'Issued' }
    ],
    BTS: [
        { value: 'Pending', label: 'Pending' },
        { value: 'Configured', label: 'Configured' },
        { value: 'On-Air', label: 'On-Air' }
    ]
};

export default function RingsPage() {
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const [isSystemsModalOpen, setIsSystemsModalOpen] = useState(false);
  const [selectedRingForSystems, setSelectedRingForSystems] = useState<V_ringsRowSchema | null>(null);

  const { isSuperAdmin, role } = useUser();

  const {
    data: rings,
    totalCount,
    // activeCount,
    // inactiveCount,
    isLoading, isMutating, isFetching, error, refetch,
    pagination, search, filters,
    editModal, deleteModal, actions: crudActions
  } = useCrudManager<'rings', V_ringsRowSchema>({
    tableName: 'rings',
    dataQueryHook: useRingsData,
    displayNameField: 'name',
    searchColumn: ['name', 'description', 'ring_type_name', 'maintenance_area_name'],
  });

  // --- PERMISSIONS ---
  const canEdit = isSuperAdmin || role === UserRole.ADMIN;
  const canDelete = !!isSuperAdmin;
  
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

  // --- DYNAMIC STATS CALCULATION ---
  const { stats, totalNodesAcrossRings } = useMemo(() => {
    const s = {
        spec: { issued: 0, pending: 0 },
        ofc: { ready: 0, partial: 0, pending: 0 },
        bts: { onAir: 0, pending: 0, nodesOnAir: 0, configuredCount: 0 }
    };
    
    let nodesSum = 0;

    rings.forEach(r => {
        nodesSum += (r.total_nodes || 0);

        if (r.spec_status === 'Issued') s.spec.issued++;
        else s.spec.pending++;

        if (r.ofc_status === 'Ready') s.ofc.ready++;
        else if (r.ofc_status === 'Partial Ready') s.ofc.partial++;
        else s.ofc.pending++;

        if (r.bts_status === 'On-Air') {
          s.bts.onAir++;
          s.bts.nodesOnAir += (r.total_nodes ?? 0);
        } else if (r.bts_status === 'Configured') {
          s.bts.configuredCount++;
        } else {
          s.bts.pending++;
        }
    });
    return { stats: s, totalNodesAcrossRings: nodesSum };
  }, [rings]);

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
      onEdit: canEdit ? editModal.openEdit : undefined,
      onView: handleView,
      onDelete: canDelete ? crudActions.handleDelete : undefined,
    });
    standardActions.unshift({
      key: 'manage-systems', label: 'Manage Systems',
      icon: <FaNetworkWired className='w-4 h-4' />,
      onClick: handleManageSystems, variant: 'secondary'
    });
    return standardActions;
  }, [editModal.openEdit, handleView, crudActions.handleDelete, handleManageSystems, canEdit, canDelete]);

  const isInitialLoad = isLoading && rings.length === 0;

  const headerActions = useStandardHeaderActions({
    data: rings as RingsRowSchema[],
    onRefresh: async () => { await refetch(); toast.success('Refreshed successfully!'); },
    onAddNew: canEdit ? editModal.openAdd : undefined,
    isLoading: isLoading,
    exportConfig: { tableName: 'rings' },
  });

  const headerStats = [
    // THE FIX: Added Total Nodes sum to the first stat card
    { value: `${totalNodesAcrossRings} / ${totalCount}`, label: 'Total Nodes / Rings' },
    { value: `${stats.bts.nodesOnAir} / ${stats.bts.configuredCount}`, label: 'Nodes On-Air / Rings Configured', color: 'success' as const },
    {
      value: `${stats.spec.issued} / ${stats.spec.pending}`,
      label: 'SPEC (Issued/Pend)',
      color: 'primary' as const,
    },
    {
      value: `${stats.ofc.ready} / ${stats.ofc.partial} / ${stats.ofc.pending}`,
      label: 'OFC (Ready/Partial/Pend)',
      color: 'warning' as const,
    },
  ];

  const renderMobileItem = useCallback((record: Row<'v_rings'>, actions: React.ReactNode) => {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">{record.name}</h3>
            <span className="inline-flex mt-1 items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
               {record.ring_type_name}
            </span>
          </div>
          {actions}
        </div>
        
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-300 mt-1">
             <div className="flex items-center gap-1.5">
                <FiMapPin className="w-3.5 h-3.5 text-gray-400" />
                <span className="truncate max-w-[120px]">{record.maintenance_area_name}</span>
             </div>
             <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900 dark:text-white">{record.total_nodes}</span>
                <span>Nodes</span>
             </div>
        </div>

        {/* Phase Statuses */}
        <div className="grid grid-cols-3 gap-1 mt-2">
            <div className="text-center p-1 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="text-[10px] text-gray-400">OFC</div>
                <div className="text-xs font-medium text-blue-600 dark:text-blue-400">{record.ofc_status || '-'}</div>
            </div>
            <div className="text-center p-1 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="text-[10px] text-gray-400">BTS</div>
                <div className="text-xs font-medium text-green-600 dark:text-green-400">{record.bts_status || '-'}</div>
            </div>
            <div className="text-center p-1 bg-gray-50 dark:bg-gray-800 rounded">
                <div className="text-[10px] text-gray-400">SPEC</div>
                <div className="text-xs font-medium text-orange-600 dark:text-orange-400">{record.spec_status || '-'}</div>
            </div>
        </div>

        <div className="flex items-center justify-end mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
             <StatusBadge status={record.status ?? false} />
        </div>
      </div>
    );
  }, []);

  if (error) {
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;
  }

  return (
    <div className='mx-auto space-y-4 p-6'>
      <PageHeader
        title='Ring Management'
        description='Manage network rings, assign systems, and track phase progress.'
        icon={<GiLinkedRings />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isInitialLoad}
        isFetching={isFetching}
      />
           <DataTable
      autoHideEmptyColumns={true}
        tableName='v_rings'
        data={rings}
        columns={orderedColumns}
        loading={isLoading}
        actions={tableActions}
        isFetching={isFetching || isMutating}
        renderMobileItem={renderMobileItem}
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
            {/* Extended Status Filters */}
            <SelectFilter
              label="OFC Status"
              filterKey="ofc_status"
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={STATUS_OPTIONS.OFC}
            />
            <SelectFilter
              label="SPEC Status"
              filterKey="spec_status"
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={STATUS_OPTIONS.SPEC}
            />
            <SelectFilter
              label="BTS Status"
              filterKey="bts_status"
              filters={filters.filters}
              setFilters={filters.setFilters}
              options={STATUS_OPTIONS.BTS}
            />
            <SelectFilter
              label="Active Record"
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