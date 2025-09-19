// hooks/useDeleteManager.ts
import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { useTableDelete } from '@/hooks/database';
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
  value: unknown;
  displayName: string;
}

interface UseDeleteManagerProps {
  tableName: keyof Database['public']['Tables'];
  onSuccess?: () => void;
}

export function useDeleteManager({ tableName, onSuccess }: UseDeleteManagerProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [deleteConfig, setDeleteConfig] = useState<{
    type: 'single' | 'bulk';
    items?: DeleteItem[];
    filter?: BulkDeleteFilter;
  } | null>(null);

  const supabase = createClient();
  const { mutate: deleteRowsById, isPending } = useTableDelete(supabase, tableName);
  
  
  // Single item deletion
  const deleteSingle = useCallback((item: DeleteItem) => {
    setDeleteConfig({
      type: 'single',
      items: [item],
    });
    setIsConfirmModalOpen(true);
  }, []);

  // Multiple items deletion (by IDs)
  const deleteMultiple = useCallback((items: DeleteItem[]) => {
    setDeleteConfig({
      type: 'single', // Still uses ID-based deletion
      items,
    });
    setIsConfirmModalOpen(true);
  }, []);

  // Bulk deletion by filter
  const deleteBulk = useCallback((filter: BulkDeleteFilter) => {
    setDeleteConfig({
      type: 'bulk',
      filter,
    });
    setIsConfirmModalOpen(true);
  }, []);
  

  const handleConfirm = useCallback(async () => {
    if (!deleteConfig) return;

    setIsConfirmModalOpen(false);

    try {
      if (deleteConfig.type === 'single' && deleteConfig.items) {
        // Direct ID-based deletion
        const idsToDelete = deleteConfig.items.map(item => item.id);
        
        deleteRowsById(idsToDelete, {
          onSuccess: () => {
            const itemNames = deleteConfig.items!.map(item => item.name).join(', ');
            toast.success(
              deleteConfig.items!.length === 1
                ? `Successfully deleted "${itemNames}"`
                : `Successfully deleted ${deleteConfig.items!.length} items: ${itemNames}`
            );
            onSuccess?.();
          },
          onError: (err) => {
            console.error('Deletion failed:', err);
            if (hasDetails(err)) {
              toast.error('Failed to delete items'+ err.details);
            } else {
              toast.error('Failed to delete items');
            }
          },
        });
      } else if (deleteConfig.type === 'bulk' && deleteConfig.filter) {
        // First fetch IDs that match the filter, then delete
        const { data: rowsToDelete, error: fetchError } = await supabase
          .from(tableName)
          .select('id')
          .eq(deleteConfig.filter.column, deleteConfig.filter.value);

        if (fetchError) {
          throw fetchError;
        }

        if (!rowsToDelete || rowsToDelete.length === 0) {
          toast.error(`No items found matching "${deleteConfig.filter.displayName}" to delete.`);
          return;
        }

        const idsToDelete = rowsToDelete.map(row => row.id);
        
        deleteRowsById(idsToDelete, {
          onSuccess: () => {
            toast.success(
              `Successfully deleted ${idsToDelete.length} items from "${deleteConfig.filter!.displayName}"`
            );
            onSuccess?.();
          },
          onError: (err) => {
            console.error('Deletion failed:', err);
            if (hasDetails(err)) {
              toast.error('Failed to delete items'+ err.details);
            } else {
              toast.error('Failed to delete items');
            }
          },
        });
      }
    } catch (error) {
      console.error('Error during deletion:', error);
      toast.error('Failed to delete items');
    } finally {
      setDeleteConfig(null);
    }
  }, [deleteConfig, deleteRowsById, onSuccess, supabase, tableName]);

  const handleCancel = useCallback(() => {
    setIsConfirmModalOpen(false);
    setDeleteConfig(null);
  }, []);

  // Generate confirmation message
  const getConfirmationMessage = useCallback(() => {
    if (!deleteConfig) return '';

    if (deleteConfig.type === 'single' && deleteConfig.items) {
      const items = deleteConfig.items;
      if (items.length === 1) {
        return `Are you sure you want to delete "${items[0].name}"? This cannot be undone.`;
      }
      return `Are you sure you want to delete ${items.length} items? This cannot be undone.`;
    }

    if (deleteConfig.type === 'bulk' && deleteConfig.filter) {
      return `Are you sure you want to delete all items in "${deleteConfig.filter.displayName}"? This cannot be undone.`;
    }

    return 'Are you sure you want to delete? This cannot be undone.';
  }, [deleteConfig]);

  console.log('Delete Config:', deleteConfig);
  console.log('isConfirmModalOpen:', isConfirmModalOpen);
  
  

  return {
    // Actions
    deleteSingle,
    deleteMultiple,
    deleteBulk,
    handleConfirm,
    handleCancel,
    
    // State
    isConfirmModalOpen,
    isPending,
    confirmationMessage: getConfirmationMessage(),
    
    // For debugging/display
    deleteConfig,
  };
}

