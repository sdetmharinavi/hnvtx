// app/dashboard/rings/page.tsx
'use client';

import { useMemo, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GiLinkedRings } from 'react-icons/gi';
import { FiMapPin, FiActivity, FiCheckCircle } from 'react-icons/fi';

import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { GenericEntityCard } from '@/components/common/ui/GenericEntityCard';
import { useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import { RingModal } from '@/components/rings/RingModal';
import { createStandardActions } from '@/components/table/action-helpers';
import { useCrudManager, UseCrudManagerReturn } from '@/hooks/useCrudManager';
import { useRingManagerData, DynamicStats } from '@/hooks/data/useRingManagerData';
import {
  V_ringsRowSchema,
  RingsRowSchema,
  RingsInsertSchema,
  Lookup_typesRowSchema,
  Maintenance_areasRowSchema,
} from '@/schemas/zod-schemas';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { RingsColumns } from '@/config/table-columns/RingsTableColumns';
import { useUser } from '@/providers/UserProvider';
import { useLookupTypeOptions, useMaintenanceAreaOptions } from '@/hooks/data/useDropdownOptions';
import { PERMISSIONS } from '@/config/permissions';
import { StatProps } from '@/components/common/page-header/StatCard';
import { FilterConfig } from '@/components/common/filters/GenericFilterBar';
import { DataGrid } from '@/components/common/DataGrid';
import { StatusBadge } from '@/components/common/ui/badges/StatusBadge';

const STATUS_OPTIONS = {
  OFC: [
    { value: 'Pending', label: 'Pending' },
    { value: 'Partial Ready', label: 'Partial Ready' },
    { value: 'Ready', label: 'Ready' },
  ],
  SPEC: [
    { value: 'Pending', label: 'Pending' },
    { value: 'Survey', label: 'Survey' },
    { value: 'Issued', label: 'Issued' },
  ],
  BTS: [
    { value: 'Pending', label: 'Pending' },
    { value: 'Configured', label: 'Configured' },
    { value: 'On-Air', label: 'On-Air' },
  ],
};

// Interface extension to expose stats returned by useRingManagerData
interface RingCrudReturn extends UseCrudManagerReturn<V_ringsRowSchema> {
  stats: DynamicStats;
}

export default function RingsPage() {
  const router = useRouter();
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  const crud = useCrudManager<'rings', V_ringsRowSchema>({
    tableName: 'rings',
    dataQueryHook: useRingManagerData,
    displayNameField: 'name',
    searchColumn: [
      'name',
      'description',
      'ring_type_name',
      'maintenance_area_name',
      'associated_system_names',
      'associated_system_ips',
    ] as any,
    syncTables: ['rings', 'v_rings', 'ring_based_systems'],
  }) as RingCrudReturn;

  const {
    data: rings,
    totalCount,
    isLoading,
    isMutating,
    isFetching,
    error,
    refetch,
    pagination,
    search,
    filters,
    editModal,
    deleteModal,
    actions: crudActions,
    stats: dynamicStats,
  } = crud;

  const { canAccess } = useUser();
  const canEdit = canAccess(PERMISSIONS.canManage);
  const canDelete = canAccess(PERMISSIONS.canDeleteCritical);

  // --- DATA FETCHING FOR MODALS ---
  const { originalData: ringTypesRaw, isLoading: isLoadingRingTypes } =
    useLookupTypeOptions('RING_TYPES');

  const { originalData: maintenanceAreasRaw, isLoading: isLoadingAreas } =
    useMaintenanceAreaOptions();

  const ringTypes = useMemo(() => (ringTypesRaw || []) as Lookup_typesRowSchema[], [ringTypesRaw]);
  const maintenanceAreas = useMemo(
    () => (maintenanceAreasRaw || []) as Maintenance_areasRowSchema[],
    [maintenanceAreasRaw],
  );

  const isLoadingDropdowns = isLoadingRingTypes || isLoadingAreas;

  const ringTypeFilterOptions = useMemo(
    () =>
      ringTypes.map((t) => ({
        value: t.id,
        label: t.name,
      })),
    [ringTypes],
  );

  const maintenanceAreaFilterOptions = useMemo(
    () =>
      maintenanceAreas.map((a) => ({
        value: a.id,
        label: a.name,
      })),
    [maintenanceAreas],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters],
  );

  const filterConfigs = useMemo<FilterConfig[]>(
    () => [
      {
        key: 'ring_type_id',
        label: 'Ring Type',
        type: 'multi-select',
        options: ringTypeFilterOptions,
        isLoading: isLoadingRingTypes,
        placeholder: 'All Ring Types',
      },
      {
        key: 'maintenance_terminal_id',
        label: 'Maintenance Area',
        type: 'multi-select',
        options: maintenanceAreaFilterOptions,
        isLoading: isLoadingAreas,
        placeholder: 'All Areas',
      },
      {
        key: 'ofc_status',
        label: 'OFC Status',
        type: 'native-select',
        options: STATUS_OPTIONS.OFC,
        placeholder: 'All OFC Status',
      },
      {
        key: 'spec_status',
        label: 'SPEC Status',
        type: 'native-select',
        options: STATUS_OPTIONS.SPEC,
        placeholder: 'All SPEC Status',
      },
      {
        key: 'bts_status',
        label: 'Working Status',
        type: 'native-select',
        options: STATUS_OPTIONS.BTS,
        placeholder: 'All Working Status',
      },
      {
        key: 'status',
        label: 'Active Record',
        type: 'native-select',
        options: [
          { value: 'true', label: 'Active' },
          { value: 'false', label: 'Inactive' },
        ],
        placeholder: 'All Status',
      },
    ],
    [ringTypeFilterOptions, maintenanceAreaFilterOptions, isLoadingRingTypes, isLoadingAreas],
  );

  const headerStats = useMemo<StatProps[]>(() => {
    const s = dynamicStats || {
      total: 0,
      totalNodes: 0,
      spec: { issued: 0, pending: 0 },
      ofc: { ready: 0, partial: 0, pending: 0 },
      bts: { onAir: 0, pending: 0, nodesOnAir: 0, configuredCount: 0 },
    };

    const currentOfcFilter = filters.filters.ofc_status;
    const currentSpecFilter = filters.filters.spec_status;
    const currentBtsFilter = filters.filters.bts_status;

    return [
      {
        value: `${s.totalNodes} / ${s.total}`,
        label: 'Total Nodes / Rings',
        color: 'default',
        onClick: () =>
          filters.setFilters((prev) => {
            const next = { ...prev };
            delete next.ofc_status;
            delete next.spec_status;
            delete next.bts_status;
            return next;
          }),
        isActive: !currentOfcFilter && !currentSpecFilter && !currentBtsFilter,
      },
      {
        value: `${s.bts.nodesOnAir} / ${s.bts.configuredCount}`,
        label: 'Nodes On-Air / Rings Configured',
        color: 'success',
        onClick: () => filters.setFilters((prev) => ({ ...prev, bts_status: 'On-Air' })),
        isActive: currentBtsFilter === 'On-Air',
      },
      {
        value: `${s.spec.issued} / ${s.spec.pending}`,
        label: 'SPEC (Issued/Pend)',
        color: 'primary',
        onClick: () => filters.setFilters((prev) => ({ ...prev, spec_status: 'Issued' })),
        isActive: currentSpecFilter === 'Issued',
      },
      {
        value: `${s.ofc.ready} / ${s.ofc.partial} / ${s.ofc.pending}`,
        label: 'OFC (Ready/Partial/Pend)',
        color: 'warning',
        onClick: () => filters.setFilters((prev) => ({ ...prev, ofc_status: 'Ready' })),
        isActive: currentOfcFilter === 'Ready',
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dynamicStats,
    filters.filters.ofc_status,
    filters.filters.spec_status,
    filters.filters.bts_status,
    filters.setFilters,
  ]);

  const columns = RingsColumns(rings, STATUS_OPTIONS);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_rings] as string[]);

  const handleView = useCallback(
    (record: V_ringsRowSchema) => {
      if (record.id) router.push(`/dashboard/rings/${record.id}`);
    },
    [router],
  );

  const isInitialLoad = isLoading && rings.length === 0;

  const headerActions = useStandardHeaderActions({
    data: rings as RingsRowSchema[],
    onRefresh: async () => {
      await refetch();
    },
    onAddNew: canEdit ? editModal.openAdd : undefined,
    isLoading: isLoading,
    isFetching: isFetching,
    exportConfig: canEdit ? { tableName: 'rings' } : undefined,
  });

  const renderGridItem = useCallback(
    (ring: V_ringsRowSchema) => {
      return (
        <GenericEntityCard
          key={ring.id}
          entity={ring}
          title={ring.name || 'Unnamed Ring'}
          status={ring.status}
          showStatusLabel={false}
          headerIcon={<GiLinkedRings className='w-6 h-6 text-indigo-500' />}
          subBadge={
            <span className='inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'>
              {ring.ring_type_name || 'Generic'}
            </span>
          }
          dataItems={[
            { icon: FiMapPin, label: 'Area', value: ring.maintenance_area_name },
            { icon: FiActivity, label: 'Nodes', value: String(ring.total_nodes || 0) },
            {
              icon: FiCheckCircle,
              label: 'OFC Status',
              value: <StatusBadge status={ring.ofc_status || 'Pending'} />,
            },
          ]}
          onView={(rec) => handleView(rec)}
          onEdit={canEdit ? editModal.openEdit : undefined}
          onDelete={canDelete ? crudActions.handleDelete : undefined}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      );
    },
    [handleView, editModal.openEdit, crudActions.handleDelete, canEdit, canDelete],
  );

  const renderGrid = useCallback(
    () => (
      <DataGrid
        data={rings}
        renderItem={renderGridItem}
        isLoading={isLoading}
        isEmpty={rings.length === 0 && !isLoading}
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
      />
    ),
    [rings, renderGridItem, isLoading, pagination, totalCount],
  );

  if (error) {
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;
  }

  return (
    <DashboardPageLayout
      crud={crud}
      header={{
        title: 'Ring Management',
        description: 'Manage network rings, assign systems, and track phase progress.',
        icon: <GiLinkedRings />,
        stats: headerStats,
        actions: headerActions,
        isLoading: isInitialLoad,
        isFetching: isFetching,
      }}
      searchQuery={search.searchQuery}
      onSearchChange={search.setSearchQuery}
      searchPlaceholder='Search ring name, type, area...'
      filters={filters.filters}
      onFilterChange={handleFilterChange}
      setFilters={filters.setFilters}
      filterConfigs={filterConfigs}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      renderGrid={renderGrid}
      tableProps={{
        tableName: 'v_rings',
        data: rings,
        columns: orderedColumns,
        loading: isLoading,
        isFetching: isFetching || isMutating,
        actions: createStandardActions({
          onEdit: canEdit ? editModal.openEdit : undefined,
          onView: handleView,
          onDelete: canDelete ? crudActions.handleDelete : undefined,
        }),
        onCellEdit: canEdit ? crudActions.handleCellEdit : undefined,
        onRowClick: (record) => handleView(record as V_ringsRowSchema),
        pagination: {
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, pageSize) => {
            pagination.setCurrentPage(page);
            pagination.setPageLimit(pageSize);
          },
        },
        customToolbar: <></>,
      }}
      isEmpty={rings.length === 0 && !isLoading}
      modals={
        <>
          {editModal.isOpen && (
            <RingModal
              isOpen={editModal.isOpen}
              onClose={editModal.close}
              onSubmit={crudActions.handleSave as (data: RingsInsertSchema) => void}
              editingRing={editModal.record}
              ringTypes={ringTypes || []}
              maintenanceAreas={maintenanceAreas || []}
              isLoading={isMutating}
              isLoadingDropdowns={isLoadingDropdowns}
            />
          )}

          <ConfirmModal
            isOpen={deleteModal.isOpen}
            onConfirm={deleteModal.onConfirm}
            onCancel={deleteModal.onCancel}
            title='Confirm Deletion'
            message={deleteModal.message}
            confirmText='Delete'
            cancelText='Cancel'
            type='danger'
            showIcon
            loading={deleteModal.loading}
          />
        </>
      }
    />
  );
}
