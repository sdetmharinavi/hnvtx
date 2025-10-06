// path: hooks/useDeleteManager.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTableBulkOperations } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase-types';
import { useAdminBulkDeleteUsers } from '@/hooks/useAdminUsers'; // <-- IMPORT THE CORRECT HOOK

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
  onSuccess?: () => void;
}

export function useDeleteManager({ tableName, onSuccess }: UseDeleteManagerProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<DeleteItem[]>([]);
  const [bulkFilter, setBulkFilter] = useState<BulkDeleteFilter | null>(null);

  const supabase = createClient();

  // ---  USE THE CORRECT MUTATION BASED ON TABLE NAME ---

  // 1. Get the generic bulk delete for all other tables.
  const { mutate: genericBulkDelete, isPending: isGenericDeletePending } = useTableBulkOperations(supabase, tableName).bulkDelete;
  
  // 2. Get the specific, API-driven user delete mutation.
  const { mutate: userDelete, isPending: isUserDeletePending } = useAdminBulkDeleteUsers();

  // 3. The overall loading state depends on which mutation is active.
  const isPending = isGenericDeletePending || isUserDeletePending;

  const deleteSingle = useCallback((item: DeleteItem) => {
    setItemsToDelete([item]);
    setBulkFilter(null);
    setIsConfirmModalOpen(true);
  }, []);

  const deleteMultiple = useCallback((items: DeleteItem[]) => {
    setItemsToDelete(items);
    setBulkFilter(null);
    setIsConfirmModalOpen(true);
  }, []);

  const deleteBulk = useCallback((filter: BulkDeleteFilter) => {
    setItemsToDelete([]);
    setBulkFilter(filter);
    setIsConfirmModalOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsConfirmModalOpen(false);
    setItemsToDelete([]);
    setBulkFilter(null);
  }, []);

  const handleConfirm = useCallback(async () => {
    const mutationOptions = {
      onSuccess: () => {
        const successMessage = itemsToDelete.length === 1
          ? `Successfully deleted "${itemsToDelete[0].name}"`
          : itemsToDelete.length > 1
            ? `Successfully deleted ${itemsToDelete.length} items.`
            : `Successfully performed bulk delete.`;
        toast.success(successMessage);
        onSuccess?.();
      },
      onError: (err: Error) => toast.error(`Deletion failed: ${err.message}`),
      onSettled: () => {
        setIsConfirmModalOpen(false);
        setItemsToDelete([]);
        setBulkFilter(null);
      }
    };

    // 4. THE CORE LOGIC: Check the table name and call the appropriate mutation.
    if (tableName === 'user_profiles') {
      if (itemsToDelete.length > 0) {
        const idsToDelete = itemsToDelete.map(item => item.id);
        userDelete({ user_ids: idsToDelete }, mutationOptions);
      } else {
        toast.error("Bulk delete by filter is not supported for users.");
        handleCancel();
      }
    } else {
      // For all other tables, use the generic client-side delete.
      if (itemsToDelete.length > 0) {
        const idsToDelete = itemsToDelete.map(item => item.id);
        genericBulkDelete({ ids: idsToDelete }, mutationOptions);
      } else if (bulkFilter) {
        genericBulkDelete({ filters: { [bulkFilter.column]: bulkFilter.value } }, mutationOptions);
      }
    }
  }, [tableName, itemsToDelete, onSuccess, userDelete, handleCancel, bulkFilter, genericBulkDelete]);

  const getConfirmationMessage = useCallback(() => {
    if (itemsToDelete.length > 0) {
      if (itemsToDelete.length === 1) {
        return `Are you sure you want to delete "${itemsToDelete[0].name}"? This action is permanent and will remove the user's login access.`;
      }
      return `Are you sure you want to delete these ${itemsToDelete.length} items? This action is permanent.`;
    }
    if (bulkFilter) {
      return `Are you sure you want to delete all items in "${bulkFilter.displayName}"? This cannot be undone.`;
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
    deleteConfig: { items: itemsToDelete, filter: bulkFilter },
  };
}