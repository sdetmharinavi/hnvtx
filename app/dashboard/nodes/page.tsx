"use client";

import React, { useMemo } from "react";
import { DataTable } from "@/components/table/DataTable";
import { NodesHeader } from "@/components/nodes/NodesHeader";
import { NodesFilters } from "@/components/nodes/NodesFilters";
import { getNodesTableColumns } from "@/components/nodes/NodesTableColumns";
import { NodeFormModal, NodeRow } from "@/components/nodes/NodeFormModal";
import { ConfirmModal, ErrorDisplay } from "@/components/common/ui";
import { Row, useTableQuery } from "@/hooks/database";
import { useCrudPage } from "@/hooks/useCrudPage";
import { TableAction } from "@/components/table/datatable-types";
import { FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";

const NodesPage = () => {
  
  const {
    data: nodesData,
    totalCount,
    isLoading,
    error,
    refetch,
    pagination,
    search,
    filters,
    modal,
    actions: crudActions,
    deleteModal,
  } = useCrudPage({
    tableName: "nodes",
    relations: [
      "node_type:node_type_id(name)",
      "ring:ring_id(name)",
      "maintenance_terminal:maintenance_terminal_id(name)"
    ],
    searchColumn: 'name',
  });

  const supabase = createClient();
  const { data: nodeTypesData = [] } = useTableQuery(supabase, "lookup_types", {
    filters: { category: 'NODE_TYPES', name: { operator: 'neq', value: 'DEFAULT' } },
    orderBy: [{ column: 'name' }]
  });

  const nodeTypes = useMemo(() => 
    (nodeTypesData as { id: string; name: string }[]).map(nt => ({ id: nt.id, name: nt.name })),
    [nodeTypesData]
  );
  
  const columns = useMemo(() => getNodesTableColumns(), []);

  const tableActions = useMemo<TableAction<'nodes'>[]>(() => [
    { key: "edit", label: "Edit", icon: <FiEdit2 />, onClick: (record) => modal.openEditModal(record) },
    { key: "activate", label: "Activate", icon: <FiToggleRight />, hidden: (r) => !!r.status, onClick: (r) => crudActions.handleToggleStatus(r) },
    { key: "deactivate", label: "Deactivate", icon: <FiToggleLeft />, hidden: (r) => !r.status, onClick: (r) => crudActions.handleToggleStatus(r) },
    { key: "delete", label: "Delete", icon: <FiTrash2 />, variant: "danger", onClick: (r) => crudActions.handleDelete(r) },
  ], [modal, crudActions]);
  
  if (error) {
    return <ErrorDisplay error={error.message} actions={[
      {
        label: "Retry",
        onClick: refetch,
        variant: "primary",
      },
    ]} />;
  }

  return (
    <div className="mx-auto space-y-4">
      <NodesHeader
        onRefresh={refetch}
        onAddNew={modal.openAddModal}
        isLoading={isLoading}
        totalCount={totalCount}
      />

      <DataTable
        tableName="nodes"
        data={nodesData as Row<"nodes">[]}
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
              selectedNodeType={filters.filters.node_type_id as string | undefined}
              onNodeTypeChange={(value) => filters.setFilters(prev => ({ ...prev, node_type_id: value }))}
            />
        }
      />

      {modal.isModalOpen && (
          <NodeFormModal
            isOpen={modal.isModalOpen}
            onClose={modal.closeModal}
            editingNode={modal.editingRecord as NodeRow | null}
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