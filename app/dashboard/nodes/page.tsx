'use client';

import {
  PageHeader,
  useStandardHeaderActions,
} from '@/components/common/page-header';
import { ConfirmModal, ErrorDisplay } from '@/components/common/ui';
import { NodeFormModal } from '@/components/nodes/NodeFormModal';
import { NodesFilters } from '@/components/nodes/NodesFilters';
import { createStandardActions } from '@/components/table/action-helpers';
import { DataTable } from '@/components/table/DataTable';
import { NodeDetailsModal } from '@/config/node-details-config';
import { NodesTableColumns } from '@/config/table-columns/NodesTableColumns';
import { convertRichFiltersToSimpleJson, usePagedData, Filters } from '@/hooks/database';
import {
  DataQueryHookParams,
  DataQueryHookReturn,
  useCrudManager,
} from '@/hooks/useCrudManager';
import useOrderedColumns from '@/hooks/useOrderedColumns';
import { NodesRowSchema, V_nodes_completeRowSchema } from '@/schemas/zod-schemas';
import { createClient } from '@/utils/supabase/client';
import { useMemo } from 'react';
import { FiCpu } from 'react-icons/fi';
import { toast } from 'sonner';

export type NodeRowsWithRelations = NodesRowSchema & {
  maintenance_terminal?: {
    id: string;
    name: string;
  } | null;
  node_type?: {
    id: string;
    name: string;
  } | null;
};

const useNodesData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_nodes_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();
  const rpcFilters = useMemo(() => {
      const convertedFilters = convertRichFiltersToSimpleJson(filters);
      return {
        ...(convertedFilters as Record<string, string | number | boolean | string[] | null>),
        ...(searchQuery ? { name: searchQuery } : {}),
      };
    }, [filters, searchQuery]);

  const { data, isLoading, error, refetch } = usePagedData<V_nodes_completeRowSchema>(
    supabase,
    'v_nodes_complete',
    {
      filters: rpcFilters,
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
    }
  );

  return {
    data: data?.data || [],
    totalCount: data?.total_count || 0,
    activeCount: data?.active_count || 0,
    inactiveCount: data?.inactive_count || 0,
    isLoading,
    error,
    refetch,
  };
};

const NodesPage = () => {
  const {
    data: nodes,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isMutating,
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
  });

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
  const orderedColumns = useOrderedColumns(columns, [
    'name', 'latitude', 'longitude', 'node_type_name', 'maintenance_area_name', 'status', 'remark',
  ]);

  const tableActions = useMemo(
    () => createStandardActions<V_nodes_completeRowSchema>({
        onEdit: editModal.openEdit,
        onView: viewModal.open,
        onDelete: crudActions.handleDelete,
      }),
    [editModal.openEdit, viewModal.open, crudActions.handleDelete]
  );

  const headerActions = useStandardHeaderActions({
    data: nodes as NodesRowSchema[],
    onAddNew: () => { editModal.openAdd(); },
    onRefresh: () => { refetch(); toast.success('Refreshed successfully!'); },
    isLoading: isLoading,
    exportConfig: { tableName: 'nodes' },
  });

  const headerStats = [
    { value: totalCount, label: 'Total Nodes' },
    { value: activeCount, label: 'Active', color: 'success' as const },
    { value: inactiveCount, label: 'Inactive', color: 'danger' as const },
  ];

  if (error) {
    return <ErrorDisplay error={error.message} actions={[{ label: 'Retry', onClick: refetch, variant: 'primary' }]} />;
  }

  return (
    <div className="mx-auto space-y-4 p-6">
      <PageHeader
        title="Node Management"
        description="Manage network nodes and their related information."
        icon={<FiCpu />}
        stats={headerStats}
        actions={headerActions}
        isLoading={isLoading}
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
        selectable={true}
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
          // ** Pass the correct props to the now "dumb" component.**
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