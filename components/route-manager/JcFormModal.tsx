// components/route-manager/JcFormModal.tsx
'use client';

import { useEffect, useMemo } from 'react';
import { z } from 'zod';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput, FormSearchableSelect } from '@/components/common/form';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { junction_closuresInsertSchema, V_nodes_completeRowSchema } from '@/schemas/zod-schemas';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import { JointBox } from '@/schemas/custom-schemas';
import { useDropdownOptions } from '@/hooks/data/useDropdownOptions';
import { BaseFormModal } from '@/components/common/form/BaseFormModal';
import { useQueryClient } from '@tanstack/react-query'; // Added
import { useDataSync } from '@/hooks/data/useDataSync'; // Added
import { useOnlineStatus } from '@/hooks/useOnlineStatus'; // Added

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
  const queryClient = useQueryClient(); // Added
  const { sync: syncData } = useDataSync(); // Added
  const isOnline = useOnlineStatus(); // Added
  const isEditMode = !!editingJc;

  const { originalData: allNodesRaw, isLoading: isLoadingNodes } = useDropdownOptions({
    tableName: 'v_nodes_complete',
    valueField: 'id',
    labelField: 'name',
    filters: { status: true },
    orderBy: 'name',
  });

  const jcOptions: Option[] = useMemo(() => {
    const nodes = (allNodesRaw || []) as unknown as V_nodes_completeRowSchema[];
    if (nodes.length === 0) return [];

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
        nodeName.includes('jc') ||
        nodeName.includes('joint')
      );
    });

    const finalNodes = filteredNodes.length > 0 ? filteredNodes : nodes;

    return finalNodes.map((n) => ({
      value: n.id!,
      label: `${n.name} ${n.node_type_name ? `(${n.node_type_name})` : ''}`,
    }));
  }, [allNodesRaw]);

  // Local form schema
  const junction_closuresFormSchema = junction_closuresInsertSchema.pick({
    node_id: true,
    position_km: true,
  });
  type JcFormValues = z.infer<typeof junction_closuresFormSchema>;

  const form = useForm<JcFormValues>({
    resolver: zodResolver(junction_closuresFormSchema) as unknown as Resolver<JcFormValues>,
    defaultValues: {
      node_id: '',
      position_km: null,
    },
  });

  const {
    reset,
    control,
    register,
    formState: { errors },
  } = form;

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
        `Position (${formData.position_km} km) cannot be greater than Cable length (${rkm} km).`,
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

      // THE FIX: Trigger sync logic immediately
      // 1. Invalidate queries to force immediate refetch (for online mode)
      queryClient.invalidateQueries({ queryKey: ['route-details', routeId] });
      queryClient.invalidateQueries({ queryKey: ['jc-splicing-details'] });

      // 2. Sync local DB in background so fallback/offline data is fresh
      if (isOnline) {
        // We sync 'cable_segments' too because adding a JC splits segments
        syncData(['junction_closures', 'cable_segments', 'v_junction_closures_complete']).catch(
          console.error,
        );
      }

      onSave(); // Calls parent refetch
      toast.success(`Junction Closure ${isEditMode ? 'updated' : 'created'} successfully!`);
      onClose();
    } catch (error) {
      console.error('Error in handleValidSubmit:', error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} JC: ${message}`);
    }
  };

  return (
    <BaseFormModal<JcFormValues>
      isOpen={isOpen}
      onClose={onClose}
      title="Junction Closure"
      isEditMode={isEditMode}
      isLoading={isLoadingNodes}
      form={form}
      onSubmit={handleValidSubmit}
      heightClass="max-h-[80vh] overflow-y-auto"
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
    </BaseFormModal>
  );
};
