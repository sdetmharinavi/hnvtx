import { useState } from "react";
import { useTableDelete } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { TableName } from "@/hooks/database";

export const useDelete = ({ tableName, onSuccess }: { tableName: TableName; onSuccess?: () => void }) => {
  const supabase = createClient();
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  const { mutate: deleteMutation, isPending } = useTableDelete(supabase, tableName as TableName, {
    onSuccess: () => {
      onSuccess?.();
      setItemToDelete(null);
    },
  });

  const deleteSingle = (item: { id: string; name: string }) => {
    setItemToDelete(item);
  };

  const handleConfirm = () => {
    if (itemToDelete) {
      deleteMutation(itemToDelete.id);
    }
  };

  const handleCancel = () => {
    setItemToDelete(null);
  };

  return {
    isConfirmModalOpen: itemToDelete !== null,
    isPending,
    itemToDelete,
    confirmationMessage: `Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`,
    deleteSingle,
    handleConfirm,
    handleCancel,
  };
};