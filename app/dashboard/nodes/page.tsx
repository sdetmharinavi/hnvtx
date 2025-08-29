'use client';

import React, { useMemo } from 'react';
import { DataTable } from '@/components/table/DataTable';
import { NodesFilters } from '@/components/nodes/NodesFilters';
import { NodesTableColumns } from '@/config/table-columns/NodesTableColumns';
import { NodeFormModal } from '@/components/nodes/NodeFormModal';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import {
  Row,
  usePagedNodesComplete,
} from '@/hooks/database';
import { FiCpu } from 'react-icons/fi';
import { createClient } from '@/utils/supabase/client';
import {
  DataQueryHookParams,
  DataQueryHookReturn,
  useCrudManager,
} from '@/hooks/useCrudManager';
import { createStandardActions } from '@/components/table/action-helpers';
import {
  PageHeader,
  useStandardHeaderActions,
} from '@/components/common/PageHeader';
import { toast } from 'sonner';
import { NodeRowsWithCount } from '@/types/view-row-types';
import { NodeDetailsModal } from '@/config/node-details-config';
import { NodeRowsWithRelations } from '@/types/relational-row-types';
import useOrderedColumns from '@/hooks/useOrderedColumns';

// 1. ADAPTER HOOK: Makes `useNodesData` compatible with `useCrudManager`
const useNodesData = (
  params: DataQueryHookParams
): DataQueryHookReturn<NodeRowsWithCount> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  const supabase = createClient();

  const { data, isLoading, error, refetch } = usePagedNodesComplete(supabase, {
    filters: {
      ...filters,
      ...(searchQuery ? { name: searchQuery } : {}),
    },
    limit: pageLimit,
    offset: (currentPage - 1) * pageLimit,
  });

  // Calculate counts from the full dataset
  const totalCount = data?.[0]?.total_count || 0;
  const activeCount = data?.[0]?.active_count || 0;
  const inactiveCount = data?.[0]?.inactive_count || 0;

  return {
    data: data || [],
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    error,
    refetch,
  };
};

const NodesPage = () => {
  // 2. USE THE CRUD MANAGER with the adapter hook and both generic types
  const {
    data: nodes,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    // isMutating,
    error,
    refetch,
    pagination,
    search,
    filters,
    editModal,
    viewModal,
    // bulkActions,
    deleteModal,
    actions: crudActions,
  } = useCrudManager<'nodes', NodeRowsWithCount>({
    tableName: 'nodes',
    dataQueryHook: useNodesData,
  });

  // 3. Extract node types from the nodes data
  const nodeTypes = useMemo(() => {
    const uniqueNodeTypes = new Map();
    nodes.forEach((node) => {
      if (node.node_type_id) {
        uniqueNodeTypes.set(node.node_type_id, {
          id: node.node_type_id,
          name: node.node_type_name,
        });
      }
    });

    return Array.from(uniqueNodeTypes.values());
  }, [nodes]);

  const columns = NodesTableColumns(nodes);

  const desiredColumns = [
    'name',
    'latitude',
    'longitude',
    'node_type_name',
    'node_type_code',
    'maintenance_area_name',
    'maintenance_area_code',
    'maintenance_area_type_name',
    'status',
    'remark',
    'id',
    'node_type_id',
    'maintenance_terminal_id',
    'created_at',
    'updated_at',
    'total_count',
    'active_count',
    'inactive_count',
  ]

  const orderedColumns = useOrderedColumns(columns, desiredColumns);

  const tableActions = useMemo(
    () =>
      createStandardActions<NodeRowsWithCount>({
        onEdit: editModal.openEdit,
        onView: viewModal.open,
        onDelete: crudActions.handleDelete,
      }),
    [editModal.openEdit, viewModal.open, crudActions.handleDelete]
  );

  // --- Define header content using the hook ---
  const headerActions = useStandardHeaderActions({
    data: nodes as Row<'nodes'>[],
    onAddNew: () => {
      editModal.openAdd();
    },
    onRefresh: () => {
      refetch();
      toast.success('Refreshed successfully!');
    },
    isLoading: isLoading,
    exportConfig: { tableName: 'nodes' },
  });

  const headerStats = [
    { value: totalCount, label: 'Total Nodes' },
    {
      value: activeCount,
      label: 'Active',
      color: 'success' as const,
    },
    {
      value: inactiveCount,
      label: 'Inactive',
      color: 'danger' as const,
    },
  ];

  if (error) {
    return (
      <ErrorDisplay
        error={error.message}
        actions={[
          {
            label: 'Retry',
            onClick: refetch,
            variant: 'primary',
          },
        ]}
      />
    );
  }

  return (
    <div className="mx-auto space-y-4">
      <PageHeader
        title="Node Management"
        description="Manage network nodes and their related information."
        icon={<FiCpu />}
        stats={headerStats}
        actions={headerActions} // <-- Pass the generated actions
        isLoading={isLoading}
      />

      <NodeDetailsModal
        isOpen={viewModal.isOpen}
        node={viewModal.record as NodeRowsWithCount}
        onClose={viewModal.close}
      />

      <DataTable
        tableName="v_nodes_complete"
        data={nodes}
        columns={orderedColumns}
        loading={isLoading}
        actions={tableActions}
        selectable={true} // Assuming you might want bulk actions later
        showColumnsToggle={true}
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
          <NodesFilters
            searchQuery={search.searchQuery}
            onSearchChange={search.setSearchQuery}
            nodeTypes={nodeTypes}
            selectedNodeType={
              filters.filters.node_type_id as string | undefined
            }
            onNodeTypeChange={(value) =>
              filters.setFilters((prev) => ({ ...prev, node_type_id: value }))
            }
          />
        }
      />

      {editModal.isOpen && (
        <NodeFormModal
          isOpen={editModal.isOpen}
          onClose={editModal.close}
          editingNode={editModal.record as NodeRowsWithRelations | null}
          onCreated={crudActions.handleSave}
          onUpdated={crudActions.handleSave}
        />
      )}

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.onConfirm}
        onCancel={deleteModal.onCancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        loading={deleteModal.loading}
        type="danger"
      />
    </div>
  );
};

export default NodesPage;
