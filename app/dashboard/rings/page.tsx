// app/dashboard/rings/page.tsx
"use client";

import React, { useMemo } from "react";
import { DataTable } from "@/components/table/DataTable";
import { Row } from "@/hooks/database";
import { getRingsTableColumns } from "@/components/rings/RingsTableColumns";
import { RingsFilters } from "@/components/rings/RingsFilters";
import { FiEdit2, FiTrash2, FiToggleLeft, FiToggleRight } from "react-icons/fi";
import { RingModal, RingRow } from "@/components/rings/RingModal";
import { RingsHeader } from "@/components/rings/RingsHeader";
import { useCrudPage } from "@/hooks/useCrudPage";
import { ConfirmModal } from "@/components/common/ui";
import { TableAction } from "@/components/table/datatable-types";

const RingsPage = () => {
  const {
    data: ringsData,
    totalCount,
    isLoading,
    refetch,
    pagination,
    search,
    modal,
    actions: crudActions,
    deleteModal, // Destructure the delete modal state
  } = useCrudPage({
    tableName: "rings",
    relations: [
      "ring_type:ring_type_id(id, code)", 
      "maintenance_terminal:maintenance_terminal_id(id,name)"
    ],
    searchColumn: 'name',
  });

  const columns = useMemo(() => getRingsTableColumns(), []);

  const tableActions = useMemo<TableAction<'rings'>[]>(() => [
    { 
      key: "edit", 
      label: "Edit", 
      icon: <FiEdit2 />, 
      onClick: (record) => modal.openEditModal(record) 
    },
    { 
      key: "activate", 
      label: "Activate", 
      icon: <FiToggleRight />, 
      hidden: (r) => Boolean(r.status), 
      onClick: (r) => crudActions.handleToggleStatus(r) 
    },
    { 
      key: "deactivate", 
      label: "Deactivate", 
      icon: <FiToggleLeft />, 
      hidden: (r) => !r.status, 
      onClick: (r) => crudActions.handleToggleStatus(r) 
    },
    { 
      key: "delete", 
      label: "Delete", 
      icon: <FiTrash2 />, 
      variant: "danger" as const, 
      onClick: (r) => crudActions.handleDelete(r) 
    },
  ], [modal, crudActions]);


  return (
    <div className='mx-auto space-y-4'>
      {/* Header */}
      <RingsHeader onRefresh={refetch} onAddNew={modal.openAddModal} isLoading={isLoading} totalCount={totalCount} />

      {/* Table */}
      <DataTable
        tableName='rings'
        data={ringsData as Row<'rings'>[]}
        columns={columns}
        loading={isLoading}
        actions={tableActions}
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
        customToolbar={<RingsFilters searchQuery={search.searchQuery} onSearchChange={search.setSearchQuery} />}
      />

      <RingModal
        isOpen={modal.isModalOpen}
        onClose={modal.closeModal}
        editingRing={modal.editingRecord as RingRow | null}
        onCreated={crudActions.handleSave}
        onUpdated={crudActions.handleSave}
      />

      {/* Render the confirmation modal, driven by the hook's state */}
      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.confirm}
        onCancel={deleteModal.cancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        showIcon
        loading={deleteModal.isLoading}
      />
    </div>
  );
};

export default RingsPage;
