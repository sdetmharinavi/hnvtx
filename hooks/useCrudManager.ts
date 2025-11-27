// path: hooks/useCrudManager.ts
"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useDebounce } from "use-debounce";
import { v4 as uuidv4 } from 'uuid';
import { createClient } from "@/utils/supabase/client";
import {
  useTableInsert,
  useTableUpdate,
  useToggleStatus,
  useTableBulkOperations,
  Filters,
  PublicTableName,
  TableInsert,
  TableUpdate,
  TableInsertWithDates,
  Row,
  PagedQueryResult,
  PublicTableOrViewName,
} from "@/hooks/database";
import { toast } from "sonner";
import { useDeleteManager } from "./useDeleteManager";
import { useOnlineStatus } from "./useOnlineStatus";
import { addMutationToQueue } from "./data/useMutationQueue";
import { getTable } from "@/hooks/data/localDb";
import { DEFAULTS } from "@/constants/constants";
import { UseQueryResult } from "@tanstack/react-query";
import { Column } from "@/hooks/database/excel-queries/excel-helpers";

export type RecordWithId = {
  id: string | number | null;
  system_id?: string | number | null;
  system_connection_id?: string | number | null;
  name?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  employee_name?: string | null;
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BaseRecord = { id: string | number | null; [key: string]: any };

export interface CrudManagerOptions<T extends PublicTableName, V extends BaseRecord> {
  tableName: T;
  localTableName?: PublicTableOrViewName;
  dataQueryHook: DataQueryHook<V>;
  searchColumn?: (keyof V & string) | (keyof V & string)[];
  displayNameField?: (keyof V & string) | (keyof V & string)[];
  processDataForSave?: (data: TableInsertWithDates<T>) => TableInsert<T>;
  idType?: 'string' | 'number';
}

export function useCrudManager<T extends PublicTableName, V extends BaseRecord>({
  tableName,
  localTableName,
  dataQueryHook,
  searchColumn,
  displayNameField = 'name',
  processDataForSave,
  idType = 'string', // Default to string as UUIDs are most common
}: CrudManagerOptions<T, V>) {
  const supabase = createClient();
  const isOnline = useOnlineStatus();

  const [editingRecord, setEditingRecord] = useState<V | null>(null);
  const [viewingRecord, setViewingRecord] = useState<V | null>(null);
  const [currentPage, _setCurrentPage] = useState(1);
  const [pageLimit, _setPageLimit] = useState(DEFAULTS.PAGE_SIZE);
  const [searchQuery, _setSearchQuery] = useState("");
  const [filters, _setFilters] = useState<Filters>({});
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRowIds, _setSelectedRowIds] = useState<string[]>([]);
  const [debouncedSearch] = useDebounce(searchQuery, 400);

  const setCurrentPage = useCallback((page: number) => _setCurrentPage(page), []);
  const setPageLimit = useCallback((limit: number) => _setPageLimit(limit), []);
  const setSearchQuery = useCallback((query: string) => _setSearchQuery(query), []);
  const setFilters = useCallback((newFilters: Filters | ((prev: Filters) => Filters)) => _setFilters(newFilters), []);
  const setSelectedRowIds = useCallback((ids: string[]) => _setSelectedRowIds(ids), []);

  const combinedFilters = useMemo(() => {
    const newFilters: Filters = { ...filters };
    if (debouncedSearch && searchColumn) {
      if (Array.isArray(searchColumn)) {
        newFilters.or = searchColumn.reduce((acc, col) => {
          acc[col as string] = debouncedSearch;
          return acc;
        }, {} as Record<string, string>);
      } else {
        newFilters[searchColumn as string] = { operator: 'ilike', value: `%${debouncedSearch}%` };
      }
    }
    return newFilters;
  }, [debouncedSearch, filters, searchColumn]);

  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, filters, setCurrentPage]);

  const { data, totalCount, activeCount, inactiveCount, isLoading, isFetching, error, refetch } = dataQueryHook({
    currentPage,
    pageLimit,
    searchQuery: debouncedSearch,
    filters: combinedFilters,
  });

  const { mutate: insertItem, isPending: isInserting } = useTableInsert(supabase, tableName, {
    onSuccess: () => { refetch(); closeModal(); toast.success("Record created successfully."); },
    onError: (error) => toast.error(`Failed to create record: ${error.message}`),
  });

  const { mutate: updateItem, isPending: isUpdating } = useTableUpdate(supabase, tableName, {
    onSuccess: () => { refetch(); closeModal(); toast.success("Record updated successfully."); },
    onError: (error) => toast.error(`Failed to update record: ${error.message}`),
  });

  const { mutate: toggleStatus } = useToggleStatus(supabase, tableName, {
    onSuccess: () => { refetch(); toast.success("Status updated successfully."); },
    onError: (error) => toast.error(`Failed to update status: ${error.message}`),
  });

  const handleLocalCleanup = useCallback(async (deletedIds: string[]) => {
    if (!deletedIds.length) return;
    
    const targetTable = localTableName || tableName;
    
    try {
        const table = getTable(targetTable);
        // Cast IDs based on configured type before deletion
        const idsToDelete = idType === 'number' 
          ? deletedIds.map(Number).filter(n => !isNaN(n)) 
          : deletedIds;
          
        // Explicitly cast to the widened type supported by getTable
        await table.bulkDelete(idsToDelete as (string | number | [string, string])[]);
        console.log(`[useCrudManager] Locally deleted ${idsToDelete.length} items from ${targetTable}`);
    } catch (e) {
        console.error(`[useCrudManager] Failed to cleanup local data for ${targetTable}:`, e);
    }
  }, [tableName, localTableName, idType]);

  const deleteManager = useDeleteManager({ 
      tableName, 
      onSuccess: async (deletedIds) => { 
          await handleLocalCleanup(deletedIds);
          refetch(); 
          handleClearSelection(); 
      } 
  });

  const { bulkUpdate } = useTableBulkOperations(supabase, tableName);
  const isMutating = isInserting || isUpdating || deleteManager.isPending || bulkUpdate.isPending;

  const openAddModal = useCallback(() => { setEditingRecord(null); setIsEditModalOpen(true); }, []);
  const openEditModal = useCallback((record: V) => { setEditingRecord(record); setIsEditModalOpen(true); }, []);
  const openViewModal = useCallback((record: V) => { setViewingRecord(record); setIsViewModalOpen(true); }, []);
  const closeModal = useCallback(() => { setIsEditModalOpen(false); setEditingRecord(null); setIsViewModalOpen(false); setViewingRecord(null); }, []);

  const handleSave = useCallback(async (formData: TableInsertWithDates<T>) => {
    const processedData = processDataForSave ? processDataForSave(formData) : (formData as TableInsert<T>);

    if (isOnline) {
      if (editingRecord && "id" in editingRecord && editingRecord.id) {
        updateItem({ id: String(editingRecord.id), data: processedData as TableUpdate<T> });
      } else {
        insertItem(processedData as TableInsert<T>);
      }
    } else { 
      try {
        const table = getTable(tableName);
        if (editingRecord && "id" in editingRecord && editingRecord.id) {
          const idToUpdate = String(editingRecord.id);
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (table.update as any)(idToUpdate, processedData);
          await addMutationToQueue({
            tableName,
            type: 'update',
            payload: { id: idToUpdate, data: processedData },
          });
        } else {
          const tempId = `offline_${uuidv4()}`;
          const newRecord = { ...processedData, id: tempId };
          await table.add(newRecord as Row<T>);
          await addMutationToQueue({
            tableName,
            type: 'insert',
            payload: newRecord,
          });
        }
        refetch(); 
        closeModal();
      } catch (err) {
        toast.error(`Offline operation failed: ${(err as Error).message}`);
      }
    }
  }, [isOnline, editingRecord, tableName, processDataForSave, updateItem, insertItem, refetch, closeModal]);

  const getDisplayName = useCallback((record: RecordWithId): string => {
    if (displayNameField) {
      const fields = Array.isArray(displayNameField) ? displayNameField : [displayNameField];
      for (const field of fields) {
        const name = record[field as string];
        if (name) return String(name);
      }
    }
    if (record.name) return String(record.name);
    if (record.employee_name) return String(record.employee_name);
    if (record.first_name && record.last_name) return `${record.first_name} ${record.last_name}`;
    if (record.first_name) return String(record.first_name);
    return String(record.id) || 'Unknown';
  }, [displayNameField]);

  const handleDelete = useCallback(async (record: RecordWithId) => {
    if (!record.id) { toast.error("Cannot delete record: Invalid ID"); return; }
    const idToDelete = String(record.id);
    const displayName = getDisplayName(record);

    if (isOnline) {
      deleteManager.deleteSingle({ id: idToDelete, name: displayName });
    } else { 
      if (window.confirm(`Are you sure you want to delete "${displayName}"? This will be synced when you're back online.`)) {
        try {
          const table = getTable(tableName);
          // Handle numeric ID locally if needed
          const idKey = idType === 'number' ? Number(idToDelete) : idToDelete;
          await table.delete(idKey);
          
          await addMutationToQueue({
            tableName,
            type: 'delete',
            payload: { ids: [idToDelete] }, // Queue always stores ID as string for consistency
          });
          refetch();
        } catch (err) {
          toast.error(`Offline deletion failed: ${(err as Error).message}`);
        }
      }
    }
  }, [isOnline, tableName, deleteManager, getDisplayName, refetch, idType]);

  const handleToggleStatus = useCallback(async (record: RecordWithId & { status?: boolean | null }) => {
    if (!record.id) { toast.error("Cannot update status: Invalid ID"); return; }
    const idToUpdate = String(record.id);
    const newStatus = !(record.status ?? false);
    
    if (isOnline) {
      toggleStatus({ id: idToUpdate, status: newStatus });
    } else { 
      try {
        const table = getTable(tableName);
        const idKey = idType === 'number' ? Number(idToUpdate) : idToUpdate;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (table.update as any)(idKey, { status: newStatus });
        await addMutationToQueue({
          tableName,
          type: 'update',
          payload: { id: idToUpdate, data: { status: newStatus } },
        });
        refetch();
      } catch (err) {
        toast.error(`Offline status update failed: ${(err as Error).message}`);
      }
    }
  }, [isOnline, tableName, toggleStatus, refetch, idType]);

  // --- GENERIC HANDLE CELL EDIT ---
  const handleCellEdit = useCallback(
    async (record: V, column: Column<V>, newValue: string) => {
      if (!record.id) return;
      
      const id = String(record.id);
      const key = column.dataIndex;
      
      // Simple validation to ensure we are not trying to update a computed property that doesn't exist on the base table.
      // In a more complex system, we might need a 'editableKey' property on the Column definition if it differs from dataIndex.
      
      // Construct partial update object. 
      // Casting to 'any' is necessary here because we are constructing a partial based on dynamic keys
      // which TS cannot verify against TableUpdate<T> without more specific type constraints.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData = { [key]: newValue } as any;

      if (isOnline) {
        updateItem({ id, data: updateData });
      } else {
         try {
          const table = getTable(tableName);
          const idKey = idType === 'number' ? Number(id) : id;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (table.update as any)(idKey, updateData);
          await addMutationToQueue({
            tableName,
            type: 'update',
            payload: { id, data: updateData },
          });
          refetch();
        } catch (err) {
          toast.error(`Offline edit failed: ${(err as Error).message}`);
        }
      }
    },
    [isOnline, updateItem, tableName, idType, refetch]
  );
  
  const handleRowSelect = useCallback((rows: Array<V & { id?: string | number }>) => {
    const validIds = rows.map(r => r.id).filter((id): id is NonNullable<typeof id> => id != null).map(String);
    setSelectedRowIds(validIds);
  }, [setSelectedRowIds]);

  const handleClearSelection = useCallback(() => { setSelectedRowIds([]); }, [setSelectedRowIds]);

  const handleBulkDelete = useCallback(async () => {
    if (selectedRowIds.length === 0) { toast.error("No records selected"); return; }
    
    if (isOnline) {
      const selectedRecords = data.filter(record => selectedRowIds.includes(String(record.id))).map(record => ({
        id: String(record.id), name: getDisplayName(record as RecordWithId),
      }));
      deleteManager.deleteMultiple(selectedRecords);
    } else { 
      if (window.confirm(`Queue deletion for ${selectedRowIds.length} items?`)) {
        try {
          const table = getTable(tableName);
          const idsKey = idType === 'number' ? selectedRowIds.map(Number) : selectedRowIds;
          // Explicitly cast for local deletion
          await table.bulkDelete(idsKey as (string | number | [string, string])[]);
          await addMutationToQueue({
            tableName,
            type: 'delete',
            payload: { ids: selectedRowIds },
          });
          refetch();
          handleClearSelection();
        } catch (err) {
          toast.error(`Offline bulk delete failed: ${(err as Error).message}`);
        }
      }
    }
  }, [isOnline, selectedRowIds, data, tableName, deleteManager, getDisplayName, refetch, handleClearSelection, idType]);

  const handleBulkUpdateStatus = useCallback(async (status: "active" | "inactive") => {
    if (selectedRowIds.length === 0) return;
    const newStatus = status === 'active';

    if (isOnline) {
      const updates = selectedRowIds.map((id) => ({ id, data: { status: newStatus } as unknown as TableUpdate<T> }));
      bulkUpdate.mutate({ updates }, {
        onSuccess: () => {
          toast.success(`Updated ${updates.length} records to ${status}`);
          handleClearSelection();
          refetch();
        },
        onError: (err) => toast.error(`Status update failed: ${err.message}`),
      });
    } else { 
      try {
        const table = getTable(tableName);
        const idsKey = idType === 'number' ? selectedRowIds.map(Number) : selectedRowIds;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await table.where('id').anyOf(idsKey).modify({ status: newStatus } as any);
        for (const id of selectedRowIds) {
          await addMutationToQueue({
            tableName,
            type: 'update',
            payload: { id, data: { status: newStatus } },
          });
        }
        refetch();
        handleClearSelection();
      } catch (err) {
        toast.error(`Offline bulk status update failed: ${(err as Error).message}`);
      }
    }
  }, [isOnline, selectedRowIds, tableName, bulkUpdate, refetch, handleClearSelection, idType]);

  const handleBulkDeleteByFilter = useCallback((column: string, value: string | number | boolean | null, displayName: string) => {
      deleteManager.deleteBulk({ column, value, displayName });
    }, [deleteManager]);

  const queryResult = useMemo((): UseQueryResult<PagedQueryResult<V>, Error> => ({
    data: { data, count: totalCount },
    isLoading,
    isFetching: isFetching ?? false,
    error: error as Error | null,
    isError: !!error,
    isSuccess: !isLoading && !error,
    refetch: refetch as () => Promise<UseQueryResult<PagedQueryResult<V>, Error>>,
    status: isLoading ? 'pending' : error ? 'error' : 'success',
  }) as UseQueryResult<PagedQueryResult<V>, Error>, [data, totalCount, isLoading, isFetching, error, refetch]);


  return {
    data: data || [],
    totalCount, activeCount, inactiveCount,
    isLoading, isFetching, error, isMutating, 
    refetch,
    pagination: { currentPage, pageLimit, setCurrentPage, setPageLimit },
    search: { searchQuery, setSearchQuery },
    filters: { filters, setFilters },
    queryResult,
    editModal: { isOpen: isEditModalOpen, record: editingRecord, openAdd: openAddModal, openEdit: openEditModal, close: closeModal },
    viewModal: { isOpen: isViewModalOpen, record: viewingRecord, open: openViewModal, close: closeModal },
    // Added handleCellEdit to actions
    actions: { handleSave, handleDelete, handleToggleStatus, handleCellEdit },
    bulkActions: { selectedRowIds, selectedCount: selectedRowIds.length, handleBulkDelete, handleBulkDeleteByFilter, handleBulkUpdateStatus, handleClearSelection, handleRowSelect },
    deleteModal: { isOpen: deleteManager.isConfirmModalOpen, message: deleteManager.confirmationMessage, onConfirm: deleteManager.handleConfirm, onCancel: deleteManager.handleCancel, loading: deleteManager.isPending },
    utils: { getDisplayName },
  };
}