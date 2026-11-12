// app/dashboard/nodes/page.tsx
'use client';

import React, { useCallback, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { DashboardPageLayout } from '@/components/layouts/DashboardPageLayout';
import { GenericEntityCard } from '@/components/common/ui/GenericEntityCard';
import { NodeDetailsModal } from '@/config/node-details-config';
import { ConfirmModal, ErrorDisplay, PageSpinner } from '@/components/common/ui';
import { useCrudManager } from '@/hooks/useCrudManager';
import { useNodesData } from '@/hooks/data/useNodesData';
import { useUser } from '@/providers/UserProvider';
import { useLookupTypeOptions, useMaintenanceAreaOptions } from '@/hooks/data/useDropdownOptions';
import { useDuplicateFinder } from '@/hooks/useDuplicateFinder';
import { NodesRowSchema, V_nodes_completeRowSchema } from '@/schemas/zod-schemas';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { NodesTableColumns } from '@/config/table-columns/NodesTableColumns';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { useStandardHeaderActions } from '@/components/common/page-header';
import { FiCpu, FiMapPin, FiNavigation, FiCopy, FiServer } from 'react-icons/fi';
import { createStandardActions } from '@/components/table/action-helpers';
import L from 'leaflet';
import { getNodeIcon } from '@/utils/getNodeIcons';
import GenericRemarks from '@/components/common/GenericRemarks';
import { DataGrid } from '@/components/common/DataGrid';
import { PERMISSIONS } from '@/config/permissions';
import { StatProps } from '@/components/common/page-header/StatCard';
import { NodeCard } from '@/components/nodes/NodeCard';
import { NodeInfrastructureModal } from '@/components/nodes/NodeInfrastructureModal';

const NodeFormModal = dynamic(
  () => import('@/components/nodes/NodeFormModal').then((mod) => mod.NodeFormModal),
  { loading: () => <PageSpinner text='Loading Node Form...' /> },
);

export default function NodesPage() {
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [nodeForInfrastructure, setNodeForInfrastructure] = useState<V_nodes_completeRowSchema | null>(null);

  const {
    data: nodes,
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
    viewModal,
    deleteModal,
    bulkActions,
    actions: crudActions,
  } = useCrudManager<'nodes', V_nodes_completeRowSchema>({
    tableName: 'nodes',
    dataQueryHook: useNodesData,
    searchColumn: ['name', 'remark'],
    displayNameField: 'name',
    syncTables: ['nodes', 'v_nodes_complete'],
  });

  const { showDuplicates, toggleDuplicates, duplicateSet } = useDuplicateFinder(
    nodes,
    'name',
    'Nodes',
  );

  const { canAccess } = useUser();
  const canEdit = canAccess(PERMISSIONS.canManage);
  const canDelete = canAccess(PERMISSIONS.canDeleteCritical);

  const { options: nodeTypeOptions, isLoading: loadingNodeTypes } =
    useLookupTypeOptions('NODE_TYPES');
  const { options: areaOptions, isLoading: loadingAreas } = useMaintenanceAreaOptions();
  
  // --- EDITED SECTION START ---
  // Fetch system types for the new filter
  const { options: systemTypeOptions, isLoading: loadingSystemTypes } =
    useLookupTypeOptions('SYSTEM_TYPES');
  // --- EDITED SECTION END ---

  // --- Filter Config ---
  const filterConfigs = useMemo(
    () => [
      {
        key: 'coordinates_status',
        type: 'native-select' as const,
        options: [
          { value: 'with_coords', label: 'With Coordinates' },
          { value: 'without_coords', label: 'Without Coordinates' },
        ],
        placeholder: 'All Locations',
      },
      {
        key: 'node_type_id',
        type: 'multi-select' as const,
        options: nodeTypeOptions,
        isLoading: loadingNodeTypes,
        sortOptions: false,
        placeholder: 'All Node Types',
      },
      // --- EDITED SECTION START ---
      // Adding System Types Multi-Select Filter
      {
        key: 'system_type_id',
        label: '',
        type: 'multi-select' as const,
        options: systemTypeOptions,
        isLoading: loadingSystemTypes,
        placeholder: 'All System Types',
      },
      // --- EDITED SECTION END ---
      {
        key: 'maintenance_terminal_id',
        type: 'multi-select' as const,
        options: areaOptions,
        isLoading: loadingAreas,
        placeholder: 'All maintenance terminal',
      },
    ],
    [nodeTypeOptions, areaOptions, systemTypeOptions, loadingNodeTypes, loadingAreas, loadingSystemTypes],
  );

  const handleFilterChange = useCallback(
    (key: string, value: string | null) => {
      filters.setFilters((prev) => ({ ...prev, [key]: value }));
    },
    [filters],
  );

  const isInitialLoad = isLoading && nodes.length === 0;

  const columns = NodesTableColumns(nodes, showDuplicates ? duplicateSet : undefined);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_nodes_complete]);

  const headerActions = useStandardHeaderActions({
    data: nodes as NodesRowSchema[],
    onAddNew: canEdit ? editModal.openAdd : undefined,
    onRefresh: async () => {
      await refetch();
    },
    isLoading: isLoading,
    isFetching: isFetching,
    exportConfig: canEdit ? { tableName: 'nodes', useRpc: true, 
      filters: filters.filters } : undefined,
  });

  // Inject duplicate toggle
  headerActions.splice(headerActions.length - 1, 0, {
    label: showDuplicates ? 'Hide Duplicates' : 'Find Duplicates',
    onClick: toggleDuplicates,
    variant: 'outline',
    leftIcon: <FiCopy />,
    hideTextOnMobile: true,
  });

  // --- INTERACTIVE STATS ---
  const headerStats = useMemo<StatProps[]>(() => {
    const currentStatus = filters.filters.status;

    return [
      {
        value: totalCount,
        label: 'Total Nodes',
        color: 'default',
        // Click clears the status filter to show all
        onClick: () =>
          filters.setFilters((prev) => {
            const next = { ...prev };
            delete next.status;
            return next;
          }),
        isActive: !currentStatus,
      },
      {
        value: activeCount,
        label: 'Active',
        color: 'success',
        // Click sets status to 'true'
        onClick: () => filters.setFilters((prev) => ({ ...prev, status: 'true' })),
        isActive: currentStatus === 'true',
      },
      {
        value: inactiveCount,
        label: 'Inactive',
        color: 'danger',
        // Click sets status to 'false'
        onClick: () => filters.setFilters((prev) => ({ ...prev, status: 'false' })),
        isActive: currentStatus === 'false',
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [totalCount, activeCount, inactiveCount, filters.filters.status, filters.setFilters]);

  const renderItem = useCallback(
    (node: V_nodes_completeRowSchema) => {
      return (
        <NodeCard
          key={node.id}
          node={node}
          onView={viewModal.open}
          onEdit={editModal.openEdit}
          onDelete={crudActions.handleDelete}
          onViewSystems={setNodeForInfrastructure}
          canEdit={canEdit}
          canDelete={canDelete}
        />
      );
    },
    [viewModal.open, editModal.openEdit, crudActions.handleDelete, canEdit, canDelete],
  );

  const renderGrid = useCallback(
    () => (
      <DataGrid
        data={nodes}
        renderItem={renderItem}
        isLoading={isLoading}
        isEmpty={nodes.length === 0 && !isLoading}
        pagination={{
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          onChange: (page, pageSize) => {
            pagination.setCurrentPage(page);
            pagination.setPageLimit(pageSize);
          },
        }}
      />
    ),
    [nodes, renderItem, isLoading, totalCount, pagination],
  );

  const tableActions = useMemo(() => {
    const actions = createStandardActions({
      onEdit: canEdit ? editModal.openEdit : undefined,
      onView: viewModal.open,
      onDelete: canDelete ? crudActions.handleDelete : undefined,
    });
    
    actions.unshift({
      key: 'infrastructure',
      label: 'Infrastructure',
      icon: <FiServer className="w-4 h-4" />,
      onClick: (record) => setNodeForInfrastructure(record as V_nodes_completeRowSchema),
      variant: 'primary',
    });

    return actions;
  }, [canEdit, canDelete, editModal.openEdit, viewModal.open, crudActions.handleDelete]);

  if (error)
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch }]} />;

  return (
    <DashboardPageLayout
      header={{
        title: 'Node Management',
        description: 'Manage network locations, towers, and exchanges.',
        icon: <FiCpu />,
        stats: headerStats,
        actions: headerActions,
        isLoading: isInitialLoad,
        isFetching: isFetching,
      }}
      searchQuery={search.searchQuery}
      onSearchChange={search.setSearchQuery}
      searchPlaceholder='Search node name, remark...'
      filters={filters.filters}
      onFilterChange={handleFilterChange}
      setFilters={filters.setFilters}
      filterConfigs={filterConfigs}
      viewMode={viewMode}
      onViewModeChange={setViewMode}
      bulkActions={{
        selectedCount: bulkActions.selectedCount,
        isOperationLoading: isMutating,
        onBulkDelete: bulkActions.handleBulkDelete,
        onBulkUpdateStatus: bulkActions.handleBulkUpdateStatus,
        onClearSelection: bulkActions.handleClearSelection,
        entityName: 'node',
        showStatusUpdate: true,
        canDelete: () => canDelete,
      }}
      renderGrid={renderGrid}
      tableProps={{
        tableName: 'v_nodes_complete',
        data: nodes,
        columns: orderedColumns,
        loading: isLoading,
        isFetching: isFetching || isMutating,
        actions: tableActions,
        selectable: canDelete,
        onRowSelect: (rows) => {
          const validRows = rows.filter(
            (row): row is V_nodes_completeRowSchema & { id: string } => !!row.id,
          );
          bulkActions.handleRowSelect(validRows);
        },
        onCellEdit: crudActions.handleCellEdit,
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
      isEmpty={nodes.length === 0 && !isLoading}
      modals={
        <>
          {editModal.isOpen && (
            <NodeFormModal
              isOpen={editModal.isOpen}
              onClose={editModal.close}
              editingNode={editModal.record as NodesRowSchema}
              onSubmit={crudActions.handleSave}
              isLoading={isMutating}
            />
          )}

          <NodeDetailsModal
            isOpen={viewModal.isOpen}
            node={viewModal.record as V_nodes_completeRowSchema}
            onClose={viewModal.close}
          />

          <ConfirmModal
            isOpen={deleteModal.isOpen}
            onConfirm={deleteModal.onConfirm}
            onCancel={deleteModal.onCancel}
            title='Confirm Deletion'
            message={deleteModal.message}
            loading={deleteModal.loading}
            type='danger'
          />

          <NodeInfrastructureModal
            isOpen={!!nodeForInfrastructure}
            onClose={() => setNodeForInfrastructure(null)}
            node={nodeForInfrastructure}
          />
        </>
      }
    />
  );
}