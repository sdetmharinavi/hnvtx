// hooks/useCrudManager.ts
'use client';

import React, { useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
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
  PagedQueryResult,
} from '@/hooks/database';
import { toast } from 'sonner';
import { useDeleteManager } from './useDeleteManager';
import { useOnlineStatus } from './useOnlineStatus';
import { addMutationToQueue } from './data/useMutationQueue';
import { getTable } from './data/localDb';
import { useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { FiWifiOff } from 'react-icons/fi';
import { useDataSync } from '@/hooks/data/useDataSync';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { BaseRecord, CrudManagerOptions, UseCrudManagerReturn } from './crud/types';
import { useCrudState } from './crud/useCrudState';
import { useCrudModals } from './crud/useCrudModals';

// Re-export types for consumers
export type { BaseRecord, RecordWithId, DataQueryHookParams, DataQueryHookReturn } from './crud/types';

export function useCrudManager<T extends PublicTableName, V extends BaseRecord>({
  tableName,
  localTableName,
  dataQueryHook,
  searchColumn,
  displayNameField = 'name',
  processDataForSave,
  idType = 'string',
  initialFilters = {},
  syncTables,
}: CrudManagerOptions<T, V>): UseCrudManagerReturn<V> {
  const supabase = createClient();
  const isOnline = useOnlineStatus();
  const { sync: syncData, isSyncing: isSyncingData } = useDataSync();

  // --- 1. State Management (Refactored) ---
  const {
    pagination,
    search,
    filters: filterState,
    selection,
  } = useCrudState({ initialFilters });

  const { currentPage, pageLimit } = pagination;
  const { searchQuery } = search;
  const { filters } = filterState;
  const { selectedRowIds, setSelectedRowIds } = selection;

  // --- 2. Modal Management (Refactored) ---
  const { editModal, viewModal, closeAll: closeAllModals } = useCrudModals<V>();
  const editingRecord = editModal.record;

  // --- 3. Data Fetching ---
  const combinedFilters = useMemo(() => {
    const newFilters: Filters = { ...filters };
    if (searchQuery && searchColumn) {
      if (Array.isArray(searchColumn)) {
        newFilters.or = searchColumn.reduce((acc, col) => {
          acc[col as string] = searchQuery;
          return acc;
        }, {} as Record<string, string>);
      } else {
        newFilters[searchColumn as string] = { operator: 'ilike', value: `%${searchQuery}%` };
      }
    }
    return newFilters;
  }, [searchQuery, filters, searchColumn]);

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

  const handleRefresh = useCallback(async () => {
    if (isOnline && syncTables && syncTables.length > 0) {
      await syncData(syncTables);
    } else {
      refetch();
    }
  }, [isOnline, syncTables, syncData, refetch]);

  // --- 4. Sync Helpers ---
  const syncSingleRecord = useCallback(
    async (id: string | number) => {
      const targetTable = localTableName || tableName;
      try {
        const { data: result, error } = await supabase.rpc('get_paged_data', {
          p_view_name: targetTable,
          p_limit: 1,
          p_offset: 0,
          p_filters: { id: String(id) },
        });

        if (error) throw error;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const records = (result as any)?.data || [];
        if (records.length > 0) {
          const record = records[0];
          const table = getTable(targetTable);
          await table.put(record);
        }
      } catch (err) {
        console.error('[useCrudManager] Failed to sync single record:', err);
        refetch();
      }
    },
    [supabase, localTableName, tableName, refetch]
  );

  // --- 5. Mutations ---
  const { mutate: insertItem, isPending: isInserting } = useTableInsert(supabase, tableName, {
    optimisticUpdate: false,
    onSuccess: async (resData) => {
      toast.success('Record created successfully.');
      closeAllModals();
      if (resData && resData.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const newId = (resData[0] as any).id;
        await syncSingleRecord(newId);
      } else {
        refetch();
      }
    },
    onError: (err) => toast.error(`Failed to create record: ${err.message}`),
  });

  const { mutate: updateItem, isPending: isUpdating } = useTableUpdate(supabase, tableName, {
    optimisticUpdate: false,
    onSuccess: async (resData) => {
      toast.success('Record updated successfully.');
      closeAllModals();
      if (resData && resData.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const updatedId = (resData[0] as any).id;
        await syncSingleRecord(updatedId);
      } else {
        refetch();
      }
    },
    onError: (err) => toast.error(`Failed to update record: ${err.message}`),
  });

  const { mutate: toggleStatus } = useToggleStatus(supabase, tableName, {
    optimisticUpdate: false,
    onSuccess: async (resData) => {
      toast.success('Status updated successfully.');
      if (resData) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await syncSingleRecord((resData as any).id);
      } else {
        refetch();
      }
    },
    onError: (err) => toast.error(`Failed to update status: ${err.message}`),
  });

  // --- 6. Deletion Logic (Offline Aware) ---
  const handleLocalCleanup = useCallback(
    async (deletedIds: string[]) => {
      if (!deletedIds.length) return;
      const targetTable = localTableName || tableName;
      try {
        const table = getTable(targetTable);
        const idsToDelete =
          idType === 'number' ? deletedIds.map(Number).filter((n) => !isNaN(n)) : deletedIds;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await table.bulkDelete(idsToDelete as any[]);
      } catch (e) {
        console.error(`[useCrudManager] Cleanup failed for ${targetTable}:`, e);
      }
    },
    [tableName, localTableName, idType]
  );

  const QueryClient = useQueryClient();

  const deleteManager = useDeleteManager({
    tableName,
    onSuccess: async (deletedIds) => {
      await handleLocalCleanup(deletedIds);
      QueryClient.invalidateQueries({ queryKey: [`${localTableName || tableName}-data`] });
      selection.handleClearSelection();
    },
  });

  const { bulkUpdate } = useTableBulkOperations(supabase, tableName);
  const isMutating = isInserting || isUpdating || deleteManager.isPending || bulkUpdate.isPending;

  // --- 7. Display Utils ---
  const getDisplayName = useCallback(
    (record: V): string => {
      if (displayNameField) {
        const fields = Array.isArray(displayNameField) ? displayNameField : [displayNameField];
        for (const field of fields) {
          const name = record[field as string];
          if (name) return String(name);
        }
      }
      // Fallbacks
      if (record.name) return String(record.name);
      if (record.employee_name) return String(record.employee_name);
      if (record.first_name && record.last_name) return `${record.first_name} ${record.last_name}`;
      if (record.first_name) return String(record.first_name);
      return String(record.id) || 'Unknown';
    },
    [displayNameField]
  );

  // --- 8. Handlers ---

  const handleSave = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async (formData: any) => {
      const processedData = processDataForSave
        ? processDataForSave(formData)
        : (formData as TableInsert<T>);

      if (isOnline) {
        if (editingRecord && editingRecord.id) {
          updateItem({
            id: String(editingRecord.id),
            data: processedData as TableUpdate<T>,
          });
        } else {
          insertItem(processedData as TableInsert<T>);
        }
      } else {
        try {
          const targetTable = getTable(localTableName || tableName);

          if (editingRecord && editingRecord.id) {
            const idToUpdate = String(editingRecord.id);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (targetTable.update as any)(
              idType === 'number' ? Number(idToUpdate) : idToUpdate,
              processedData
            );
            await addMutationToQueue({
              tableName,
              type: 'update',
              payload: { id: idToUpdate, data: processedData },
            });
            toast.warning('Update queued (Offline). Sync pending.', {
              icon: React.createElement(FiWifiOff),
            });
          } else {
            const tempId = uuidv4();
            const newRecord = { ...processedData, id: tempId };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await targetTable.add(newRecord as any);
            await addMutationToQueue({
              tableName,
              type: 'insert',
              payload: newRecord,
            });
            toast.warning('Created offline. Sync pending.', {
              icon: React.createElement(FiWifiOff),
            });
          }
          refetch();
          closeAllModals();
        } catch (err) {
          toast.error(`Offline operation failed: ${(err as Error).message}`);
        }
      }
    },
    [
      isOnline,
      editingRecord,
      tableName,
      localTableName,
      processDataForSave,
      updateItem,
      insertItem,
      refetch,
      closeAllModals,
      idType,
    ]
  );

  const handleDelete = useCallback(
    async (record: V) => {
      if (!record.id) {
        toast.error('Cannot delete record: Invalid ID');
        return;
      }
      const idToDelete = String(record.id);
      const displayName = getDisplayName(record);
      const itemToDelete = { id: idToDelete, name: displayName };

      if (isOnline) {
        deleteManager.deleteSingle(itemToDelete);
      } else {
        deleteManager.deleteSingle(itemToDelete, async (ids) => {
          const targetTable = getTable(localTableName || tableName);
          const idKey = idType === 'number' ? Number(ids[0]) : ids[0];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await targetTable.delete(idKey as any);
          await addMutationToQueue({
            tableName,
            type: 'delete',
            payload: { ids: [ids[0]] },
          });
          toast.warning('Deleted offline. Sync pending.', { icon: React.createElement(FiWifiOff) });
          refetch();
        });
      }
    },
    [isOnline, deleteManager, getDisplayName, tableName, localTableName, idType, refetch]
  );

  const handleBulkUpdateStatus = useCallback(
    async (status: 'active' | 'inactive') => {
      if (selectedRowIds.length === 0) return;
      const newStatus = status === 'active';
      if (isOnline) {
        const updates = selectedRowIds.map((id) => ({
          id,
          data: { status: newStatus } as unknown as TableUpdate<T>,
        }));
        bulkUpdate.mutate(
          { updates },
          {
            onSuccess: () => {
              toast.success('Updated.');
              refetch();
              selection.handleClearSelection();
            },
          }
        );
      } else {
        try {
          const targetTable = getTable(localTableName || tableName);
          const idsKey = idType === 'number' ? selectedRowIds.map(Number) : selectedRowIds;
          await targetTable
            .where('id')
            .anyOf(idsKey)
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .modify({ status: newStatus } as any);

          for (const id of selectedRowIds) {
            await addMutationToQueue({
              tableName,
              type: 'update',
              payload: { id, data: { status: newStatus } },
            });
          }
          toast.warning('Status updated locally. Sync pending.', {
            icon: React.createElement(FiWifiOff),
          });
          refetch();
          selection.handleClearSelection();
        } catch (err) {
          toast.error(`Offline update failed.`);
          console.error(err);
        }
      }
    },
    [
      isOnline,
      selectedRowIds,
      tableName,
      localTableName,
      bulkUpdate,
      refetch,
      selection,
      idType,
    ]
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedRowIds.length === 0) {
      toast.error('No records selected');
      return;
    }

    // THE FIX: Explicitly type the 'record' parameter to V to resolve the implicit 'any' error.
    const selectedRecords = data
      .filter((record: V) => selectedRowIds.includes(String(record.id)))
      .map((record: V) => ({
        id: String(record.id),
        name: getDisplayName(record),
      }));

    if (isOnline) {
      deleteManager.deleteMultiple(selectedRecords);
    } else {
      deleteManager.deleteMultiple(selectedRecords, async (ids) => {
        const targetTable = getTable(localTableName || tableName);
        const idsKey = idType === 'number' ? ids.map(Number) : ids;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await targetTable.bulkDelete(idsKey as any[]);
        await addMutationToQueue({
          tableName,
          type: 'delete',
          payload: { ids: ids },
        });
        toast.warning(`Deleted ${ids.length} items locally. Sync pending.`, {
          icon: React.createElement(FiWifiOff),
        });
        refetch();
        selection.handleClearSelection();
      });
    }
  }, [
    isOnline,
    selectedRowIds,
    data,
    deleteManager,
    getDisplayName,
    tableName,
    localTableName,
    idType,
    refetch,
    selection,
  ]);

  const handleToggleStatus = useCallback(
    async (record: V) => {
      if (!record.id) {
        toast.error('Cannot update status: Invalid ID');
        return;
      }
      const idToUpdate = String(record.id);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const newStatus = !((record as any).status ?? false);

      if (isOnline) {
        toggleStatus({ id: idToUpdate, status: newStatus });
      } else {
        try {
          const targetTable = getTable(localTableName || tableName);
          const idKey = idType === 'number' ? Number(idToUpdate) : idToUpdate;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (targetTable.update as any)(idKey, { status: newStatus });
          await addMutationToQueue({
            tableName,
            type: 'update',
            payload: { id: idToUpdate, data: { status: newStatus } },
          });
          refetch();
          toast.warning('Status changed locally. Sync pending.', {
            icon: React.createElement(FiWifiOff),
          });
        } catch (err) {
          toast.error(`Offline status update failed: ${(err as Error).message}`);
        }
      }
    },
    [isOnline, tableName, localTableName, toggleStatus, refetch, idType]
  );

  const handleCellEdit = useCallback(
    async (record: V, column: Column<V>, newValue: string) => {
      if (!record.id) return;
      const id = String(record.id);
      const key = column.dataIndex;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData = { [key]: newValue } as any;

      if (isOnline) {
        updateItem({ id, data: updateData });
      } else {
        try {
          const targetTable = getTable(localTableName || tableName);
          const idKey = idType === 'number' ? Number(id) : id;
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (targetTable.update as any)(idKey, updateData);
          await addMutationToQueue({
            tableName,
            type: 'update',
            payload: { id, data: updateData },
          });
          refetch();
          toast.warning('Edit saved locally. Sync pending.', {
            icon: React.createElement(FiWifiOff),
          });
        } catch (err) {
          toast.error(`Offline edit failed: ${(err as Error).message}`);
        }
      }
    },
    [isOnline, updateItem, tableName, localTableName, idType, refetch]
  );

  const handleBulkDeleteByFilter = useCallback(
    (column: string, value: unknown, displayName: string) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deleteManager.deleteBulk({ column, value: value as any, displayName });
    },
    [deleteManager]
  );

  const handleRowSelect = useCallback(
    (rows: V[]) => {
      const validIds = rows
        .map((r) => r.id)
        .filter((id): id is NonNullable<typeof id> => id != null)
        .map(String);
      setSelectedRowIds(validIds);
    },
    [setSelectedRowIds]
  );

  // --- 9. Result ---
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
      } as unknown as UseQueryResult<PagedQueryResult<V>, Error>),
    [data, totalCount, isLoading, isFetching, isSyncingData, error, handleRefresh]
  );

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
    pagination,
    search,
    filters: filterState, // Return the whole filter state object
    queryResult,
    editModal,
    viewModal,
    actions: {
      handleSave,
      handleDelete,
      handleToggleStatus,
      handleCellEdit,
    },
    bulkActions: {
      selectedRowIds,
      selectedCount: selectedRowIds.length,
      handleBulkDelete,
      handleBulkDeleteByFilter,
      handleBulkUpdateStatus,
      handleClearSelection: selection.handleClearSelection,
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