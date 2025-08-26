// app/dashboard/rings/page.tsx
"use client";

import React, { useMemo } from "react";
import { DataTable } from "@/components/table/DataTable";
import { useTableWithRelations } from "@/hooks/database";
import { RingsFilters } from "@/components/rings/RingsFilters";
import { RingModal } from "@/components/rings/RingModal";
import { ConfirmModal } from "@/components/common/ui";
import { createStandardActions } from "@/components/table/action-helpers";
import {
  PageHeader,
  useStandardHeaderActions,
} from "@/components/common/PageHeader";
import { GiLinkedRings } from "react-icons/gi";
import { toast } from "sonner";
import { RingsColumns } from "@/config/table-columns/RingsTableColumns";
import { createClient } from "@/utils/supabase/client";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";
import { desiredRingColumnOrder } from "@/config/column-orders";
import {
  DataQueryHookParams,
  DataQueryHookReturn,
  useCrudManager,
} from "@/hooks/useCrudManager";
import { RingRowsWithRelations } from "@/types/relational-row-types";

// 1. ADAPTER HOOK: Makes `useRingsData` compatible with `useCrudManager`
const useRingsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<RingRowsWithRelations> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();

  const { data, isLoading, error, refetch } = useTableWithRelations(
    supabase,
    "rings",
    [
      "ring_type:ring_type_id(id, code)",
      "maintenance_terminal:maintenance_terminal_id(id,name)",
    ],
    {
      filters: {
        name: { operator: "ilike", value: `%${searchQuery}%` },
        ...filters,
      },
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
      includeCount: true, // This will include the total count
      orderBy: [{ column: "name", ascending: true }],
    }
  );

  // Calculate counts from the full dataset
  const totalCount = data?.[0].total_count || 0;

  return {
    data: data || [],
    totalCount,
    isLoading,
    error,
    refetch,
  };
};

const RingsPage = () => {
  // 2. USE THE CRUD MANAGER with the adapter hook and both generic types
  const {
    data: rings,
    totalCount,
    isLoading,
    // isMutating,
    // error,
    refetch,
    pagination,
    search,
    // filters,
    editModal,
    viewModal,
    // bulkActions,
    deleteModal,
    actions: crudActions,
  } = useCrudManager<"rings", RingRowsWithRelations>({
    tableName: "rings",
    dataQueryHook: useRingsData,
  });

  // 3. Extract ring types from the rings data
  const ringTypes = useMemo(() => {
    const uniqueRingTypes = new Map();
    rings.forEach((ring) => {
      if (ring.ring_type && ring.ring_type_id) {
        uniqueRingTypes.set(ring.ring_type_id, {
          id: ring.ring_type_id,
          name: ring.ring_type.code,
        });
      }
    });
    return Array.from(uniqueRingTypes.values());
  }, [rings]);

  // 4. Extract maintenance areas from the rings data
  const maintenanceAreas = useMemo(() => {
    const uniqueMaintenanceAreas = new Map();
    rings.forEach((ring) => {
      if (ring.maintenance_terminal && ring.maintenance_terminal_id) {
        uniqueMaintenanceAreas.set(ring.maintenance_terminal_id, {
          id: ring.maintenance_terminal_id,
          name: ring.maintenance_terminal.name,
        });
      }
    });
    return Array.from(uniqueMaintenanceAreas.values());
  }, [rings]);

  const columns = RingsColumns();
  const orderedColumns = [
    ...desiredRingColumnOrder
      .map((k) => columns.find((c) => c.key === k))
      .filter(Boolean),
    ...columns.filter((c) => !desiredRingColumnOrder.includes(c.key)),
  ];

  // --- tableActions ---
  const tableActions = useMemo(
    () =>
      createStandardActions<RingRowsWithRelations>({
        onEdit: editModal.openEdit,
        onView: viewModal.open,
        onDelete: crudActions.handleDelete,
        // You can also add custom logic, for example:
        // canDelete: (record) => record.name !== 'CRITICAL_RING',
      }),
    [
      editModal.openEdit,
      viewModal.open,
      crudActions.handleDelete,
    ]
  );

  const { activeCount, inactiveCount } = (rings || []).reduce(
    (acc, ring) => {
      if (ring.status) acc.activeCount++;
      else acc.inactiveCount++;
      return acc;
    },
    { activeCount: 0, inactiveCount: 0 }
  );

  // --- Define header content using the hook ---
  const headerActions = useStandardHeaderActions({
    onRefresh: async () => {
      await refetch();
      toast.success("Refreshed successfully!");
    },
    onAddNew: editModal.openAdd,
    isLoading: isLoading,
    exportConfig: { tableName: "rings" },
  });

  const headerStats = [
    { value: totalCount, label: "Total Rings" },
    {
      value: activeCount,
      label: "Active",
      color: "success" as const,
    },
    {
      value: inactiveCount,
      label: "Inactive",
      color: "danger" as const,
    },
  ];

  return (
    <div className="mx-auto space-y-4">
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
        tableName="rings"
        data={rings}
        columns={orderedColumns as Column<RingRowsWithRelations>[]}
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
        customToolbar={
          <RingsFilters
            searchQuery={search.searchQuery}
            onSearchChange={search.setSearchQuery}
          />
        }
      />

      <RingModal
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        editingRing={editModal.record as RingRowsWithRelations | null}
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
