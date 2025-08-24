"use client";

import React, { useMemo, useState, useCallback } from "react";
import { FiDownload, FiPlus } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { useTableInsert, useTableUpdate, useToggleStatus, useTableQuery, useTableBulkOperations, usePagedOfcCablesComplete } from "@/hooks/database";
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
import { OfcCablesFilters, OfcCablesWithRelations } from "@/components/ofc/ofc-types";
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { toast } from "sonner";

const OfcPage = () => {
  const supabase = createClient();
  const router = useRouter();

  // --- STATE MANAGEMENT (Mimicking useCrudPage) ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [filters, setFilters] = useState<OfcCablesFilters>({ search: "", ofc_type_id: "", status: "", maintenance_terminal_id: "" });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<OfcCablesWithRelations | null>(null);
  const [viewingRecordId, setViewingRecordId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [debouncedSearch] = useDebounce("", 400);

  // --- FILTERS ---
  const serverFilters = useMemo(() => {
    const combinedFilters: Record<string, Json | string | boolean> = {};
    if (debouncedSearch) combinedFilters.search = debouncedSearch; // RPC handles 'search' as a special ILIKE term
    if (filters.ofc_type_id) combinedFilters.ofc_type_id = filters.ofc_type_id;
    if (filters.status) combinedFilters.status = filters.status === 'true';
    if (filters.maintenance_terminal_id) combinedFilters.maintenance_terminal_id = filters.maintenance_terminal_id;
    return combinedFilters;
  }, [filters, debouncedSearch]);
  
  // --- DATA FETCHING (Specialized Hooks) ---
  const { data: pagedOfcData, isLoading, error, refetch } = usePagedOfcCablesComplete(supabase, {
    limit: pageLimit,
    offset: (currentPage - 1) * pageLimit,
    filters: serverFilters,
  });

  const ofcData = useMemo(() => pagedOfcData || [], [pagedOfcData]);
  const totalCount = ofcData[0]?.total_count ?? 0;
  const activeCount = ofcData[0]?.active_count ?? ofcData.filter(c => c.status).length;
  const inactiveCount = ofcData[0]?.inactive_count ?? ofcData.filter(c => !c.status).length;

  const { data: ofcTypes = [] } = useTableQuery(supabase, "lookup_types", { filters: { category: { operator: "eq", value: "OFC_TYPES" } }});
  const { data: maintenanceAreas = [] } = useTableQuery(supabase, "maintenance_areas");
  const { data: isSuperAdmin } = useIsSuperAdmin();

  // --- MUTATIONS ---
  const { mutate: insertOfcCable, isPending: isInserting } = useTableInsert(supabase, "ofc_cables", { onSuccess: () => { refetch(); closeModal(); toast.success("OFC Cable created."); }});
  const { mutate: updateOfcCable, isPending: isUpdating } = useTableUpdate(supabase, "ofc_cables", { onSuccess: () => { refetch(); closeModal(); toast.success("OFC Cable updated."); }});
  const { mutate: toggleStatus } = useToggleStatus(supabase, "ofc_cables", { onSuccess: () => { refetch(); toast.success("OFC Cable status toggled."); }});
  const deleteManager = useDeleteManager({ tableName: "ofc_cables", onSuccess: refetch });
  const { bulkDelete, bulkUpdate } = useTableBulkOperations(supabase, "ofc_cables");
  
  const isMutating = isInserting || isUpdating || deleteManager.isPending || bulkDelete.isPending || bulkUpdate.isPending;

  // --- HANDLERS ---
  const closeModal = useCallback(() => { setIsModalOpen(false); setEditingRecord(null); }, []);
  const handleSave = (data: TablesInsert<"ofc_cables">) => {
    if (editingRecord) {
      updateOfcCable({ id: editingRecord.id!, data });
    } else {
      insertOfcCable(data);
    }
  };
  
  const handleBulkDelete = useCallback(() => {
    if (!window.confirm(`Delete ${selectedIds.length} selected cable(s)?`)) return;
    bulkDelete.mutate({ ids: selectedIds }, {
      onSuccess: () => { setSelectedIds([]); refetch(); toast.success(`${selectedIds.length} cables deleted.`); },
      onError: (err) => toast.error(`Bulk delete failed: ${err.message}`),
    });
  }, [selectedIds, bulkDelete, refetch]);

  const handleBulkUpdateStatus = useCallback((status: "active" | "inactive") => {
    const updates = selectedIds.map(id => ({ id, data: { status: status === 'active' } as TablesUpdate<"ofc_cables"> }));
    bulkUpdate.mutate({ updates }, {
      onSuccess: () => { setSelectedIds([]); refetch(); toast.success(`${selectedIds.length} cables updated.`); },
      onError: (err) => toast.error(`Bulk status update failed: ${err.message}`),
    });
  }, [selectedIds, bulkUpdate, refetch]);

  // --- MEMOIZED VALUES ---
  const columns = useDynamicColumnConfig("v_ofc_cables_complete", { /* ... your overrides ... */ });

  const tableActions = useMemo(() => GetOfcTableActions({
    onView: (id) => router.push(`/dashboard/ofc/${id}`),
    onEdit: (id) => {
      const record = ofcData.find(c => c.id === id);
      if (record) { setEditingRecord(record as OfcCablesWithRelations); setIsModalOpen(true); }
    },
    onToggleStatus: (record) => toggleStatus({ id: record.id!, status: !record.status }),
    onDelete: (id, name) => deleteManager.deleteSingle({ id, name: name || "OFC Cable" }),
    isSuperAdmin: isSuperAdmin || false,
  }), [ofcData, isSuperAdmin, toggleStatus, deleteManager, router]);

  if (error) {
    return <ErrorDisplay error={error.message} actions={
      [
        {
          label: "Retry",
          onClick: refetch,
          variant: "primary",
        }
      ]
    } />;
  }

  return (
    <div className="mx-auto space-y-6 p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-white">OFC Cable Management</h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" leftIcon={<FiDownload />}>Export</Button>
          <Button onClick={() => setIsModalOpen(true)} leftIcon={<FiPlus />}>Add OFC Cable</Button>
        </div>
      </div>
      
      <OfcStats total={totalCount} active={activeCount} inactive={inactiveCount} />

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
        onRowSelect={(rows) => setSelectedIds(rows.map(r => r.id!).filter(Boolean))}
        searchable={false}
        filterable={false}
        pagination={{
          current: currentPage,
          pageSize: pageLimit,
          total: totalCount,
          showSizeChanger: true,
          onChange: (page, limit) => { setCurrentPage(page); setPageLimit(limit); },
        }}
        customToolbar={
          <OfcFilters
            filters={filters}
            onFiltersChange={(newFilters) => setFilters(prev => ({ ...prev, ...newFilters }))}
            maintenanceAreas={maintenanceAreas as Row<"maintenance_areas">[]}
            ofcTypes={ofcTypes}
            onFilterToggle={() => setShowFilters(p => !p)}
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
          onEdit={() => {
            const record = ofcData.find(c => c.id === viewingRecordId);
            if (record) { setEditingRecord(record as OfcCablesWithRelations); setIsModalOpen(true); }
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