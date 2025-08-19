// app/dashboard/ofc/page.tsx
"use client";

// --- IMPORTS ---
import { useMemo, useState, useCallback, useEffect } from "react";
import { FiDownload, FiPlus } from "react-icons/fi";
import { createClient } from "@/utils/supabase/client";
import { Filters, useTableInsert, useTableUpdate, useToggleStatus } from "@/hooks/database";
import { useDeleteManager } from "@/hooks/useDeleteManager";
import { useDynamicColumnConfig } from "@/hooks/useColumnConfig";
import { useIsSuperAdmin } from "@/hooks/useAdminUsers";
import { usePagedOfcCablesComplete } from "@/hooks/database";
import { useRouter } from "next/navigation";

// --- UI COMPONENTS ---
import { DataTable } from "@/components/table/DataTable";
import { ConfirmModal } from "@/components/common/ui/Modal";
import { BulkActions } from "@/components/ofc/BulkActions";
import { OfcStats } from "@/components/ofc/OfcStats";
import { GetOfcTableActions } from "@/components/ofc/OfcTableActions";
import { OfcFilters } from "@/components/ofc/OfcFilters";
import OfcForm from "@/components/ofc/OfcForm";
import OfcDetailsModal from "@/components/ofc/OfcDetailsModal";

// --- TYPES ---
import { Json, TablesInsert } from "@/types/supabase-types";
import { Column, useTableExcelDownload } from "@/hooks/database/excel-queries";
import { OfcCablesFilters, OfcCablesWithRelations } from "@/components/ofc/ofc-types";
import { toast } from "sonner";
import { formatDate } from "@/utils/formatters";

// --- COMPONENT ---
const OfcPage = () => {
  // --- SUPABASE CLIENT ---
  const supabase = createClient();
  const router = useRouter();

  // --- STATE ---
  const [showForm, setShowForm] = useState(false);
  const [editingOfcCable, setEditingOfcCable] = useState<OfcCablesWithRelations | null>(null);
  const [viewingOfcCableId, setViewingOfcCableId] = useState<string | null>(null);
  const [selectedOfcCableIds, setSelectedOfcCableIds] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<OfcCablesFilters>({ search: "", ofc_type_id: "", status: "", maintenance_terminal_id: "" });
  const [pagination, setPagination] = useState({ page: 1, limit: 10 });

  // --- DATA FOR FILTER DROPDOWNS ---
  const [ofcTypes, setOfcTypes] = useState<{ id: string; name: string }[]>([]);
  const [maintenanceAreas, setMaintenanceAreas] = useState<{ id: string; name: string; code?: string | null }[]>([]);

  useEffect(() => {
    const fetchFilterData = async () => {
      const [typesRes, areasRes] = await Promise.all([supabase.from("lookup_types").select("id, name").eq("category", "OFC_TYPE").order("name"), supabase.from("maintenance_areas").select("id, name, code").order("name")]);
      if (typesRes.data) setOfcTypes(typesRes.data);
      if (areasRes.data) setMaintenanceAreas(areasRes.data);
    };
    fetchFilterData();
  }, [supabase]);

  // Format filters for the RPC function
  const rpcFilters = useMemo(() => {
    const dbFilters: Record<string, Json> = {};
    if (filters.search) dbFilters.search_term = { operator: "ilike", value: `%${filters.search}%` }; // Assuming your SQL function handles 'search_term'
    if (filters.ofc_type_id) dbFilters.ofc_type_id = { operator: "eq", value: filters.ofc_type_id };
    if (filters.status !== "") dbFilters.status = { operator: "eq", value: filters.status === "true" };
    if (filters.maintenance_terminal_id) dbFilters.maintenance_terminal_id = { operator: "eq", value: filters.maintenance_terminal_id };
    return dbFilters;
  }, [filters]);

  // NEW: Data fetching via the specialized RPC hook
  const {
    data: pagedOfcData,
    isLoading: ofcCablesLoading,
    refetch,
  } = usePagedOfcCablesComplete(supabase, {
    limit: pagination.limit,
    offset: (pagination.page - 1) * pagination.limit,
    filters: rpcFilters,
  });

  // Memoize derived data
  const pageData: OfcCablesWithRelations[] = useMemo(() => (pagedOfcData as OfcCablesWithRelations[]) || [], [pagedOfcData]);
  const totalCount = useMemo(() => pageData[0]?.total_count ?? 0, [pageData]);

  // Mutations still target the base 'ofc_cables' table, which is correct
  const { data: isSuperAdmin } = useIsSuperAdmin();
  const { mutate: insertOfcCable, isPending: isInserting } = useTableInsert(supabase, "ofc_cables", {
    onSuccess: () => {
      setShowForm(false);
      refetch();
    },
  });
  const { mutate: updateOfcCable, isPending: isUpdating } = useTableUpdate(supabase, "ofc_cables", {
    onSuccess: () => {
      setShowForm(false);
      setEditingOfcCable(null);
      refetch();
    },
  });
  const { mutate: toggleStatus } = useToggleStatus(supabase, "ofc_cables", { onSuccess: () => refetch() });
  const deleteManager = useDeleteManager({ tableName: "ofc_cables", onSuccess: () => refetch() });

  // Event Handlers
  const handleFormSubmit = (data: TablesInsert<"ofc_cables">) => (editingOfcCable?.id ? updateOfcCable({ id: editingOfcCable.id, data }) : insertOfcCable(data));
  const handleFiltersChange = useCallback((newFilters: Partial<OfcCablesFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
    setPagination((p) => ({ ...p, page: 1 }));
  }, []);
  const handleBulkDelete = () => {
    /* ... */
    // console.log(selectedOfcCableIds);
    deleteManager.deleteMultiple(selectedOfcCableIds.map((id) => ({ id, name: pageData.find((c) => c.id === id)?.route_name || "OFC Cable" })));
    setSelectedOfcCableIds([]);
  };
  const handleBulkUpdateStatus = (status: "active" | "inactive") => {
    /* ... */
    selectedOfcCableIds.forEach((id) => toggleStatus({ id, status: status === "active" }));
    setSelectedOfcCableIds([]);
  };

  // Download Configuration
  const downloadColumns = useDynamicColumnConfig("ofc_cables");

  const tableExcelDownload = useTableExcelDownload(supabase, "ofc_cables", {
    onSuccess: () => {
      toast.success("Export successful");
      refetch();
    },
    onError: () => toast.error("Export failed"),
  });

  const handleExport = async () => {
    const tableName = "ofc_cables";
    const tableOptions = {
      fileName: `${formatDate(new Date(), { format: "dd-mm-yyyy" })}-${String(tableName)}-export.xlsx`,
      sheetName: String(tableName),
      columns: downloadColumns,
      maxRows: 1000,
      customStyles: {},
    };
    tableExcelDownload.mutate(tableOptions);
  };

  // DataTable Configuration
  const columns = useDynamicColumnConfig("v_ofc_cables_complete", {
    omit: ["id", "created_at", "updated_at", "remark", "ofc_type_id", "maintenance_terminal_id", "ofc_type_code", "maintenance_area_code", "starting_node_id", "ending_node_id"],
    overrides: {
      asset_no: { title: "Asset No.", sortable: true, width: 150 },
      route_name: { title: "Route Name", sortable: true, width: 250 },
      ofc_type_name: { title: "OFC Type", width: 180 },
      maintenance_area_name: { title: "Maint. Area", width: 200 },
      status: {
        title: "Status",
        width: 100,
        render: (value) => <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>{value ? "Active" : "Inactive"}</span>,
      },
    },
  });

  const actions = useMemo(
    () =>
      GetOfcTableActions({
        onView: (id) => router.push(`/dashboard/ofc/${id}`),
        onEdit: (id) => {
          const c = pageData.find((c) => c.id === id);
          if (c) {
            setEditingOfcCable(c);
            setShowForm(true);
          }
        },
        onToggleStatus: (record) => toggleStatus({ id: record.id!, status: !record.status }),
        onDelete: (id, name) => deleteManager.deleteSingle({ id, name: name || "OFC Cable" }),
        isSuperAdmin: isSuperAdmin || false,
      }),
    [pageData, isSuperAdmin, toggleStatus, deleteManager, router]
  );

  const isLoading = ofcCablesLoading || isInserting || isUpdating || deleteManager.isPending;

  return (
    <>
      <div className='mx-auto space-y-6 p-4 md:p-6'>
        <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4'>
          <h1 className='text-3xl font-bold text-gray-800 dark:text-white'>OFC Cable Management</h1>
          <div className='flex items-center gap-2'>
            <button
              onClick={() => {
                handleExport();
              }}
              className='flex items-center gap-2 px-3 py-2 text-sm border rounded-lg hover:bg-gray-50'>
              <FiDownload /> Export
            </button>
            <button onClick={() => setShowForm(true)} className='flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700'>
              <FiPlus /> Add OFC Cable
            </button>
          </div>
        </div>
        <BulkActions isOperationLoading={isUpdating} onBulkDelete={handleBulkDelete} onBulkUpdateStatus={handleBulkUpdateStatus} onClearSelection={() => setSelectedOfcCableIds([])} selectedCount={selectedOfcCableIds.length} />
        <OfcFilters filters={filters} onFiltersChange={handleFiltersChange} maintenanceAreas={maintenanceAreas} ofcTypes={ofcTypes} onFilterToggle={() => setShowFilters((p) => !p)} showFilters={showFilters} />
        <DataTable
          tableName='v_ofc_cables_complete'
          data={pageData}
          columns={columns}
          loading={isLoading}
          actions={actions}
          selectable={true}
          onRowSelect={(selected) => setSelectedOfcCableIds(selected.map((r) => r.id!).filter(Boolean))}
          pagination={{
            current: pagination.page,
            pageSize: pagination.limit,
            total: totalCount,
            showSizeChanger: true,
            pageSizeOptions: [10, 20, 50, 100],
            onChange: (page, limit) => setPagination({ page, limit }),
          }}
          searchable={false}
          filterable={false}
          customToolbar={true}
        />
        <OfcStats total={totalCount} active={pageData.filter((c) => c.status).length} inactive={pageData.filter((c) => !c.status).length} />
      </div>
      {showForm && (
        <OfcForm
          ofcCable={editingOfcCable}
          onSubmit={handleFormSubmit}
          onCancel={() => {
            setShowForm(false);
            setEditingOfcCable(null);
          }}
          pageLoading={isLoading}
        />
      )}
      {viewingOfcCableId && (
        <OfcDetailsModal
          ofcCableId={viewingOfcCableId}
          onClose={() => setViewingOfcCableId(null)}
          onEdit={() => {
            const c = pageData.find((c) => c.id === viewingOfcCableId);
            if (c) {
              setEditingOfcCable(c);
              setShowForm(true);
            }
            setViewingOfcCableId(null);
          }}
        />
      )}
      <ConfirmModal
        isOpen={deleteManager.isConfirmModalOpen}
        onConfirm={deleteManager.handleConfirm}
        onCancel={deleteManager.handleCancel}
        title='Confirm Deletion'
        message={deleteManager.confirmationMessage}
        type='danger'
        loading={deleteManager.isPending}
      />
    </>
  );
};

export default OfcPage;
