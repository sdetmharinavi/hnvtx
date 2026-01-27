// hooks/crud/useCrudMutations.ts
import React, { useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import { FiWifiOff } from 'react-icons/fi';
import { createClient } from '@/utils/supabase/client';
import {
  useTableInsert,
  useTableUpdate,
  useToggleStatus,
  useTableBulkOperations,
  TableInsert,
  TableUpdate,
  TableInsertWithDates,
  PublicTableName,
} from '@/hooks/database';
import { useDeleteManager } from '@/hooks/useDeleteManager';
import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { addMutationToQueue } from '@/hooks/data/useMutationQueue';
import { getTable } from '@/hooks/data/localDb';
import { Column } from '@/hooks/database/excel-queries/excel-helpers';
import { BaseRecord, CrudMutationOptions, RecordWithId } from './types';

export function useCrudMutations<T extends PublicTableName, V extends BaseRecord>({
  tableName,
  localTableName,
  idType = 'string',
  displayNameField = 'name',
  processDataForSave,
  refetch,
}: CrudMutationOptions<T, V>) {
  const supabase = createClient();
  const isOnline = useOnlineStatus();

  // --- Display Name Helper ---
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
    [displayNameField]
  );

  // --- Sync Helper ---
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
        console.error('[useCrudMutations] Failed to sync single record:', err);
        if (refetch) refetch();
      }
    },
    [supabase, localTableName, tableName, refetch]
  );

  // --- Standard Mutations ---
  
  const onSuccessWrapper = async (data: unknown) => {
    if (Array.isArray(data) && data.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = (data[0] as any).id;
      await syncSingleRecord(id);
    } else {
      if (refetch) refetch();
    }
  };

  const { mutate: insertItem, isPending: isInserting } = useTableInsert(supabase, tableName, {
    optimisticUpdate: false,
    onSuccess: async (data) => {
      toast.success('Record created successfully.');
      await onSuccessWrapper(data);
    },
    onError: (error) => toast.error(`Failed to create record: ${error.message}`),
  });

  const { mutate: updateItem, isPending: isUpdating } = useTableUpdate(supabase, tableName, {
    optimisticUpdate: false,
    onSuccess: async (data) => {
      toast.success('Record updated successfully.');
      await onSuccessWrapper(data);
    },
    onError: (error) => toast.error(`Failed to update record: ${error.message}`),
  });

  const { mutate: toggleStatus } = useToggleStatus(supabase, tableName, {
    optimisticUpdate: false,
    onSuccess: async (data) => {
      toast.success('Status updated successfully.');
      if (data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await syncSingleRecord((data as any).id);
      } else {
        if (refetch) refetch();
      }
    },
    onError: (error) => toast.error(`Failed to update status: ${error.message}`),
  });

  const { bulkUpdate } = useTableBulkOperations(supabase, tableName);

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
        console.error(`[useCrudMutations] Cleanup failed for ${targetTable}:`, e);
      }
    },
    [tableName, localTableName, idType]
  );

  const deleteManager = useDeleteManager({
    tableName,
    onSuccess: async (deletedIds) => {
      await handleLocalCleanup(deletedIds);
      if (refetch) refetch();
    },
  });

  // --- Handlers ---

  const handleSave = useCallback(
    async (formData: TableInsertWithDates<T>, editingRecord?: V) => {
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
          if (refetch) refetch();
        } catch (err) {
          toast.error(`Offline operation failed: ${(err as Error).message}`);
        }
      }
    },
    [
      isOnline,
      tableName,
      localTableName,
      processDataForSave,
      updateItem,
      insertItem,
      refetch,
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
          if (refetch) refetch();
        });
      }
    },
    [isOnline, deleteManager, getDisplayName, tableName, localTableName, idType, refetch]
  );

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
          if (refetch) refetch();
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
          if (refetch) refetch();
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

  const handleBulkUpdateStatus = useCallback(
    async (status: 'active' | 'inactive', selectedRowIds: string[], clearSelection: () => void) => {
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
              if (refetch) refetch();
              clearSelection();
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
          if (refetch) refetch();
          clearSelection();
        } catch (err) {
          toast.error(`Offline update failed.`);
          console.error(err);
        }
      }
    },
    [
      isOnline,
      tableName,
      localTableName,
      bulkUpdate,
      refetch,
      idType,
    ]
  );

  const handleBulkDelete = useCallback(
    async (selectedRowIds: string[], data: V[], clearSelection: () => void) => {
      if (selectedRowIds.length === 0) {
        toast.error('No records selected');
        return;
      }

      const selectedRecords = data
        .filter((record) => selectedRowIds.includes(String(record.id)))
        .map((record) => ({
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
          if (refetch) refetch();
          clearSelection();
        });
      }
    },
    [isOnline, deleteManager, getDisplayName, tableName, localTableName, idType, refetch]
  );

  return {
    isMutating: isInserting || isUpdating || deleteManager.isPending || bulkUpdate.isPending,
    deleteModal: {
      isOpen: deleteManager.isConfirmModalOpen,
      message: deleteManager.confirmationMessage,
      onConfirm: deleteManager.handleConfirm,
      onCancel: deleteManager.handleCancel,
      loading: deleteManager.isPending,
    },
    actions: {
      handleSave,
      handleDelete,
      handleToggleStatus,
      handleCellEdit,
      handleBulkUpdateStatus,
      handleBulkDelete,
    },
    utils: { getDisplayName }
  };
}