// app/dashboard/nodes/page.tsx
"use client"

import React, { useCallback, useMemo, useEffect } from "react";
import { DataTable } from "@/components/table/DataTable";
import { NodesHeader } from "@/components/nodes/NodesHeader";
import { NodesFilters } from "@/components/nodes/NodesFilters";
import { getNodesTableColumns } from "@/components/nodes/NodesTableColumns";
import { NodeFormModal } from "@/components/nodes/NodeFormModal";
import { ConfirmModal } from "@/components/common/ui/Modal";
import { Row } from "@/hooks/database";

import { 
  useNodesPageState, 
  useNodesData, 
  useNodesMutations,
  useNodesTableActions 
} from "@/components/nodes/hooks";

const NodesPageContent: React.FC = () => {
  const state = useNodesPageState();
  
  const {
    searchTerm,
    currentPage,
    pageLimit,
    filters,
    isFormOpen,
    editingNode,
    setSearchTerm,
    resetPagination,
    openCreateForm,
    openEditForm,
    closeForm,
    updateFilters,
    updatePagination,
  } = state;

  // Data management
  const {
    nodesQuery,
    allNodes,
    totalCount,
    filteredNodeTypes,
    debouncedSearchTerm,
  } = useNodesData({
    filters,
    searchTerm,
    currentPage,
    pageLimit,
  });

  // Mutations
  const {
    toggleStatusMutation,
    deleteManager,
  } = useNodesMutations({
    onSuccess: closeForm,
    refetchNodes: nodesQuery.refetch,
  });

  // Table actions
  const actions = useNodesTableActions({
    onEdit: openEditForm,
    onToggleStatus: (id: string, status: boolean) => 
      toggleStatusMutation.mutate({ id, status }),
    onDelete: (id: string, name: string) => 
      deleteManager.deleteSingle({ id, name }),
  });

  // Table columns
  const columns = useMemo(() => getNodesTableColumns(), []);

  // Reset to first page when search changes
  useEffect(() => {
    resetPagination();
  }, [debouncedSearchTerm, resetPagination]);

  // Event handlers
  const handleNodeTypeChange = useCallback((nodeType: string | null) => {
    updateFilters({ nodeType: nodeType ?? "" });
  }, [updateFilters]);

  const onCreated = useCallback((node: any) => {
    nodesQuery.refetch();
    closeForm();
  }, [nodesQuery, closeForm]);

  const onUpdated = useCallback((node: any) => {
    nodesQuery.refetch();
    closeForm();
  }, [nodesQuery, closeForm]);

  // Custom toolbar
  const customToolbar = useMemo(
    () => (
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
        <NodesFilters
          searchQuery={searchTerm}
          onSearchChange={setSearchTerm}
          nodeTypes={filteredNodeTypes}
          selectedNodeType={filters.nodeType ?? ""}
          onNodeTypeChange={handleNodeTypeChange}
        />
      </div>
    ),
    [searchTerm, setSearchTerm, filteredNodeTypes, filters.nodeType, handleNodeTypeChange]
  );

  return (
    <div className="mx-auto space-y-4">
      <NodesHeader
        onRefresh={nodesQuery.refetch}
        onAddNew={openCreateForm}
        isLoading={nodesQuery.isLoading}
        totalCount={totalCount}
      />

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <DataTable
          tableName="nodes"
          data={allNodes as unknown as Row<"nodes">[]}
          columns={columns}
          loading={nodesQuery.isLoading}
          pagination={{
            current: currentPage,
            pageSize: pageLimit,
            total: totalCount,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: updatePagination,
          }}
          actions={actions}
          selectable={false}
          exportable={false}
          searchable={false}
          filterable={true}
          customToolbar={customToolbar}
        />
      </div>

      {isFormOpen && (
        <NodeFormModal
          isOpen={isFormOpen}
          onClose={closeForm}
          editingNode={editingNode}
          onCreated={onCreated}
          onUpdated={onUpdated}
        />
      )}

      <ConfirmModal
        isOpen={deleteManager.isConfirmModalOpen}
        onConfirm={deleteManager.handleConfirm}
        onCancel={deleteManager.handleCancel}
        title="Confirm Deletion"
        message={deleteManager.confirmationMessage}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        showIcon
        closeOnBackdrop
        closeOnEscape
        loading={deleteManager.isPending}
        size="md"
      />
    </div>
  );
};

export default NodesPageContent;
