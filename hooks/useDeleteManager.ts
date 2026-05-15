// hooks/useDeleteManager.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTableBulkOperations } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase-types';
import { useAdminBulkDeleteUsers } from '@/hooks/data/useAdminUserMutations';
import { PostgrestError } from '@supabase/supabase-js';

interface DeleteItem {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface BulkDeleteFilter {
  column: string;
  value: string | number | boolean | null;
  displayName: string;
}

interface UseDeleteManagerProps {
  tableName: keyof Database['public']['Tables'];
  onSuccess?: (deletedIds: string[]) => void;
}

export function useDeleteManager({ tableName, onSuccess }: UseDeleteManagerProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<DeleteItem[]>([]);
  const [bulkFilter, setBulkFilter] = useState<BulkDeleteFilter | null>(null);
  const [itemToDelete, setItemToDelete] = useState<DeleteItem | null>(null);

  const supabase = createClient();
  const { mutate: genericBulkDelete, isPending: isGenericDeletePending } = useTableBulkOperations(
    supabase,
    tableName
  ).bulkDelete;
  const { mutate: userDelete, isPending: isUserDeletePending } = useAdminBulkDeleteUsers();

  const isPending = isGenericDeletePending || isUserDeletePending;

  const deleteSingle = useCallback((item: DeleteItem) => {
    setItemsToDelete([item]);
    setItemToDelete(item);
    setBulkFilter(null);
    setIsConfirmModalOpen(true);
  }, []);

  const deleteMultiple = useCallback((items: DeleteItem[]) => {
    setItemsToDelete(items);
    setItemToDelete(null);
    setBulkFilter(null);
    setIsConfirmModalOpen(true);
  }, []);

  const deleteBulk = useCallback((filter: BulkDeleteFilter) => {
    setItemsToDelete([]);
    setItemToDelete(null);
    setBulkFilter(filter);
    setIsConfirmModalOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsConfirmModalOpen(false);
    setItemsToDelete([]);
    setBulkFilter(null);
    setItemToDelete(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    const idsToDelete = itemsToDelete.map((item) => item.id);

    const mutationOptions = {
      onSuccess: () => {
        const successMessage =
          itemsToDelete.length === 1
            ? `Successfully deleted "${itemsToDelete[0].name}"`
            : itemsToDelete.length > 1
            ? `Successfully deleted ${itemsToDelete.length} items.`
            : `Successfully performed bulk delete.`;
        toast.success(successMessage);
        onSuccess?.(idsToDelete);
        handleCancel();
      },
      onError: (err: Error) => {
        const pgError = err as unknown as PostgrestError;
        if (pgError.code === '23503') {
          const details = pgError.details || pgError.message;
          const tableMatch = details.match(/table "([^"]+)"/g);
          let blockingTable = 'another record';
          if (tableMatch && tableMatch.length >= 2) {
            blockingTable = tableMatch[1].replace(/"/g, '').replace('table ', '');
          }
          toast.error('Deletion Failed: Dependency Detected', {
            description: `This record cannot be deleted because it is being used in the '${blockingTable}' table. Please remove or reassign the dependent records first.`,
            duration: 6000,
          });
        } else {
          toast.error(`Deletion failed: ${err.message}`);
        }
        handleCancel();
      },
    };

    if (tableName === 'user_profiles') {
      if (itemsToDelete.length > 0) {
        userDelete({ user_ids: idsToDelete }, mutationOptions);
      } else {
        toast.error('Bulk delete by filter is not supported for users.');
        handleCancel();
      }
    } else {
      if (itemsToDelete.length > 0) {
        genericBulkDelete({ ids: idsToDelete }, mutationOptions);
      } else if (bulkFilter) {
        genericBulkDelete({ filters: { [bulkFilter.column]: bulkFilter.value } }, mutationOptions);
      }
    }
  }, [
    tableName,
    itemsToDelete,
    onSuccess,
    userDelete,
    handleCancel,
    bulkFilter,
    genericBulkDelete,
  ]);

  const getConfirmationMessage = useCallback(() => {
    const suffix = ' This action cannot be undone.';
    if (itemsToDelete.length > 0) {
      if (itemsToDelete.length === 1) {
        return `Are you sure you want to delete "${itemsToDelete[0].name}"?${suffix}`;
      }
      return `Are you sure you want to delete these ${itemsToDelete.length} items?${suffix}`;
    }
    if (bulkFilter) {
      return `Are you sure you want to delete all items in "${bulkFilter.displayName}"?${suffix}`;
    }
    return 'Are you sure you want to proceed?';
  }, [itemsToDelete, bulkFilter]);

  return {
    deleteSingle,
    deleteMultiple,
    deleteBulk,
    handleConfirm,
    handleCancel,
    isConfirmModalOpen,
    isPending,
    confirmationMessage: getConfirmationMessage(),
    itemToDelete: itemToDelete || (itemsToDelete.length > 0 ? itemsToDelete[0] : null),
  };
}