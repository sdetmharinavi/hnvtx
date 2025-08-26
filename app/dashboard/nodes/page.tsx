"use client";

import React, { useMemo } from "react";
import { DataTable } from "@/components/table/DataTable";
import { NodesFilters } from "@/components/nodes/NodesFilters";
import { getNodesTableColumns } from "@/components/nodes/NodesTableColumns";
import { NodeFormModal } from "@/components/nodes/NodeFormModal";
import { ConfirmModal, ErrorDisplay } from "@/components/common/ui";
import { useTableWithRelations } from "@/hooks/database";
import { FiCpu } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import {
  DataQueryHookParams,
  DataQueryHookReturn,
  useCrudManager,
} from "@/hooks/useCrudManager";
import { createStandardActions } from "@/components/table/action-helpers";
import {
  PageHeader,
  useStandardHeaderActions,
} from "@/components/common/PageHeader";
import { toast } from "sonner";
import { NodeRowsWithRelations } from "@/types/relational-row-types";

// 1. ADAPTER HOOK: Makes `useNodesData` compatible with `useCrudManager`
const useNodesData = (
  params: DataQueryHookParams
): DataQueryHookReturn<NodeRowsWithRelations> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;

  const supabase = createClient();

  const { data, isLoading, error, refetch } = useTableWithRelations(
    supabase,
    "nodes",
    [
      "node_type:node_type_id(name)",
      "ring:ring_id(name)",
      "maintenance_terminal:maintenance_terminal_id(name)",
    ],
    {
      filters: {
        name: { operator: "ilike", value: `%${searchQuery}%` },
        ...filters,
      },
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
      includeCount: true,
      orderBy: [{ column: "name", ascending: true }],
    }
  );

  return {
    data: data || [],
    totalCount: data?.length || 0,
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
  } = useCrudManager<"nodes", NodeRowsWithRelations>({
    tableName: "nodes",
    dataQueryHook: useNodesData,
  });

  // 3. Extract node types from the nodes data
  const nodeTypes = useMemo(() => {
    const uniqueNodeTypes = new Map();
    nodes.forEach((node) => {
      if (node.node_type && node.node_type_id) {
        uniqueNodeTypes.set(node.node_type_id, {
          id: node.node_type_id,
          name: node.node_type.name,
        });
      }
    });

    return Array.from(uniqueNodeTypes.values());
  }, [nodes]);

  const columns = useMemo(() => getNodesTableColumns(), []);

  const tableActions = useMemo(
    () =>
      createStandardActions<NodeRowsWithRelations>({
        onEdit: editModal.openEdit,
        onView: viewModal.open,
        onDelete: crudActions.handleDelete,
      }),
    [editModal.openEdit, viewModal.open, crudActions.handleDelete]
  );

  // --- Define header content using the hook ---
  const headerActions = useStandardHeaderActions({
    onRefresh: () => {
      refetch();
      toast.success("Refreshed successfully!");
    },
    // onAddNew: placeholder ToDo,
    isLoading: isLoading,
    exportConfig: { tableName: "nodes" },
  });

  const headerStats = [
    { value: totalCount, label: "Total Nodes" },
    {
      value: nodes.filter((r) => r.status).length,
      label: "Active",
      color: "success" as const,
    },
    {
      value: nodes.filter((r) => !r.status).length,
      label: "Inactive",
      color: "danger" as const,
    },
  ];

  if (error) {
    return (
      <ErrorDisplay
        error={error.message}
        actions={[
          {
            label: "Retry",
            onClick: refetch,
            variant: "primary",
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

      <DataTable
        tableName="nodes"
        data={nodes}
        columns={columns}
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
        onConfirm={deleteModal.confirm}
        onCancel={deleteModal.cancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        loading={deleteModal.isLoading}
        type="danger"
      />
    </div>
  );
};

export default NodesPage;
