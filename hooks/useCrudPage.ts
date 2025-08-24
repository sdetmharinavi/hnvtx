"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useDebounce } from "use-debounce";
import { createClient } from "@/utils/supabase/client";
import {
  useTableWithRelations,
  useTableInsert,
  useTableUpdate,
  useToggleStatus,
  useTableBulkOperations,
  Filters,
  TableName,
  Row,
  TableInsert,
  TableUpdate,
  TableInsertWithDates,
} from "@/hooks/database";
import { toast } from "sonner";
import { useDeleteManager } from "@/hooks/useDeleteManager";
import { DEFAULTS } from "@/config/constants";

// A generic type to ensure records passed to actions have an 'id' and optionally a 'name'
type RecordWithId = {
  id: string | number;
  system_id?: string | number;
  system_connection_id?: string | number;
  name?: string;
  [key: string]: unknown;
};

/**
 * A comprehensive hook to manage the state and logic for a standard CRUD page.
 * @param tableName The name of the Supabase table.
 * @param options Configuration options for the hook.
 */
export function useCrudPage<T extends TableName>({
  tableName,
  relations = [],
  searchColumn = "name",
}: {
  tableName: T;
  relations?: string[];
  searchColumn: (keyof Row<T> & string) | "name";
}) {
  const supabase = createClient();

  // --- STATE MANAGEMENT ---
  const [currentPage, setCurrentPage] = useState(1);
  const [pageLimit, setPageLimit] = useState(DEFAULTS.PAGE_SIZE);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<Filters>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<Row<T> | null>(null);
  const [debouncedSearch] = useDebounce(searchQuery, DEFAULTS.DEBOUNCE_DELAY);
  const [selectedRowIds, setSelectedRowIds] = useState<string[]>([]);

  // --- FILTERS ---
  const serverFilters = useMemo(() => {
    const combinedFilters: Filters = { ...filters };
    if (debouncedSearch) {
      combinedFilters[searchColumn] = {
        operator: "ilike",
        value: `%${debouncedSearch}%`,
      };
    }
    return combinedFilters;
  }, [filters, debouncedSearch, searchColumn]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters]);

  // --- DATA FETCHING ---
  const { data, isLoading, error, refetch } = useTableWithRelations(
    supabase,
    tableName,
    relations,
    {
      filters: serverFilters,
      limit: pageLimit,
      offset: (currentPage - 1) * pageLimit,
      includeCount: true,
      orderBy: [{ column: "employee_name", ascending: true }],
    }
  );

  const totalCount =
    (data?.[0] as { total_count: number })?.total_count ?? data?.length ?? 0;

  // --- MUTATIONS ---
  const { mutate: insertItem, isPending: isInserting } = useTableInsert(
    supabase,
    tableName,
    {
      onSuccess: () => {
        refetch();
        closeModal();
        toast.success("Record created successfully!");
      },
      onError: (err) => toast.error(`Creation failed: ${err.message}`),
    }
  );
  const { mutate: updateItem, isPending: isUpdating } = useTableUpdate(
    supabase,
    tableName,
    {
      onSuccess: () => {
        refetch();
        closeModal();
        toast.success("Record updated successfully!");
      },
      onError: (err) => toast.error(`Update failed: ${err.message}`),
    }
  );
  const { mutate: toggleStatus } = useToggleStatus(supabase, tableName, {
    onSuccess: () => refetch(),
    onError: (err) => toast.error(`Status toggle failed: ${err.message}`),
  });

  // *** INTEGRATE useDeleteManager ***
  const deleteManager = useDeleteManager({ tableName, onSuccess: refetch });

  // NEW: Bulk mutation hooks
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
    setIsModalOpen(true);
  }, []);
  const openEditModal = useCallback((record: Row<T>) => {
    setEditingRecord(record);
    setIsModalOpen(true);
  }, []);
  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingRecord(null);
  }, []);

  const handleSave = useCallback(
    (formData: TableInsertWithDates<T>) => {
      // Convert ISO date strings back to Date objects for the database
      const processedData = { ...formData };

      // Handle date fields - adjust these field names as needed
      const dateFields = ['employee_dob', 'employee_doj', 'created_at', 'updated_at'] as const;
      
      dateFields.forEach((field) => {
        const fieldKey = field as keyof typeof processedData;
        if (field in processedData && processedData[fieldKey]) {
          const dateValue = processedData[fieldKey] as string | Date;
          (processedData as TableInsertWithDates<T>)[fieldKey] = new Date(dateValue) as unknown as TableInsertWithDates<T>[typeof fieldKey];
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

  // The delete handler now just triggers the delete manager
  const handleDelete = useCallback(
    (record: RecordWithId) => {
      deleteManager.deleteSingle({
        id: String(record.id),
        name: record.name || String(record.id),
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

  // NEW: Bulk action handlers
  const handleRowSelect = useCallback(
    (rows: Array<Row<T> & { id?: string | number }>) => {
      setSelectedRowIds(
        rows
          .map((r) => r?.id)
          .filter((id): id is string => typeof id === "string")
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
    // Data and state
    data: data || [],
    totalCount,
    isLoading,
    error,
    isMutating,
    refetch,

    // UI State
    pagination: { currentPage, pageLimit, setCurrentPage, setPageLimit },
    search: { searchQuery, setSearchQuery },
    filters: { filters, setFilters },
    modal: {
      isModalOpen,
      editingRecord,
      openAddModal,
      openEditModal,
      closeModal,
    },

    // Actions
    actions: { handleSave, handleDelete, handleToggleStatus },

    // Bulk Actions
    bulkActions: {
      selectedCount: selectedRowIds.length,
      handleBulkDelete,
      handleBulkUpdateStatus,
      handleClearSelection,
      handleRowSelect,
    },

    // Expose delete modal state and handlers directly
    deleteModal: {
      isOpen: deleteManager.isConfirmModalOpen,
      message: deleteManager.confirmationMessage,
      confirm: deleteManager.handleConfirm,
      cancel: deleteManager.handleCancel,
      isLoading: deleteManager.isPending,
    },
  };
}
