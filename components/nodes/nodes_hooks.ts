'use client'

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';
import { TableName } from '@/hooks/database';
import { useTableDelete } from '@/hooks/database';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { nodeFormSchema, NodeForm, EMPTY_FORM_DATA, NodeWithRelations } from './nodes_types';

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

export const useNodeForm = (node: NodeWithRelations | null) => {
  const form = useForm<NodeForm>({
    resolver: zodResolver(nodeFormSchema),
    defaultValues: EMPTY_FORM_DATA,
  });

  // Prefill when editing an existing node and react to changes in `node`
  useEffect(() => {
    if (!node) {
      form.reset(EMPTY_FORM_DATA);
      return;
    }

    // Map node data to form data, handling type conversions and empty objects
    const formData: NodeForm = {
      name: node.name ?? "",
      node_type_id: node.node_type_id ?? null,
      ip_address: typeof node.ip_address === 'string' ? node.ip_address : null,
      latitude: node.latitude ?? null,
      longitude: node.longitude ?? null,
      vlan: typeof node.vlan === 'string' ? node.vlan : null,
      site_id: typeof node.site_id === 'string' ? node.site_id : null,
      builtup: typeof node.builtup === 'string' ? node.builtup : null,
      maintenance_terminal_id: node.maintenance_terminal_id ?? null,
      ring_id: node.ring_id ?? null,
      order_in_ring: node.order_in_ring ?? null,
      ring_status: typeof node.ring_status === 'string' ? node.ring_status : null,
      east_port: typeof node.east_port === 'string' ? node.east_port : null,
      west_port: typeof node.west_port === 'string' ? node.west_port : null,
      remark: typeof node.remark === 'string' ? node.remark : null,
      status: node.status ?? true,
    };

    form.reset(formData);
  }, [node, form]);

  return form;
};