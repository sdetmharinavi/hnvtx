// path: components/route-manager/JcFormModal.tsx
'use client';

import { useEffect, useMemo } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/common/ui';
import { FormCard, FormInput, FormSearchableSelect } from '@/components/common/form';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { junction_closuresInsertSchema, V_nodes_completeRowSchema } from '@/schemas/zod-schemas';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import { JointBox } from '@/schemas/custom-schemas';
import { useDropdownOptions } from '@/hooks/data/useDropdownOptions';

interface JcFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  routeId: string | null;
  editingJc: JointBox | null;
  rkm: number | null;
}

export const JcFormModal: React.FC<JcFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  routeId,
  editingJc,
  rkm,
}) => {
  const supabase = createClient();
  const isEditMode = !!editingJc;

  // 1. Fetch ALL active nodes
  const { originalData: allNodesRaw, isLoading: isLoadingNodes } = useDropdownOptions({
    tableName: 'v_nodes_complete',
    valueField: 'id',
    labelField: 'name',
    filters: { status: true },
    orderBy: 'name',
  });

  const jcOptions: Option[] = useMemo(() => {
    // Cast to correct type
    const nodes = (allNodesRaw || []) as unknown as V_nodes_completeRowSchema[];

    // Debugging: Check what data is actually loaded
    console.log('JcFormModal: Loaded Nodes:', nodes.length, nodes);

    if (nodes.length === 0) return [];

    // 2. Strict Filter: Look for specific types
    const filteredNodes = nodes.filter((n) => {
      const typeName = n.node_type_name?.toLowerCase() || '';
      const typeCode = n.node_type_code?.toUpperCase() || '';
      const nodeName = n.name?.toLowerCase() || '';

      return (
        typeCode === 'BJC' ||
        typeCode === 'JC' ||
        typeName.includes('joint') ||
        typeName.includes('splice') ||
        typeName.includes('closure') ||
        typeName.includes('chamber') ||
        typeName.includes('handhole') ||
        typeName.includes('manhole') ||
        // Fallback: If the node name itself suggests it's a joint
        nodeName.includes('jc') ||
        nodeName.includes('joint')
      );
    });

    // 3. Fallback Strategy:
    // If strict filtering returns nothing, show ALL nodes so the user isn't blocked.
    // Otherwise, show the filtered list.
    const finalNodes = filteredNodes.length > 0 ? filteredNodes : nodes;

    console.log(finalNodes);

    return finalNodes.map((n) => ({
      value: n.id!,
      // Show type in label to help distinguish if we fallback to showing all
      label: `${n.name} (${n.node_type_name || 'Unknown Type'})`,
    }));
  }, [allNodesRaw]);

  // Local form schema
  const junction_closuresFormSchema = junction_closuresInsertSchema.pick({
    node_id: true,
    position_km: true,
  });
  type JcFormValues = z.infer<typeof junction_closuresFormSchema>;

  const {
    register,
    handleSubmit,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<JcFormValues>({
    resolver: zodResolver(junction_closuresFormSchema),
    defaultValues: {
      node_id: '',
      position_km: null,
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (editingJc) {
        reset({
          node_id: editingJc.node_id,
          position_km:
            editingJc.attributes.position_on_route && rkm
              ? Number(((editingJc.attributes.position_on_route / 100) * rkm).toFixed(3))
              : editingJc.position_km || null,
        });
      } else {
        reset({
          node_id: '',
          position_km: null,
        });
      }
    }
  }, [isOpen, editingJc, reset, rkm]);

  const handleValidSubmit = async (formData: JcFormValues) => {
    if (!routeId) {
      toast.error('No route selected to add the JC to.');
      return;
    }

    if (formData.position_km && rkm && Number(formData.position_km) > Number(rkm)) {
      toast.error(
        `Position (${formData.position_km} km) cannot be greater than Cable length (${rkm} km).`
      );
      return;
    }

    try {
      if (isEditMode && editingJc) {
        const { error } = await supabase
          .from('junction_closures')
          .update({
            node_id: formData.node_id,
            position_km: formData.position_km,
          })
          .eq('id', editingJc.id)
          .select();

        if (error) throw error;
      } else {
        const { error } = await supabase.rpc('add_junction_closure', {
          p_node_id: formData.node_id,
          p_ofc_cable_id: routeId,
          p_position_km: formData.position_km || 0,
        });

        if (error) throw error;
      }

      onSave();
      toast.success(`Junction Closure ${isEditMode ? 'updated' : 'created'} successfully!`);
      onClose();
    } catch (error) {
      console.error('Error in handleValidSubmit:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} JC: ${message}`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? 'Edit Junction Closure' : 'Add Junction Closure'}
    >
      <FormCard
        title={isEditMode ? 'Edit Junction Closure' : 'Add Junction Closure'}
        onSubmit={handleSubmit(handleValidSubmit, () =>
          toast.error('Please fix the highlighted fields')
        )}
        onCancel={onClose}
        isLoading={isSubmitting || isLoadingNodes}
        heightClass="max-h-[80vh] overflow-y-auto"
        standalone
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSearchableSelect
            name="node_id"
            label="Junction Closure"
            control={control}
            options={jcOptions}
            error={errors.node_id}
            required
            placeholder={isLoadingNodes ? 'Loading options...' : 'Select a Junction Closure'}
            isLoading={isLoadingNodes}
            searchPlaceholder="Search Nodes..."
          />
          <FormInput
            name="position_km"
            label="Position on Route (km)"
            type="number"
            step="0.001"
            register={register}
            error={errors.position_km}
            placeholder="e.g., 12.5"
          />
        </div>
      </FormCard>
    </Modal>
  );
};
