// hooks/useDeleteManager.ts
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

type CustomDeleteHandler = (ids: string[]) => Promise<void>;

export function useDeleteManager({ tableName, onSuccess }: UseDeleteManagerProps) {
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [itemsToDelete, setItemsToDelete] = useState<DeleteItem[]>([]);
  const [bulkFilter, setBulkFilter] = useState<BulkDeleteFilter | null>(null);
  const [itemToDelete, setItemToDelete] = useState<DeleteItem | null>(null);
  const [customDeleteAction, setCustomDeleteAction] = useState<CustomDeleteHandler | null>(null);
  const [isCustomLoading, setIsCustomLoading] = useState(false);

  const supabase = createClient();
  const { mutate: genericBulkDelete, isPending: isGenericDeletePending } = useTableBulkOperations(
    supabase,
    tableName
  ).bulkDelete;
  const { mutate: userDelete, isPending: isUserDeletePending } = useAdminBulkDeleteUsers();

  const isPending = isGenericDeletePending || isUserDeletePending || isCustomLoading;

  const deleteSingle = useCallback((item: DeleteItem, customHandler?: CustomDeleteHandler) => {
    setItemsToDelete([item]);
    setItemToDelete(item);
    setBulkFilter(null);
    if (customHandler) setCustomDeleteAction(() => customHandler);
    setIsConfirmModalOpen(true);
  }, []);

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
    setCustomDeleteAction(null);
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
        onSuccess?.(idsToDelete);
        handleCancel();
      } catch (error) {
        console.error("Custom delete failed:", error);
        // Toast is handled by UI/Action usually, but adding a fallback here
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

        // THE FIX: Enhanced Error Parsing for Foreign Key Violations
        if (pgError.code === "23503") {
          // Extracts table name from: '... update or delete on table "systems" violates foreign key constraint ... on table "system_connections"'
          const details = pgError.details || pgError.message;
          const tableMatch = details.match(/table "([^"]+)"/g);

          let blockingTable = "another record";
          if (tableMatch && tableMatch.length >= 2) {
            // The second match is usually the referencing (blocking) table
            // E.g. "table "systems"" ... "table "system_connections""
            blockingTable = tableMatch[1].replace(/"/g, "").replace("table ", "");
          }

          toast.error("Deletion Failed: Dependency Detected", {
            description: `This record cannot be deleted because it is being used in the '${blockingTable}' table. Please remove or reassign the dependent records first.`,
            duration: 6000, // Longer duration for reading
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
