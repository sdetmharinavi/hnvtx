'use client'

import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { TableName } from '@/hooks/database';
import { useTableDelete } from '@/hooks/database';
import { useState } from 'react';

export const useDeleteManager = ({ tableName, onSuccess }: { tableName: TableName; onSuccess?: () => void; }) => {
  const supabase = createClient();
  const [itemToDelete, setItemToDelete] = useState<{ id: string; name: string } | null>(null);

  const { mutate: deleteMutation, isPending } = useTableDelete(supabase, tableName, {
    onSuccess: () => {
      toast.success(`"${itemToDelete?.name}" was deleted successfully.`);
      onSuccess?.();
      setItemToDelete(null);
    },
    onError: (error) => {
      toast.error(`Failed to delete: ${error.message}`);
      setItemToDelete(null);
    }
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
    confirmationMessage: `Are you sure you want to delete "${itemToDelete?.name}"? This action cannot be undone.`,
    itemToDelete,
    deleteSingle,
    handleConfirm,
    handleCancel,
  };
};

