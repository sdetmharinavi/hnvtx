// path: hooks/useDeleteManager.ts
import { useState, useCallback } from "react";
import { toast } from "sonner";
import { useTableBulkOperations } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { Database } from "@/types/supabase-types";
import { useAdminBulkDeleteUsers } from "@/hooks/data/useAdminUserMutations";
import { PostgrestError } from "@supabase/supabase-js";

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
  tableName: keyof Database["public"]["Tables"];
  onSuccess?: (deletedIds: string[]) => void;
}

// New type for custom delete handlers (e.g. offline queue)
type CustomDeleteHandler = (ids: string[]) => Promise<void>;

export function useDeleteManager({ tableName, onSuccess }: UseDeleteManagerProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<DeleteItem[]>([]);
  const [bulkFilter, setBulkFilter] = useState<BulkDeleteFilter | null>(null);
  const [itemToDelete, setItemToDelete] = useState<DeleteItem | null>(null);

  // NEW: State to hold a one-time custom handler for the current operation
  const [customDeleteAction, setCustomDeleteAction] = useState<CustomDeleteHandler | null>(null);

  const supabase = createClient();

  const { mutate: genericBulkDelete, isPending: isGenericDeletePending } = useTableBulkOperations(
    supabase,
    tableName
  ).bulkDelete;
  const { mutate: userDelete, isPending: isUserDeletePending } = useAdminBulkDeleteUsers();

  // We manage our own loading state for custom actions
  const [isCustomLoading, setIsCustomLoading] = useState(false);
  const isPending = isGenericDeletePending || isUserDeletePending || isCustomLoading;

  // UPDATED: Accept an optional customHandler
  const deleteSingle = useCallback((item: DeleteItem, customHandler?: CustomDeleteHandler) => {
    setItemsToDelete([item]);
    setItemToDelete(item);
    setBulkFilter(null);
    if (customHandler) setCustomDeleteAction(() => customHandler);
    setIsConfirmModalOpen(true);
  }, []);

  // UPDATED: Accept an optional customHandler
  const deleteMultiple = useCallback((items: DeleteItem[], customHandler?: CustomDeleteHandler) => {
    setItemsToDelete(items);
    setItemToDelete(null);
    setBulkFilter(null);
    if (customHandler) setCustomDeleteAction(() => customHandler);
    setIsConfirmModalOpen(true);
  }, []);

  const deleteBulk = useCallback((filter: BulkDeleteFilter) => {
    setItemsToDelete([]);
    setItemToDelete(null);
    setBulkFilter(filter);
    setCustomDeleteAction(null); // Bulk filter delete is complex, usually online only
    setIsConfirmModalOpen(true);
  }, []);

  const handleCancel = useCallback(() => {
    setIsConfirmModalOpen(false);
    setItemsToDelete([]);
    setBulkFilter(null);
    setItemToDelete(null);
    setCustomDeleteAction(null);
    setIsCustomLoading(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    const idsToDelete = itemsToDelete.map((item) => item.id);

    // 1. Handle Custom Logic (e.g. Offline Queue)
    if (customDeleteAction) {
      setIsCustomLoading(true);
      try {
        await customDeleteAction(idsToDelete);
        // Custom handler should handle its own toasts, but we ensure cleanup
        onSuccess?.(idsToDelete);
        handleCancel();
      } catch (error) {
        console.error("Custom delete failed:", error);
        toast.error("Failed to delete items.");
      } finally {
        setIsCustomLoading(false);
      }
      return;
    }

    // 2. Standard Online Logic
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
      },
      onError: (err: Error) => {
        const pgError = err as unknown as PostgrestError;
        if (pgError.code === "23503") {
          const matches = pgError.message.match(/on table "([^"]+)"/g);
          let referencingTable = "another table";
          if (matches && matches.length >= 2) {
            const lastMatch = matches[matches.length - 1];
            const tableNameMatch = lastMatch.match(/"([^"]+)"/);
            if (tableNameMatch) referencingTable = tableNameMatch[1];
          } else if (pgError.details) {
            const detailMatch = pgError.details.match(/from table "([^"]+)"/);
            if (detailMatch) referencingTable = detailMatch[1];
          }
          toast.error("Deletion Blocked", {
            description: `Cannot delete this item because it is currently used by records in the '${referencingTable}' table. Please delete or reassign those records first.`,
            duration: 8000,
          });
        } else {
          toast.error(`Deletion failed: ${err.message}`);
        }
      },
      onSettled: () => {
        handleCancel();
      },
    };

    if (tableName === "user_profiles") {
      if (itemsToDelete.length > 0) {
        userDelete({ user_ids: idsToDelete }, mutationOptions);
      } else {
        toast.error("Bulk delete by filter is not supported for users.");
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
    customDeleteAction,
  ]);

  const getConfirmationMessage = useCallback(() => {
    // Customize message for offline mode
    const suffix = customDeleteAction
      ? " (Offline Mode: Will sync later)"
      : " This action cannot be undone.";

    if (itemsToDelete.length > 0) {
      if (itemsToDelete.length === 1) {
        return `Are you sure you want to delete "${itemsToDelete[0].name}"?${suffix}`;
      }
      return `Are you sure you want to delete these ${itemsToDelete.length} items?${suffix}`;
    }
    if (bulkFilter) {
      return `Are you sure you want to delete all items in "${bulkFilter.displayName}"?${suffix}`;
    }
    return "Are you sure you want to proceed?";
  }, [itemsToDelete, bulkFilter, customDeleteAction]);

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
