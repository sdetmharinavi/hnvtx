// path: hooks/useDeleteManager.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTableBulkOperations } from '@/hooks/database'; // CORRECTED: Import bulk operations
import { createClient } from '@/utils/supabase/client';
import { Database } from '@/types/supabase-types';
import { hasDetails } from '@/types/error-types';

interface DeleteItem {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface BulkDeleteFilter {
  column: string;
  // CORRECTED: Changed 'unknown' to a more specific, type-safe union
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
  const { mutate: bulkDelete, isPending } = useTableBulkOperations(supabase, tableName).bulkDelete;

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
  

  const handleConfirm = useCallback(async () => {
    if (itemsToDelete.length > 0) {
        const idsToDelete = itemsToDelete.map(item => item.id);
        bulkDelete({ ids: idsToDelete }, {
            onSuccess: () => {
              const successMessage = itemsToDelete.length === 1
                ? `Successfully deleted "${itemsToDelete[0].name}"`
                : `Successfully deleted ${itemsToDelete.length} items.`;
              toast.success(successMessage);
              onSuccess?.();
            },
            onError: (err) => toast.error(`Deletion failed: ${err.message}`),
            onSettled: () => {
                setIsConfirmModalOpen(false);
                setItemsToDelete([]);
            }
        });
    } else if (bulkFilter) {
        // This is now type-safe because bulkFilter.value is no longer 'unknown'
        bulkDelete({ filters: { [bulkFilter.column]: bulkFilter.value } }, {
            onSuccess: () => {
              toast.success(`Successfully deleted all items in "${bulkFilter.displayName}"`);
              onSuccess?.();
            },
            onError: (err) => toast.error(`Bulk deletion failed: ${err.message}`),
            onSettled: () => {
                setIsConfirmModalOpen(false);
                setBulkFilter(null);
            }
        });
    }
  }, [itemsToDelete, bulkFilter, bulkDelete, onSuccess]);

  const handleCancel = useCallback(() => {
    setIsConfirmModalOpen(false);
    setItemsToDelete([]);
    setBulkFilter(null);
  }, []);

  const getConfirmationMessage = useCallback(() => {
    if (itemsToDelete.length > 0) {
      if (itemsToDelete.length === 1) {
        return `Are you sure you want to delete "${itemsToDelete[0].name}"? This cannot be undone.`;
      }
      return `Are you sure you want to delete these ${itemsToDelete.length} items? This cannot be undone.`;
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