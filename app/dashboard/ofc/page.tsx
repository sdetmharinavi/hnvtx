"use client";

import React, { useMemo, useState, useCallback } from "react";
import { FiDownload, FiPlus } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import {
  useTableInsert,
  useTableUpdate,
  useToggleStatus,
  useTableQuery,
  useTableBulkOperations,
  usePagedOfcCablesComplete,
} from "@/hooks/database";
import { useDeleteManager } from "@/hooks/useDeleteManager";
import { useIsSuperAdmin } from "@/hooks/useAdminUsers";
import { useRouter } from "next/navigation";
import { useDebounce } from "use-debounce";

import { DataTable } from "@/components/table/DataTable";
import { Row } from "@/hooks/database";
import { Button, ConfirmModal, ErrorDisplay } from "@/components/common/ui";
import { BulkActions } from "@/components/ofc/BulkActions";
import { OfcStats } from "@/components/ofc/OfcStats";
import { GetOfcTableActions } from "@/components/ofc/OfcTableActions";
import { OfcFilters } from "@/components/ofc/OfcFilters";
import OfcForm from "@/components/ofc/OfcForm";
import OfcDetailsModal from "@/components/ofc/OfcDetailsModal";
import { Json, TablesInsert, TablesUpdate } from "@/types/supabase-types";
import {
  OfcCablesFilters,
  OfcCablesWithRelations,
} from "@/components/ofc/ofc-types";
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { toast } from "sonner";
import { DEFAULTS } from "@/config/constants";
import {
  PageHeader,
  useStandardHeaderActions,
} from "@/components/common/PageHeader";
import { AiFillMerge } from "react-icons/ai";

const OfcPage = () => {
  const supabase = createClient();
  const router = useRouter();

  // --- STATE MANAGEMENT (Mimicking useCrudPage) ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(DEFAULTS.PAGE_SIZE);
  const [filters, setFilters] = useState<OfcCablesFilters>({
    search: "",
    ofc_type_id: "",
    status: "",
    maintenance_terminal_id: "",
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] =
    useState<OfcCablesWithRelations | null>(null);
  const [viewingRecordId, setViewingRecordId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearch] = useDebounce("", DEFAULTS.DEBOUNCE_DELAY);

  // --- FILTERS ---
  const serverFilters = useMemo(() => {
    const combinedFilters: Record<string, Json | string | boolean> = {};
    if (debouncedSearch) combinedFilters.search = debouncedSearch; // RPC handles 'search' as a special ILIKE term
    if (filters.ofc_type_id) combinedFilters.ofc_type_id = filters.ofc_type_id;
    if (filters.status) combinedFilters.status = filters.status === "true";
    if (filters.maintenance_terminal_id)
      combinedFilters.maintenance_terminal_id = filters.maintenance_terminal_id;
    return combinedFilters;
  }, [filters, debouncedSearch]);

  // --- DATA FETCHING (Specialized Hooks) ---
  const {
    data: pagedOfcData,
    isLoading,
    error,
    refetch,
  } = usePagedOfcCablesComplete(supabase, {
    limit: pageLimit,
    offset: (currentPage - 1) * pageLimit,
    filters: serverFilters,
  });

  const ofcData = useMemo(() => pagedOfcData || [], [pagedOfcData]);
  const totalCount = ofcData[0]?.total_count ?? 0;
  const activeCount =
    ofcData[0]?.active_count ?? ofcData.filter((c) => c.status).length;
  const inactiveCount =
    ofcData[0]?.inactive_count ?? ofcData.filter((c) => !c.status).length;

  const { data: ofcTypes = [] } = useTableQuery(supabase, "lookup_types", {
    filters: { category: { operator: "eq", value: "OFC_TYPES" } },
  });
  const { data: maintenanceAreas = [] } = useTableQuery(
    supabase,
    "maintenance_areas"
  );
  const { data: isSuperAdmin } = useIsSuperAdmin();

  // --- MUTATIONS ---
  const { mutate: insertOfcCable, isPending: isInserting } = useTableInsert(
    supabase,
    "ofc_cables",
    {
      onSuccess: () => {
        refetch();
        closeModal();
        toast.success("OFC Cable created.");
      },
    }
  );
  const { mutate: updateOfcCable, isPending: isUpdating } = useTableUpdate(
    supabase,
    "ofc_cables",
    {
      onSuccess: () => {
        refetch();
        closeModal();
        toast.success("OFC Cable updated.");
      },
    }
  );
  const { mutate: toggleStatus } = useToggleStatus(supabase, "ofc_cables", {
    onSuccess: () => {
      refetch();
      toast.success("OFC Cable status toggled.");
    },
  });
  const deleteManager = useDeleteManager({
    tableName: "ofc_cables",
    onSuccess: refetch,
  });
  const { bulkDelete, bulkUpdate } = useTableBulkOperations(
    supabase,
    "ofc_cables"
  );

  const isMutating =
    isInserting ||
    isUpdating ||
    deleteManager.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending;

  // --- HANDLERS ---
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingRecord(null);
  }, []);
  const handleSave = (data: TablesInsert<"ofc_cables">) => {
    if (editingRecord) {
      updateOfcCable({ id: editingRecord.id!, data });
    } else {
      insertOfcCable(data);
    }
  };

  const handleBulkDelete = useCallback(() => {
    if (!window.confirm(`Delete ${selectedIds.length} selected cable(s)?`))
      return;
    bulkDelete.mutate(
      { ids: selectedIds },
      {
        onSuccess: () => {
          setSelectedIds([]);
          refetch();
          toast.success(`${selectedIds.length} cables deleted.`);
        },
        onError: (err) => toast.error(`Bulk delete failed: ${err.message}`),
      }
    );
  }, [selectedIds, bulkDelete, refetch]);

  const handleBulkUpdateStatus = useCallback(
    (status: "active" | "inactive") => {
      const updates = selectedIds.map((id) => ({
        id,
        data: { status: status === "active" } as TablesUpdate<"ofc_cables">,
      }));
      bulkUpdate.mutate(
        { updates },
        {
          onSuccess: () => {
            setSelectedIds([]);
            refetch();
            toast.success(`${selectedIds.length} cables updated.`);
          },
          onError: (err) =>
            toast.error(`Bulk status update failed: ${err.message}`),
        }
      );
    },
    [selectedIds, bulkUpdate, refetch]
  );

  // --- MEMOIZED VALUES ---
  const columns = useDynamicColumnConfig("v_ofc_cables_complete", {
    /* ... your overrides ... */
    data: ofcData,
  });

  const tableActions = useMemo(
    () =>
      GetOfcTableActions({
        onView: (id) => router.push(`/dashboard/ofc/${id}`),
        onEdit: (id) => {
          const record = ofcData.find((c) => c.id === id);
          if (record) {
            setEditingRecord(record as OfcCablesWithRelations);
            setIsModalOpen(true);
          }
        },
        onToggleStatus: (record) =>
          toggleStatus({ id: record.id!, status: !record.status }),
        onDelete: (id, name) =>
          deleteManager.deleteSingle({ id, name: name || "OFC Cable" }),
        isSuperAdmin: isSuperAdmin || false,
      }),
    [ofcData, isSuperAdmin, toggleStatus, deleteManager, router]
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
    onAddNew: () => setIsModalOpen(true),
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
/>
      <BulkActions
        selectedCount={selectedIds.length}
        isOperationLoading={isMutating}
        onBulkDelete={handleBulkDelete}
        onBulkUpdateStatus={handleBulkUpdateStatus}
        onClearSelection={() => setSelectedIds([])}
      />

      <DataTable
        tableName="v_ofc_cables_complete"
        data={ofcData as Row<"v_ofc_cables_complete">[]}
        columns={columns}
        loading={isLoading}
        actions={tableActions}
        selectable
        onRowSelect={(rows) =>
          setSelectedIds(rows.map((r) => r.id!).filter(Boolean))
        }
        searchable={false}
        filterable={false}
        pagination={{
          current: currentPage,
          pageSize: pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, limit) => {
            setCurrentPage(page);
            setPageLimit(limit);
          },
        }}
        customToolbar={
          <OfcFilters
            filters={filters}
            onFiltersChange={(newFilters) =>
              setFilters((prev) => ({ ...prev, ...newFilters }))
            }
            maintenanceAreas={maintenanceAreas as Row<"maintenance_areas">[]}
            ofcTypes={ofcTypes}
            onFilterToggle={() => setShowFilters((p) => !p)}
            showFilters={showFilters}
          />
        }
      />

      {isModalOpen && (
        <OfcForm
          ofcCable={editingRecord}
          onSubmit={handleSave}
          onCancel={closeModal}
          pageLoading={isMutating}
        />
      )}

      {viewingRecordId && (
        <OfcDetailsModal
          ofcCableId={viewingRecordId}
          onClose={() => setViewingRecordId(null)}
          isOpen={viewingRecordId !== null}
          onEdit={() => {
            // Handle edit if needed
            setViewingRecordId(null);
          }}
        />
      )}

      <ConfirmModal
        isOpen={deleteManager.isConfirmModalOpen}
        onConfirm={deleteManager.handleConfirm}
        onCancel={deleteManager.handleCancel}
        title="Confirm Deletion"
        message={deleteManager.confirmationMessage}
        type="danger"
        loading={deleteManager.isPending}
      />
    </div>
  );
};

export default OfcPage;
