// app/dashboard/nodes/page.tsx
'use client';

import { PageHeader, useStandardHeaderActions } from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import { NodeFormModal } from '@/components/nodes/NodeFormModal';
import { NodesFilters } from '@/components/nodes/NodesFilters';
import { createStandardActions } from '@/components/table/action-helpers';
import { DataTable } from '@/components/table/DataTable';
import { NodeDetailsModal } from '@/config/node-details-config';
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { NodesTableColumns } from '@/config/table-columns/NodesTableColumns';
import { Filters } from '@/hooks/database';
import { useCrudManager } from '@/hooks/useCrudManager';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { NodesRowSchema, V_nodes_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useMemo } from 'react';
import { FiCpu, FiCopy } from 'react-icons/fi';
import { toast } from 'sonner';
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/hooks/data/localDb';
import { useNodesData } from '@/hooks/data/useNodesData';
import { useUser } from '@/providers/UserProvider';
import { useDuplicateFinder } from '@/hooks/useDuplicateFinder';

export type NodeRowsWithRelations = NodesRowSchema & {
  maintenance_terminal?: { id: string; name: string } | null;
  node_type?: { id: string; name: string } | null;
};

const NodesPage = () => {
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
    actions: crudActions,
  } = useCrudManager<'nodes', V_nodes_completeRowSchema>({
    tableName: 'nodes',
    dataQueryHook: useNodesData,
    displayNameField: 'name'
  });
  const { isSuperAdmin } = useUser();

  // --- DUPLICATE DETECTION ---
  const { showDuplicates, toggleDuplicates, duplicateSet } = useDuplicateFinder(nodes, 'name', 'Nodes');

  const { data: nodeTypeOptionsData } = useOfflineQuery(
    ['node-types-for-filter'],
    async () =>
      (await createClient().from('v_nodes_complete').select('node_type_id, node_type_name')).data ??
      [],
    async () =>
      (await localDb.v_nodes_complete.toArray()).map((n) => ({
        node_type_id: n.node_type_id,
        node_type_name: n.node_type_name,
      }))
  );

  const nodeTypes = useMemo(() => {
    if (!nodeTypeOptionsData) return [];
    const uniqueNodeTypes = new Map<string, { id: string; name: string }>();
    nodeTypeOptionsData.forEach(
      (node: { node_type_id: string | null; node_type_name: string | null }) => {
        if (node.node_type_id && node.node_type_name && !uniqueNodeTypes.has(node.node_type_id)) {
          uniqueNodeTypes.set(node.node_type_id, {
            id: node.node_type_id,
            name: node.node_type_name,
          });
        }
      }
    );
    return Array.from(uniqueNodeTypes.values());
  }, [nodeTypeOptionsData]);

  const isInitialLoad = isLoading && nodes.length === 0;
  
  // THE FIX: Pass duplicateSet to the columns generator
  const columns = NodesTableColumns(nodes, showDuplicates ? duplicateSet : undefined);
  
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_nodes_complete]);
  
  const tableActions = useMemo(
    () =>
      createStandardActions<V_nodes_completeRowSchema>({
        onEdit: editModal.openEdit,
        onView: viewModal.open,
        onDelete: isSuperAdmin ? crudActions.handleDelete : undefined,
      }),
    [editModal.openEdit, viewModal.open, crudActions.handleDelete, isSuperAdmin]
  );
  
  const headerActions = useStandardHeaderActions({
    data: nodes as NodesRowSchema[],
    onAddNew: editModal.openAdd,
    onRefresh: () => {
      refetch();
      toast.success('Refreshed successfully!');
    },
    isLoading: isLoading,
    exportConfig: { tableName: 'nodes' },
  });

  // Add Duplicate Toggle Button
  headerActions.splice(headerActions.length - 1, 0, {
    label: showDuplicates ? "Hide Duplicates" : "Find Duplicates",
    onClick: toggleDuplicates,
    variant: showDuplicates ? "secondary" : "outline",
    leftIcon: <FiCopy />,
  });

  const headerStats = [
    { value: totalCount, label: 'Total Nodes' },
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
    <div className="mx-auto space-y-4 p-6">
      <PageHeader
        title="Node Management"
        description="Manage network nodes and their related information."
        icon={<FiCpu />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isInitialLoad}
        isFetching={isFetching}
      />
      <NodeDetailsModal
        isOpen={viewModal.isOpen}
        node={viewModal.record as V_nodes_completeRowSchema}
        onClose={viewModal.close}
      />
      <DataTable
        tableName="v_nodes_complete"
        data={nodes}
        columns={orderedColumns}
        loading={isLoading}
        actions={tableActions}
        selectable={isSuperAdmin ? true : false}
        showColumnsToggle={true}
        onCellEdit={crudActions.handleCellEdit}
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
            selectedNodeType={filters.filters.node_type_id as string | undefined}
            onNodeTypeChange={(value) =>
              filters.setFilters((prev) => ({ ...prev, node_type_id: value } as Filters))
            }
          />
        }
      />
      {editModal.isOpen && (
        <NodeFormModal
          isOpen={editModal.isOpen}
          onClose={editModal.close}
          editingNode={editModal.record as NodeRowsWithRelations | null}
          onSubmit={crudActions.handleSave}
          isLoading={isMutating}
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