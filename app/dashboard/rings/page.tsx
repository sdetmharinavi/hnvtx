// app/dashboard/rings/page.tsx
"use client";

import React, { useMemo } from "react";
import { DataTable } from "@/components/table/DataTable";
import { Row, usePagedRingsWithCount } from "@/hooks/database";
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
import { desiredRingColumnOrder } from "@/config/column-orders";
import {
  DataQueryHookParams,
  DataQueryHookReturn,
  useCrudManager,
} from "@/hooks/useCrudManager";
import { RingRowsWithRelations } from "@/types/relational-row-types";
import { RingTypeRowsWithCount } from "@/types/view-row-types";

// 1. ADAPTER HOOK: Makes `useRingsData` compatible with `useCrudManager`
const useRingsData = (
  params: DataQueryHookParams
): DataQueryHookReturn<RingTypeRowsWithCount> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();

  const { data, isLoading, error, refetch } = usePagedRingsWithCount(
    supabase,
    {
      filters: {
        ...filters,
        ...(searchQuery ? { name: searchQuery } : {}),
      },
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
      // queryOptions: {
      //   enabled: true,
      //   refetchOnWindowFocus: false,
      //   refetchOnMount: true,
      //   refetchInterval: 0,
      //   refetchIntervalInBackground: false,
      //   staleTime: 3 * 60 * 1000,
      // }
    }
  );

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

const RingsPage = () => {
  // 2. USE THE CRUD MANAGER with the adapter hook and both generic types
  const {
    data: rings,
    totalCount,
    activeCount,
    inactiveCount,
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
  } = useCrudManager<"rings", RingTypeRowsWithCount>({
    tableName: "rings",
    dataQueryHook: useRingsData,
  });

  // 3. Extract ring types from the rings data
  const ringTypes = useMemo(() => {
    const uniqueRingTypes = new Map();
    console.log("rings", rings);
    rings.forEach((ring) => {
      if (ring.ring_type_code) {
        uniqueRingTypes.set(ring.ring_type_id, {
          id: ring.ring_type_id,
          name: ring.ring_type_code,
        });
      }
    });
    return Array.from(uniqueRingTypes.values());
  }, [rings]);

  // 4. Extract maintenance areas from the rings data
  const maintenanceAreas = useMemo(() => {
    const uniqueMaintenanceAreas = new Map();
    rings.forEach((ring) => {
      if (ring.maintenance_area_area_type_id && ring.maintenance_terminal_id) {
        uniqueMaintenanceAreas.set(ring.maintenance_terminal_id, {
          id: ring.maintenance_terminal_id,
          name: ring.maintenance_area_name,
        });
      }
    });
    return Array.from(uniqueMaintenanceAreas.values());
  }, [rings]);

  const columns = RingsColumns(rings);
  // Type guard to remove undefined from the mapped array
  const notUndefined = <T,>(x: T | undefined): x is T => x !== undefined;
  const orderedColumns = [
    ...desiredRingColumnOrder
      .map((k) => columns.find((c) => c.key === k))
      .filter(notUndefined),
    ...columns.filter((c) => !desiredRingColumnOrder.includes(c.key)),
  ];

  // --- tableActions ---
  const tableActions = useMemo(
    () =>
      createStandardActions<RingTypeRowsWithCount>({
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

  

  // --- Define header content using the hook ---
  const headerActions = useStandardHeaderActions({
    data: rings as Row<"rings">[],
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
        tableName="v_rings_with_count"
        data={rings}
        columns={orderedColumns}
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
