// app/dashboard/nodes/page.tsx
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
import { TABLE_COLUMN_KEYS } from '@/constants/table-column-keys';
import { NodesTableColumns } from '@/config/table-columns/NodesTableColumns';
import { Filters } from '@/hooks/database';
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
import { useOfflineQuery } from '@/hooks/data/useOfflineQuery';
import { localDb } from '@/data/localDb';

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

// OFFLINE-FIRST: This data hook is refactored to use useOfflineQuery
const useNodesData = (
  params: DataQueryHookParams
): DataQueryHookReturn<V_nodes_completeRowSchema> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  const queryKey = ['nodes-data', 'all'];

  // 1. Online Fetcher: Fetches all data from the Supabase view.
  const onlineQueryFn = async (): Promise<V_nodes_completeRowSchema[]> => {
    const { data, error } = await createClient().from('v_nodes_complete').select('*');
    if (error) throw error;
    return data || [];
  };

  // 2. Offline Fetcher: Fetches all data from the local Dexie table.
  const offlineQueryFn = async (): Promise<V_nodes_completeRowSchema[]> => {
    return await localDb.v_nodes_complete.toArray();
  };

  const { data: allNodes = [], isLoading, isFetching, error, refetch } = useOfflineQuery(
    queryKey,
    onlineQueryFn,
    offlineQueryFn,
    { staleTime: 5 * 60 * 1000 }
  );

  // 3. Client-side filtering and pagination
  const processedData = useMemo(() => {
    let filtered = allNodes;

    // Apply text search
    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      // FIX: Explicitly type the 'node' parameter
      filtered = filtered.filter((node: V_nodes_completeRowSchema) => 
        node.name?.toLowerCase().includes(lowerQuery) ||
        node.node_type_name?.toLowerCase().includes(lowerQuery) ||
        node.maintenance_area_name?.toLowerCase().includes(lowerQuery)
      );
    }
    
    // Apply structured filters (e.g., from dropdowns)
    if (filters.node_type_id) {
        // FIX: Explicitly type the 'node' parameter
        filtered = filtered.filter((node: V_nodes_completeRowSchema) => node.node_type_id === filters.node_type_id);
    }

    const totalCount = filtered.length;
    // FIX: Explicitly type the 'n' parameter
    const activeCount = filtered.filter((n: V_nodes_completeRowSchema) => n.status === true).length;

    // Apply pagination
    const start = (currentPage - 1) * pageLimit;
    const end = start + pageLimit;
    const paginatedData = filtered.slice(start, end);

    return {
      data: paginatedData,
      totalCount,
      activeCount,
      inactiveCount: totalCount - activeCount,
    };
  }, [allNodes, searchQuery, filters, currentPage, pageLimit]);

  return {
    ...processedData,
    isLoading,
    isFetching,
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
  });
  
  // Separate offline-first query just for populating the filter dropdown
  const { data: nodeTypeOptionsData } = useOfflineQuery(
    ['node-types-for-filter'],
    async () => {
      const { data, error } = await createClient().from('v_nodes_complete').select('node_type_id, node_type_name');
      if (error) throw error;
      return data || [];
    },
    async () => {
        const allNodes = await localDb.v_nodes_complete.toArray();
        return allNodes.map(n => ({ node_type_id: n.node_type_id, node_type_name: n.node_type_name }));
    }
  );

  const nodeTypes = useMemo(() => {
    if (!nodeTypeOptionsData) return [];
    const uniqueNodeTypes = new Map<string, { id: string; name: string }>();
    // FIX: Explicitly type the 'node' parameter
    nodeTypeOptionsData.forEach((node: { node_type_id: string | null; node_type_name: string | null; }) => {
      if (node.node_type_id && node.node_type_name && !uniqueNodeTypes.has(node.node_type_id)) {
        uniqueNodeTypes.set(node.node_type_id, {
          id: node.node_type_id,
          name: node.node_type_name,
        });
      }
    });
    return Array.from(uniqueNodeTypes.values());
  }, [nodeTypeOptionsData]);


  const isInitialLoad = isLoading && nodes.length === 0;
  const columns = NodesTableColumns(nodes);
  const orderedColumns = useOrderedColumns(columns, [...TABLE_COLUMN_KEYS.v_nodes_complete]);

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