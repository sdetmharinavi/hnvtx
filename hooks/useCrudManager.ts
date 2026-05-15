// hooks/useCrudManager.ts
/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
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
  PagedQueryResult,
} from '@/hooks/database';
import { toast } from 'sonner';
import { useDeleteManager } from './useDeleteManager';
import { DEFAULTS } from '@/constants/constants';
import { UseQueryResult } from '@tanstack/react-query';
import { useDataSync } from '@/hooks/data/useDataSync';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { PublicTableOrViewName } from './database/queries-type-helpers';
import { formatErrorMessage } from '@/utils/formatters';

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
  [key: string]: unknown;
}

type DataQueryHook<V> = (params: DataQueryHookParams) => DataQueryHookReturn<V>;

type BaseRecord = { id: string | number | null; [key: string]: any };

export interface CrudManagerOptions<T extends PublicTableName, V extends BaseRecord> {
  tableName: T;
  dataQueryHook: DataQueryHook<V>;
  searchColumn?: (keyof V & string) | (keyof V & string)[];
  displayNameField?: (keyof V & string) | (keyof V & string)[];
  processDataForSave?: (data: TableInsertWithDates<T>) => TableInsert<T>;
  idType?: 'string' | 'number';
  initialFilters?: Filters;
  statusColumn?: string;
  syncTables?: PublicTableOrViewName[];
}

export interface UseCrudManagerReturn<V> {
  data: V[];
  totalCount: number;
  activeCount: number;
  inactiveCount: number;
  isLoading: boolean;
  isFetching: boolean;
  error: Error | null;
  isMutating: boolean;
  refetch: () => void;
  pagination: {
    currentPage: number;
    pageLimit: number;
    setCurrentPage: (page: number) => void;
    setPageLimit: (limit: number) => void;
  };
  search: {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
  };
  filters: {
    filters: Filters;
    setFilters: React.Dispatch<React.SetStateAction<Filters>>;
  };
  queryResult: UseQueryResult<PagedQueryResult<V>, Error>;
  editModal: {
    isOpen: boolean;
    record: V | null;
    openAdd: () => void;
    openEdit: (record: V) => void;
    close: () => void;
  };
  viewModal: {
    isOpen: boolean;
    record: V | null;
    open: (record: V) => void;
    close: () => void;
  };
  actions: {
    handleSave: (formData: any, options?: { keepOpen?: boolean }) => Promise<void>;
    handleDelete: (record: any) => Promise<void>;
    handleToggleStatus: (record: any) => Promise<void>;
    handleCellEdit: (record: V, column: Column<V>, newValue: string) => Promise<void>;
  };
  bulkActions: {
    selectedRowIds: string[];
    selectedCount: number;
    handleBulkDelete: () => Promise<void>;
    handleBulkDeleteByFilter: (column: string, value: any, displayName: string) => void;
    handleBulkUpdateStatus: (status: 'active' | 'inactive') => Promise<void>;
    handleClearSelection: () => void;
    handleRowSelect: (rows: any[]) => void;
  };
  deleteModal: {
    isOpen: boolean;
    message: string | React.ReactNode;
    onConfirm: () => void;
    onCancel: () => void;
    loading: boolean;
  };
  utils: {
    getDisplayName: (record: RecordWithId) => string;
  };
  [key: string]: unknown;
}

export function useCrudManager<T extends PublicTableName, V extends BaseRecord>({
  tableName,
  dataQueryHook,
  displayNameField = 'name',
  processDataForSave,
  initialFilters = {},
  statusColumn = 'status',
}: CrudManagerOptions<T, V>): UseCrudManagerReturn<V> {
  const supabase = createClient();
  const { isSyncing: isSyncingData } = useDataSync();

  const [editingRecord, setEditingRecord] = useState<V | null>(null);
  const [viewingRecord, setViewingRecord] = useState<V | null>(null);
  const [currentPage, _setCurrentPage] = useState(1);
  const [pageLimit, _setPageLimit] = useState(DEFAULTS.PAGE_SIZE);
  const [searchQuery, _setSearchQuery] = useState('');
  const [filters, _setFilters] = useState<Filters>(initialFilters);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedRowIds, _setSelectedRowIds] = useState<string[]>([]);

  const setCurrentPage = useCallback((page: number) => _setCurrentPage(page), []);
  const setPageLimit = useCallback((limit: number) => _setPageLimit(limit), []);
  const setSearchQuery = useCallback((query: string) => _setSearchQuery(query), []);
  const setFilters = useCallback(
    (newFilters: Filters | ((prev: Filters) => Filters)) => _setFilters(newFilters),
    [],
  );
  const setSelectedRowIds = useCallback((ids: string[]) => _setSelectedRowIds(ids), []);

  const combinedFilters = useMemo(() => {
    return { ...filters };
  }, [filters]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, filters, setCurrentPage]);

  // --- DATA FETCHING ---
  const {
    data,
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isFetching,
    error,
    refetch,
    ...restHookData
  } = dataQueryHook({
    currentPage,
    pageLimit,
    searchQuery,
    filters: combinedFilters,
  });

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // --- MUTATIONS ---
  const { mutateAsync: insertItemAsync, isPending: isInserting } = useTableInsert(
    supabase,
    tableName,
  );

  const { mutateAsync: updateItemAsync, isPending: isUpdating } = useTableUpdate(
    supabase,
    tableName,
  );

  const { mutate: toggleStatus } = useToggleStatus(supabase, tableName, {
    onSuccess: () => {
      toast.success('Status updated.');
    },
    onError: (error) => toast.error(`Failed to update status: ${formatErrorMessage(error)}`),
  });

  const deleteManager = useDeleteManager({
    tableName,
    onSuccess: () => {
      handleClearSelection();
    },
  });

  const { bulkUpdate, bulkDelete } = useTableBulkOperations(supabase, tableName);

  const isMutating =
    isInserting ||
    isUpdating ||
    deleteManager.isPending ||
    bulkUpdate.isPending ||
    bulkDelete.isPending;

  // --- MODAL CONTROLS ---
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

  const getDisplayName = useCallback(
    (record: RecordWithId): string => {
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
    },
    [displayNameField],
  );

  const handleSave = useCallback(
    async (formData: TableInsertWithDates<T>, options?: { keepOpen?: boolean }) => {
      const processedData = processDataForSave
        ? processDataForSave(formData)
        : (formData as TableInsert<T>);

      try {
        if (editingRecord && 'id' in editingRecord && editingRecord.id) {
          const res = await updateItemAsync({
            id: String(editingRecord.id),
            data: processedData as TableUpdate<T>,
          });
          toast.success('Record updated successfully.');

          if (options?.keepOpen && res && res.length > 0) {
            setEditingRecord(res[0] as unknown as V);
          } else if (!options?.keepOpen) {
            closeModal();
          }
        } else {
          const res = await insertItemAsync(processedData as TableInsert<T>);
          toast.success('Record created successfully.');

          if (options?.keepOpen && res && res.length > 0) {
            setEditingRecord(res[0] as unknown as V);
          } else if (!options?.keepOpen) {
            closeModal();
          }
        }
      } catch (error: any) {
        toast.error(`Failed to save record: ${formatErrorMessage(error)}`);
      }
    },
    [processDataForSave, editingRecord, updateItemAsync, insertItemAsync, closeModal],
  );

  const handleDelete = useCallback(
    async (record: RecordWithId) => {
      if (!record.id) {
        toast.error('Cannot delete record: Invalid ID');
        return;
      }
      const idToDelete = String(record.id);
      const displayName = getDisplayName(record);
      deleteManager.deleteSingle({ id: idToDelete, name: displayName });
    },
    [deleteManager, getDisplayName],
  );

  const handleClearSelection = useCallback(() => {
    setSelectedRowIds([]);
  }, [setSelectedRowIds]);

  const handleBulkUpdateStatus = useCallback(
    async (status: 'active' | 'inactive') => {
      if (selectedRowIds.length === 0) return;
      const newStatus = status === 'active';
      const updates = selectedRowIds.map((id) => ({
        id,
        data: { [statusColumn]: newStatus } as unknown as TableUpdate<T>,
      }));
      bulkUpdate.mutate(
        { updates },
        {
          onSuccess: () => {
            toast.success('Status updated for selected items.');
            handleClearSelection();
          },
          onError: (err) => toast.error(`Bulk update failed: ${formatErrorMessage(err)}`),
        },
      );
    },
    [selectedRowIds, bulkUpdate, handleClearSelection, statusColumn],
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedRowIds.length === 0) return;
    const items = data
      .filter((record) => selectedRowIds.includes(String(record.id)))
      .map((record) => ({
        id: String(record.id),
        name: getDisplayName(record as RecordWithId),
      }));
    deleteManager.deleteMultiple(items);
  }, [selectedRowIds, data, deleteManager, getDisplayName]);

  const handleToggleStatus = useCallback(
    async (record: RecordWithId) => {
      if (!record.id) {
        toast.error('Cannot update status: Invalid ID');
        return;
      }
      const idToUpdate = String(record.id);
      const currentStatusVal = record[statusColumn as keyof typeof record] as boolean | undefined;
      const newStatus = !(currentStatusVal ?? false);

      toggleStatus({ id: idToUpdate, status: newStatus, statusField: statusColumn });
    },
    [toggleStatus, statusColumn],
  );

  const handleCellEdit = useCallback(
    async (record: V, column: Column<V>, newValue: string) => {
      if (!record.id) return;
      const id = String(record.id);
      const key = column.dataIndex;

      // THE FIX: Convert empty string to null to prevent Postgres type errors for numerics/dates
      let finalValue: any = newValue;
      if (typeof newValue === 'string' && newValue.trim() === '') {
        finalValue = null;
      }

      const updateData = { [key]: finalValue } as any;

      updateItemAsync({ id, data: updateData })
        .then(() => {
          toast.success('Cell updated.');
        })
        .catch((err) => {
          toast.error(`Update failed: ${formatErrorMessage(err)}`);
        });
    },
    [updateItemAsync],
  );

  const handleRowSelect = useCallback(
    (rows: Array<V & { id?: string | number }>) => {
      const validIds = rows
        .map((r) => r.id)
        .filter((id): id is NonNullable<typeof id> => id != null)
        .map(String);
      setSelectedRowIds(validIds);
    },
    [setSelectedRowIds],
  );

  const handleBulkDeleteByFilter = useCallback(
    (column: string, value: string | number | boolean | null, displayName: string) => {
      deleteManager.deleteBulk({ column, value, displayName });
    },
    [deleteManager],
  );

  const queryResult = useMemo(
    () =>
      ({
        data: { data, count: totalCount },
        isLoading,
        isPending: isLoading,
        isFetching: isFetching || isSyncingData,
        error: error as Error | null,
        isError: !!error,
        isSuccess: !isLoading && !error,
        refetch: handleRefresh as unknown as () => Promise<PagedQueryResult<V>>,
        status: isLoading ? 'pending' : error ? 'error' : 'success',
      }) as unknown as UseQueryResult<PagedQueryResult<V>, Error>,
    [data, totalCount, isLoading, isFetching, isSyncingData, error, handleRefresh],
  );

  // --- RESIZING LOGIC START ---
  const [detailsPanelWidth, setDetailsPanelWidth] = useState(1000);
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback(
    (mouseEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = window.innerWidth - mouseEvent.clientX;
        if (newWidth > 300 && newWidth < 1200) {
          setDetailsPanelWidth(newWidth);
        }
      }
    },
    [isResizing],
  );

  useEffect(() => {
    if (isResizing) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'auto';
      document.body.style.userSelect = 'auto';
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
      document.body.style.cursor = 'auto';
      document.body.style.userSelect = 'auto';
    };
  }, [isResizing, resize, stopResizing]);
  // --- RESIZING LOGIC END ---

  return {
    data: data || [],
    totalCount,
    activeCount,
    inactiveCount,
    isLoading,
    isFetching: isFetching || isSyncingData,
    error,
    isMutating,
    refetch: handleRefresh,
    pagination: { currentPage, pageLimit, setCurrentPage, setPageLimit },
    search: { searchQuery, setSearchQuery },
    filters: { filters, setFilters },
    queryResult,
    editModal: {
      isOpen: isEditModalOpen,
      record: editingRecord,
      openAdd: openAddModal,
      openEdit: openEditModal,
      close: closeModal,
    },
    viewModal: {
      isOpen: isViewModalOpen,
      record: viewingRecord,
      open: openViewModal,
      close: closeModal,
    },
    actions: { handleSave, handleDelete, handleToggleStatus, handleCellEdit },
    bulkActions: {
      selectedRowIds,
      selectedCount: selectedRowIds.length,
      handleBulkDelete,
      handleBulkDeleteByFilter,
      handleBulkUpdateStatus,
      handleClearSelection,
      handleRowSelect,
    },
    deleteModal: {
      isOpen: deleteManager.isConfirmModalOpen,
      message: deleteManager.confirmationMessage,
      onConfirm: deleteManager.handleConfirm,
      onCancel: deleteManager.handleCancel,
      loading: deleteManager.isPending,
    },
    utils: { getDisplayName },
    ...restHookData,
  };
}
