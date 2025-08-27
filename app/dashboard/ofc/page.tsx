"use client";

import React, { useMemo, useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { usePagedOfcCablesComplete } from "@/hooks/database";
import { useIsSuperAdmin } from "@/hooks/useAdminUsers";
import { useRouter } from "next/navigation";

import { DataTable } from "@/components/table/DataTable";
import { Row } from "@/hooks/database";
import { ConfirmModal, ErrorDisplay } from "@/components/common/ui";
import { OfcFilters } from "@/components/ofc/OfcFilters";
import OfcForm from "@/components/ofc/OfcForm/OfcForm";
import {
  OfcCablesFilters,
  OfcCablesWithRelations,
} from "@/components/ofc/ofc-types";
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { toast } from "sonner";
import {
  PageHeader,
  useStandardHeaderActions,
} from "@/components/common/PageHeader";
import { AiFillMerge } from "react-icons/ai";
import { createStandardActions } from "@/components/table/action-helpers";
import { BulkActions } from "@/components/common/BulkActions";
import {
  DataQueryHookParams,
  DataQueryHookReturn,
  useCrudManager,
} from "@/hooks/useCrudManager";
import { OfcCableRowsWithCount } from "@/types/view-row-types";

// 1. ADAPTER HOOK: Makes `useOfcData` compatible with `useCrudManager`
const useOfcData = (
  params: DataQueryHookParams
): DataQueryHookReturn<OfcCableRowsWithCount> => {
  const { currentPage, pageLimit, filters, searchQuery } = params;
  const supabase = createClient();

  const { data, isLoading, error, refetch } = usePagedOfcCablesComplete(
    supabase,
    {
      filters: {
        ...filters,
        ...(searchQuery ? { name: searchQuery } : {}),
      },
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
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

const OfcPage = () => {
  // 2. USE THE CRUD MANAGER with the adapter hook and both generic types
  const {
    data: ofcData,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isMutating,
    error,
    refetch,
    pagination,
    search,
    filters: crudFilters,
    editModal,
    // viewModal,
    bulkActions,
    deleteModal,
    actions: crudActions,
  } = useCrudManager<"ofc_cables", OfcCableRowsWithCount>({
    tableName: "ofc_cables",
    dataQueryHook: useOfcData,
    searchColumn: "route_name",
  });

  // 3. Extract ring types from the rings data
  const ofcTypes = useMemo(() => {
    const uniqueOfcTypes = new Map();
    console.log("ofcData", ofcData);
    ofcData.forEach((ofc) => {
      if (ofc.ofc_type_code) {
        uniqueOfcTypes.set(ofc.ofc_type_id, {
          id: ofc.ofc_type_id,
          name: ofc.ofc_type_code,
        });
      }
    });
    return Array.from(uniqueOfcTypes.values());
  }, [ofcData]);

  const maintenanceAreas = useMemo(() => {
    const uniqueMaintenanceAreas = new Map();
    console.log("ofcData", ofcData);
    ofcData.forEach((ofc) => {
      if (ofc.maintenance_area_code) {
        uniqueMaintenanceAreas.set(ofc.maintenance_terminal_id, {
          id: ofc.maintenance_terminal_id,
          name: ofc.maintenance_area_code,
        });
      }
    });
    return Array.from(uniqueMaintenanceAreas.values());
  }, [ofcData]);

  const supabase = createClient();
  const router = useRouter();
  const [showFilters, setShowFilters] = useState(false);
  const { data: isSuperAdmin } = useIsSuperAdmin();

  // --- MEMOIZED VALUES ---
  const columns = useDynamicColumnConfig("v_ofc_cables_complete", {
    /* ... your overrides ... */
    data: ofcData,
  });

  const tableActions = useMemo(
    () =>
      createStandardActions({
        onEdit: editModal.openEdit,
        onView: (record) => router.push(`/dashboard/ofc/${record.id}`),
        onDelete: crudActions.handleDelete,
        onToggleStatus: crudActions.handleToggleStatus,
        canDelete: () => isSuperAdmin === true,
      }),
    [crudActions, editModal.openEdit, router, isSuperAdmin]
  );

  const headerStats = [
    { value: totalCount, label: "Total OFC Cables" },
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

  const headerActions = useStandardHeaderActions({
    onRefresh: async () => {
      await refetch();
      toast.success("Refreshed successfully!");
    },
    onAddNew: editModal.openAdd,
    isLoading: isLoading,
    exportConfig: { tableName: "ofc_cables" },
  });

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
    <div className="mx-auto space-y-6 p-4 md:p-6">
      <PageHeader
        title="OFC Cable Management"
        description="Manage OFC cables and their related information."
        icon={<AiFillMerge />}
        stats={headerStats}
        actions={headerActions} // <-- Pass the generated actions
        isLoading={isLoading}
      />
      <BulkActions
        selectedCount={bulkActions.selectedCount}
        isOperationLoading={isMutating}
        onBulkDelete={() => bulkActions.handleBulkDelete()}
        onBulkUpdateStatus={bulkActions.handleBulkUpdateStatus}
        onClearSelection={bulkActions.handleClearSelection}
        entityName="ofc cable"
        showStatusUpdate={true}
        canDelete={() => isSuperAdmin === true}
      />

      <DataTable
        tableName="v_ofc_cables_complete"
        data={ofcData}
        columns={columns}
        loading={isLoading}
        actions={tableActions}
        selectable
        onRowSelect={(selectedRows:OfcCableRowsWithCount[]): void => {
          // Update selection with new row IDs
          bulkActions.handleRowSelect(selectedRows as never);
        }}
        searchable={false}
        filterable={false}
        pagination={{
          current: pagination.currentPage,
          pageSize: pagination.pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, limit) => {
            pagination.setCurrentPage(page);
            pagination.setPageLimit(limit);
          },
        }}
        customToolbar={
          <OfcFilters
            filters={crudFilters.filters as OfcCablesFilters}
            onFiltersChange={(newFilters) =>
              crudFilters.setFilters((prev) => ({ ...prev, ...newFilters }))
            }
            maintenanceAreas={maintenanceAreas as Row<"maintenance_areas">[]}
            ofcTypes={ofcTypes}
            onFilterToggle={() => setShowFilters((p) => !p)}
            showFilters={showFilters}
          />
        }
      />

      <OfcForm
        isOpen={editModal.isOpen}
        onClose={editModal.close}
        onCreated={crudActions.handleSave}
        onUpdated={crudActions.handleSave}
        ofcCable={editModal.record as OfcCablesWithRelations | null}
        pageLoading={isMutating}
      />

      <ConfirmModal
        isOpen={deleteModal.isOpen}
        onConfirm={deleteModal.confirm}
        onCancel={deleteModal.cancel}
        title="Confirm Deletion"
        message={deleteModal.message}
        type="danger"
        loading={deleteModal.isLoading}
      />
    </div>
  );
};

export default OfcPage;
