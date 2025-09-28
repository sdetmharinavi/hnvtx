"use client";

import { useState, useCallback, useEffect } from "react";
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
export type RecordWithId = {
  id: string | number | null;
  system_id?: string | number | null;
  system_connection_id?: string | number | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  [key: string]: unknown;
};

export interface DataQueryHookParams {
  currentPage: number;
  pageLimit: number;
  searchQuery: string;
  filters: Filters;
}

export interface DataQueryHookReturn<V> {
  data: V[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  isLoading: boolean;
  isFetching?: boolean;
  error: Error | null;
  refetch: () => void;
}

type DataQueryHook<V> = (params: DataQueryHookParams) => DataQueryHookReturn<V>;

type BaseRecord = { id: string | null; [key: string]: unknown };

export interface CrudManagerOptions<T extends TableName, V extends BaseRecord> {
  tableName: T;
  dataQueryHook: DataQueryHook<V>;
  searchColumn?: keyof V & string;
  processDataForSave?: (data: TableInsertWithDates<T>) => TableInsert<T>;
}

// --- THE HOOK ---
export function useCrudManager<T extends TableName, V extends BaseRecord>({
  tableName,
  dataQueryHook,
  processDataForSave,
}: CrudManagerOptions<T, V>) {
  const supabase = createClient();

  // --- STATE MANAGEMENT ---
  const [editingRecord, setEditingRecord] = useState<V | null>(null);
  const [viewingRecord, setViewingRecord] = useState<V | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);
  const [debouncedSearch] = useDebounce(searchQuery, 400);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters]);

  // --- DATA FETCHING ---
  const { data, totalCount, activeCount, inactiveCount, isLoading, isFetching, error, refetch } = dataQueryHook({
    currentPage,
    pageLimit,
    searchQuery: debouncedSearch,
    filters,
  });

  // --- MUTATIONS ---
  const { mutate: insertItem, isPending: isInserting } = useTableInsert(
    supabase,
    tableName,
    {
      onSuccess: () => {
        refetch();
        closeModal();
        toast.success("Record created successfully.");
      },
      onError: (error) => {
        toast.error(`Failed to create record: ${error.message}`);
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
        toast.success("Record updated successfully.");
      },
      onError: (error) => {
        toast.error(`Failed to update record: ${error.message}`);
      },
    }
  );

  const { mutate: toggleStatus } = useToggleStatus(supabase, tableName, {
    onSuccess: () => {
      refetch();
      toast.success("Status updated successfully.");
    },
    onError: (error) => {
      toast.error(`Failed to update status: ${error.message}`);
    },
  });

  // Initialize delete manager
  const deleteManager = useDeleteManager({ 
    tableName, 
    onSuccess: () => {
      refetch();
      handleClearSelection(); // Clear selection after successful delete
    }
  });

  const { bulkUpdate } = useTableBulkOperations(supabase, tableName);

  const isMutating =
    isInserting ||
    isUpdating ||
    deleteManager.isPending ||
    bulkUpdate.isPending;

  // --- MODAL HANDLERS ---
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

  // --- SAVE HANDLER ---
  const handleSave = useCallback(
    (formData: TableInsertWithDates<T>) => {
      const processedData = processDataForSave 
        ? processDataForSave(formData) 
        : (formData as TableInsert<T>);

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

  // --- DELETE HANDLERS ---
  const handleDelete = useCallback(
    (record: RecordWithId) => {
      if (!record.id) {
        toast.error("Cannot delete record: Invalid ID");
        return;
      }

      const displayName = getDisplayName(record);
      deleteManager.deleteSingle({
        id: String(record.id),
        name: displayName,
      });
    },
    [deleteManager]
  );

  // --- UTILITY TO GET DISPLAY NAME ---
  const getDisplayName = useCallback((record: RecordWithId): string => {
    if (record.name) return String(record.name);
    if (record.first_name && record.last_name) {
      return `${record.first_name} ${record.last_name}`;
    }
    if (record.first_name) return String(record.first_name);
    return String(record.id) || 'Unknown';
  }, []);

  // --- STATUS TOGGLE HANDLER ---
  const handleToggleStatus = useCallback(
    (record: RecordWithId & { status?: boolean | null }) => {
      if (!record.id) {
        toast.error("Cannot update status: Invalid record ID");
        return;
      }

      toggleStatus({
        id: String(record.id),
        status: !(record.status ?? false),
      });
    },
    [toggleStatus]
  );

  // --- BULK SELECTION HANDLERS ---
  const handleRowSelect = useCallback(
    (rows: Array<V & { id?: string | number }>) => {
      const validIds = rows
        .map((r) => r.id)
        .filter((id): id is NonNullable<typeof id> => id != null)
        .map((id) => String(id));
      setSelectedRowIds(validIds);
    },
    []
  );

  const handleClearSelection = useCallback(() => {
    setSelectedRowIds([]);
  }, []);

  // --- BULK DELETE HANDLER ---
  const handleBulkDelete = useCallback(() => {
    if (selectedRowIds.length === 0) {
      toast.error("No records selected for deletion");
      return;
    }

    // Convert selected IDs back to records for display names
    const selectedRecords = data
      .filter((record) => selectedRowIds.includes(String(record.id)))
      .map((record) => ({
        id: String(record.id),
        name: getDisplayName(record as RecordWithId),
      }));

    deleteManager.deleteMultiple(selectedRecords);
  }, [selectedRowIds, data, deleteManager, getDisplayName]);

  // --- BULK STATUS UPDATE HANDLER ---
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
            toast.success(
              `Successfully updated ${updates.length} records to ${status}`
            );
            setSelectedRowIds([]);
            refetch();
          },
          onError: (err) => {
            toast.error(`Failed to update status: ${err.message}`);
          },
        }
      );
    },
    [selectedRowIds, bulkUpdate, refetch]
  );

  // --- BULK DELETE BY FILTER ---
  const handleBulkDeleteByFilter = useCallback(
    (column: string, value: unknown, displayName: string) => {
      deleteManager.deleteBulk({
        column,
        value,
        displayName,
      });
    },
    [deleteManager]
  );

  // --- RETURN VALUE ---
  return {
    // Data
    data: data || [],
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isFetching,
    error,
    isMutating,
    refetch,

    // Pagination
    pagination: { 
      currentPage, 
      pageLimit, 
      setCurrentPage, 
      setPageLimit 
    },

    // Search & Filters  
    search: { 
      searchQuery, 
      setSearchQuery 
    },
    filters: { 
      filters, 
      setFilters 
    },

    // Modals
    editModal: { 
      isOpen: isEditModalOpen, 
      record: editingRecord, 
      openAdd: openAddModal, 
      openEdit: openEditModal, 
      close: closeModal 
    },
    viewModal: { 
      isOpen: isViewModalOpen, 
      record: viewingRecord, 
      open: openViewModal, 
      close: closeModal 
    },

    // Actions
    actions: { 
      handleSave, 
      handleDelete, 
      handleToggleStatus 
    },

    // Bulk Actions
    bulkActions: { 
      selectedRowIds, 
      selectedCount: selectedRowIds.length, 
      handleBulkDelete, 
      handleBulkDeleteByFilter,
      handleBulkUpdateStatus, 
      handleClearSelection, 
      handleRowSelect 
    },

    // Delete Modal (for ConfirmModal component)
    deleteModal: { 
      isOpen: deleteManager.isConfirmModalOpen, 
      message: deleteManager.confirmationMessage, 
      onConfirm: deleteManager.handleConfirm, 
      onCancel: deleteManager.handleCancel, 
      loading: deleteManager.isPending 
    },

    // Utility functions
    utils: {
      getDisplayName,
    },
  };
}