// app/dashboard/rings/page.tsx
"use client";

import React, { useMemo } from "react";
import { DataTable } from "@/components/table/DataTable";
import { Row } from "@/hooks/database";
import { RingsFilters } from "@/components/rings/RingsFilters";
import { RingModal, RingRow } from "@/components/rings/RingModal";
import { useCrudPage } from "@/hooks/useCrudPage";
import { ConfirmModal } from "@/components/common/ui";
import { createStandardActions } from "@/components/table/action-helpers";
import { PageHeader, useStandardHeaderActions } from "@/components/common/PageHeader";
import { GiLinkedRings } from "react-icons/gi";
import { toast } from "sonner";
import { RingsColumns } from "@/components/table-columns/RingsTableColumns";
import { Database } from "@/types/supabase-types";
import { createClient } from "@/utils/supabase/client";
import { useTableQuery } from "@/hooks/database";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import { desiredRingColumnOrder } from "@/config/column-orders";

export type RingData = Database["public"]["Tables"]["rings"]["Row"];

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
    deleteModal,
  } = useCrudPage({
    tableName: "rings",
    relations: [
      "ring_type:ring_type_id(id, code)", 
      "maintenance_terminal:maintenance_terminal_id(id,name)"
    ],
    searchColumn: 'name',
  });

  // Fetch lookup lists here and pass to modal
  const supabase = createClient();
  const { data: ringTypes = [] } = useTableQuery(supabase, "lookup_types", {
    columns: "id,name,code",
    filters: { category: { operator: "eq", value: "RING_TYPES" }, name: { operator: "neq", value: "DEFAULT" } },
    orderBy: [{ column: "name", ascending: true }],
  });
  const { data: maintenanceAreas = [] } = useTableQuery(supabase, "maintenance_areas", {
    columns: "id,name,code",
    filters: { status: { operator: "eq", value: true } },
    orderBy: [{ column: "name", ascending: true }],
  });

  const columns = RingsColumns();
  const orderedColumns = [...desiredRingColumnOrder.map((k) => columns.find((c) => c.key === k)).filter(Boolean), ...columns.filter((c) => !desiredRingColumnOrder.includes(c.key))];

   // --- tableActions ---
   const tableActions = useMemo(() => createStandardActions<RingData>({
    onEdit: modal.openEditModal,
    onToggleStatus: crudActions.handleToggleStatus,
    onDelete: crudActions.handleDelete,
    // You can also add custom logic, for example:
    // canDelete: (record) => record.name !== 'CRITICAL_RING', 
  }), [modal.openEditModal, crudActions.handleToggleStatus, crudActions.handleDelete]);

  // --- Define header content using the hook ---
  const headerActions = useStandardHeaderActions({
    onRefresh: async () => {
      await refetch();
      toast.success("Refreshed successfully!");
    },
    onAddNew: modal.openAddModal,
    isLoading: isLoading,
    exportConfig: { tableName: "rings" }
  });

  const headerStats = [
    { value: totalCount, label: "Total Rings" },
    { value: ringsData.filter(r => r.status).length, label: "Active", color: 'success' as const },
    { value: ringsData.filter(r => !r.status).length, label: "Inactive", color: 'danger' as const },
  ];


  return (
    <div className='mx-auto space-y-4'>
      {/* Header */}
      <PageHeader
        title="Ring Management"
        description="Manage network rings and their related information."
        icon={<GiLinkedRings />}
        stats={headerStats}
        actions={headerActions} // <-- Pass the generated actions
        isLoading={isLoading}
      />

      {/* Table */}
      <DataTable
        tableName='rings'
        data={ringsData as Row<'rings'>[]}
        columns={orderedColumns as Column<Row<'rings'>>[]}
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
        ringTypes={ringTypes}
        maintenanceAreas={maintenanceAreas}
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

