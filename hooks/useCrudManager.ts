"use client";

import { useState,  useCallback, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { createClient } from "@/utils/supabase/client";
import {
  useTableInsert,
  useTableUpdate,
  useToggleStatus,
  useTableBulkOperations,
  Filters,
  TableName,
  TableInsert,
  TableUpdate,
  TableInsertWithDates,
} from "@/hooks/database";
import { toast } from "sonner";
import { useDeleteManager } from "./useDeleteManager";

// --- TYPE DEFINITIONS for the Hook's Interface ---
// A generic type to ensure records passed to actions have an 'id' and optionally a 'name'
export type RecordWithId = {
  id: string | number | null;  // Allow null to match database schema
  system_id?: string | number | null;
  system_connection_id?: string | number | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  [key: string]: unknown;
};

// Parameters that the manager will pass to the data fetching hook
export interface DataQueryHookParams {
  currentPage: number;
  pageLimit: number;
  searchQuery: string;
  filters: Filters;
}

export interface DataQueryHookReturn<V> {
  data: V[];
  totalCount: number;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

type DataQueryHook<V> = (params: DataQueryHookParams) => DataQueryHookReturn<V>;

// *** THE FIX IS HERE: `id` is now `string | null` to match your view's type. ***
type BaseRecord = { id: string | null; [key: string]: unknown };

// Options to configure the manager
// *** THE FIX IS HERE: The constraint is now simpler and correct. ***
// V only needs to be a base record with an `id`. T is still the TableName.
export interface CrudManagerOptions<T extends TableName, V extends BaseRecord> {
  tableName: T;
  dataQueryHook: DataQueryHook<V>;
  searchColumn?: keyof V & string;
}


// --- THE HOOK ---

export function useCrudManager<T extends TableName, V extends BaseRecord>({
  tableName,
  dataQueryHook,
}: CrudManagerOptions<T, V>) {
  const supabase = createClient();

  // The state for editing/viewing records should use the View type `V`
  const [editingRecord, setEditingRecord] = useState<V | null>(null);
  const [viewingRecord, setViewingRecord] = useState<V | null>(null);
  // ... (the rest of the state remains the same)
  // --- STATE MANAGEMENT ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // <-- NEW state for view modal
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [debouncedSearch] = useDebounce(searchQuery, 400);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters]);

  // --- DATA FETCHING (Delegated to the injected hook) ---
  const { data, totalCount, isLoading, error, refetch } = dataQueryHook({
    currentPage,
    pageLimit,
    searchQuery: debouncedSearch,
    filters,
  });

  // --- MUTATIONS (Target the base table `T`) ---
  const { mutate: insertItem, isPending: isInserting } = useTableInsert(
    supabase,
    tableName,
    {
      onSuccess: () => {
        refetch();
        closeModal();
        toast.success("Record created.");
      },
    }
  );
  const { mutate: updateItem, isPending: isUpdating } = useTableUpdate(
    supabase,
    tableName,
    {
      onSuccess: () => {
        refetch();
        closeModal();
        toast.success("Record updated.");
      },
    }
  );
  const { mutate: toggleStatus } = useToggleStatus(supabase, tableName, {
    onSuccess: refetch,
  });
  const deleteManager = useDeleteManager({ tableName, onSuccess: refetch });
  const { bulkDelete, bulkUpdate } = useTableBulkOperations(
    supabase,
    tableName
  );

  const isMutating =
    isInserting ||
    isUpdating ||
    deleteManager.isPending ||
    bulkDelete.isPending ||
    bulkUpdate.isPending;

  // --- HANDLERS ---
  const openAddModal = useCallback(() => {
    setEditingRecord(null);
    setIsEditModalOpen(true);
  }, []);
  const openEditModal = useCallback((record: V) => {
    setEditingRecord(record);
    setIsEditModalOpen(true);
  }, []);
  const openViewModal = useCallback((record: V) => {
    setViewingRecord(record);
    setIsViewModalOpen(true);
  }, []);
  const closeModal = useCallback(() => {
    setIsEditModalOpen(false);
    setEditingRecord(null);
    setIsViewModalOpen(false);
    setViewingRecord(null);
  }, []);

  const handleSave = useCallback(
    (formData: TableInsertWithDates<T>) => {
      // Convert ISO date strings back to Date objects for the database
      const processedData = { ...formData };

      // Handle date fields - adjust these field names as needed
      const dateFields = [
        "employee_dob",
        "employee_doj",
        "created_at",
        "updated_at",
      ] as const;

      dateFields.forEach((field) => {
        const fieldKey = field as keyof typeof processedData;
        if (field in processedData && processedData[fieldKey]) {
          const dateValue = processedData[fieldKey] as string | Date;
          (processedData as TableInsertWithDates<T>)[fieldKey] = new Date(
            dateValue
          ) as unknown as TableInsertWithDates<T>[typeof fieldKey];
        }
      });

      if (editingRecord && "id" in editingRecord && editingRecord.id) {
        updateItem({
          id: String(editingRecord.id),
          data: processedData as TableUpdate<T>,
        });
      } else {
        insertItem(processedData as TableInsert<T>);
      }
    },
    [editingRecord, insertItem, updateItem]
  );

  const handleDelete = useCallback(
    (record: RecordWithId) => {
      deleteManager.deleteSingle({
        id: String(record.id),
        name:
          (record.name ? record.name : record.first_name) || String(record.id),
      });
    },
    [deleteManager]
  );

  const handleToggleStatus = useCallback(
    (record: RecordWithId & { status?: boolean | null }) => {
      toggleStatus({
        id: String(record.id),
        status: !(record.status ?? false),
      });
    },
    [toggleStatus]
  );

  // Bulk action handlers
  const handleRowSelect = useCallback(
    (rows: Array<V & { id?: string | number }>) => {
      setSelectedRowIds(
        rows.map((r) => r.id).filter((id): id is string => !!id)
      );
    },
    []
  );
  const handleClearSelection = useCallback(() => setSelectedRowIds([]), []);
  const handleBulkDelete = useCallback(() => {
    if (selectedRowIds.length === 0) return;
    if (
      window.confirm(
        `Are you sure you want to delete ${selectedRowIds.length} selected records?`
      )
    ) {
      bulkDelete.mutate(
        { ids: selectedRowIds },
        {
          onSuccess: () => {
            toast.success(`${selectedRowIds.length} records deleted.`);
            setSelectedRowIds([]);
            refetch();
          },
          onError: (err) => toast.error(`Bulk delete failed: ${err.message}`),
        }
      );
    }
  }, [selectedRowIds, bulkDelete, refetch]);

  const handleBulkUpdateStatus = useCallback(
    (status: "active" | "inactive") => {
      if (selectedRowIds.length === 0) return;
      const updates = selectedRowIds.map((id) => ({
        id,
        data: { status: status === "active" } as unknown as TableUpdate<T>,
      }));
      bulkUpdate.mutate(
        { updates },
        {
          onSuccess: () => {
            toast.success(`${selectedRowIds.length} records updated.`);
            setSelectedRowIds([]);
            refetch();
          },
          onError: (err) =>
            toast.error(`Bulk status update failed: ${err.message}`),
        }
      );
    },
    [selectedRowIds, bulkUpdate, refetch]
  );

  // --- RETURN VALUE ---
  return {
    data: data || [],
    totalCount,
    isLoading,
    error,
    isMutating,
    refetch,
    pagination: { currentPage, pageLimit, setCurrentPage, setPageLimit },
    search: { searchQuery, setSearchQuery },
    filters: { filters, setFilters },
    editModal: { isOpen: isEditModalOpen, record: editingRecord, openAdd: openAddModal, openEdit: openEditModal, close: closeModal },
    viewModal: { isOpen: isViewModalOpen, record: viewingRecord, open: openViewModal, close: closeModal },
    actions: { handleSave, handleDelete, handleToggleStatus },
    bulkActions: { selectedRowIds, selectedCount: selectedRowIds.length, handleBulkDelete, handleBulkUpdateStatus, handleClearSelection, handleRowSelect },
    deleteModal: { isOpen: deleteManager.isConfirmModalOpen, message: deleteManager.confirmationMessage, confirm: deleteManager.handleConfirm, cancel: deleteManager.handleCancel, isLoading: deleteManager.isPending },
  };
}
