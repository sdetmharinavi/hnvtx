// hooks/useNodesMutations.ts
import { useCallback } from 'react';
import { toast } from 'sonner';
import { useTableInsert, useTableUpdate, useToggleStatus } from '@/hooks/database';
import { useDeleteManager } from '@/components/nodes/nodes_hooks';
import { createClient } from '@/utils/supabase/client';
import { NodeWithRelations } from '@/components/nodes/nodes_types';

interface UseNodesMutationsProps {
  onSuccess: () => void;
  refetchNodes: () => void;
}

export const useNodesMutations = ({ 
  onSuccess, 
  refetchNodes 
}: UseNodesMutationsProps) => {
  const supabase = createClient();

  const onMutationSuccess = useCallback((message: string) => {
    toast.success(message);
    refetchNodes();
    onSuccess();
  }, [onSuccess, refetchNodes]);

  const createNodeMutation = useTableInsert(supabase, "nodes", {
    onSuccess: () => onMutationSuccess("Node created successfully."),
    onError: (err) => toast.error(`Creation failed: ${err.message}`),
  });

  const updateNodeMutation = useTableUpdate(supabase, "nodes", {
    onSuccess: () => onMutationSuccess("Node updated successfully."),
    onError: (err) => toast.error(`Update failed: ${err.message}`),
  });

  const toggleStatusMutation = useToggleStatus(supabase, "nodes", {
    onSuccess: refetchNodes,
  });

  const deleteManager = useDeleteManager({
    tableName: "nodes",
    onSuccess: refetchNodes,
  });

  const handleFormSubmit = useCallback((
    data: NodeWithRelations, 
    editingNode: NodeWithRelations | null
  ) => {
    if (editingNode) {
      updateNodeMutation.mutate({ id: editingNode.id, data });
    } else {
      createNodeMutation.mutate(data);
    }
  }, [createNodeMutation, updateNodeMutation]);

  return {
    createNodeMutation,
    updateNodeMutation,
    toggleStatusMutation,
    deleteManager,
    handleFormSubmit,
  };
};