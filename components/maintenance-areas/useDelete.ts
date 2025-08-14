// components/hooks/useDelete.ts
"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useTableDelete } from "@/hooks/database";
import { TableName } from "@/hooks/database";
import { DeleteProps } from "@/components/maintenance-areas/maintenance-areas-types";

export const useDelete = ({ tableName, onSuccess }: DeleteProps) => {
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