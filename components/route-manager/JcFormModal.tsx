// path: components/route-manager/JcFormModal.tsx
'use client';

import { useEffect, useMemo } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/common/ui';
import { FormCard, FormInput, FormSearchableSelect } from '@/components/common/form';
import { createClient } from '@/utils/supabase/client';
import { JunctionClosure } from './types';
import { toast } from 'sonner';
import { Junction_closuresInsertSchema, junction_closuresInsertSchema } from '@/schemas/zod-schemas';
import { Filters, useTableQuery } from '@/hooks/database';
import { Option } from '@/components/common/ui/select/SearchableSelect';


interface JcFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // Callback to trigger a refetch
  routeId: string | null;
  editingJc: JunctionClosure | null;
  rkm: number | null;
}

export const JcFormModal: React.FC<JcFormModalProps> = ({ isOpen, onClose, onSave, routeId, editingJc, rkm }) => {
  const supabase = createClient();
  const isEditMode = !!editingJc;

  // Get the JC Lists
  const serverFilters = useMemo(() => {
      const f: Filters = {
        // Filter to download only categories with name not equal to "DEFAULT" and NODE_TYPES equal to "Joint / Splice Point"
        node_type_code: { operator: 'eq', value: 'BJC' },
        name: { operator: 'neq', value: 'DEFAULT' },
      };
      return f;
    }, []);
  const { data: jcLists } = useTableQuery(supabase, 'v_nodes_complete', { filters: serverFilters, columns: 'id, name, latitude, longitude' });

  // Local form schema: only validate the fields this form actually collects
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
    watch,
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
          node_id: editingJc.node_id ?? '',
          position_km: editingJc.position_km || null,
        });
      } else {
        // Start with no selection for node; leave node_id undefined
        reset({
          node_id: '',
          position_km: null,
        });
      }
    }
  }, [isOpen, editingJc, reset, jcLists]);

  const jcOptions: Option[] = (jcLists || [])
  .filter(d => d.id != null && d.name != null)
  .map((d) => ({
    value: d.id as string,    // We've filtered out nulls, so it's safe to assert
    label: d.name as string,
  }));

  // Watch selected JC (node) id
  const selectedNodeId = watch("node_id");

  // If needed, you can derive latitude/longitude from selectedNodeId for display purposes
  // but they are not part of the form schema, so we do not set them in form state.
  useEffect(() => {
    if (!selectedNodeId) return;
    // Placeholder for any side effects when node changes
  }, [selectedNodeId]);

  const handleValidSubmit = async (formData: JcFormValues) => {
    if (!routeId) {
      toast.error("No route selected to add the JC to.");
      return;
    }

    if (formData.position_km && rkm && Number(formData.position_km) > Number(rkm)) {
      toast.error("Position on route (km) cannot be greater than Cable length.");
      return;
    }

    const payload = {
      ...formData,
      ofc_cable_id: routeId,
    };

    const query = isEditMode
      ? supabase
          .from('junction_closures')
          .update(payload)
          .eq('node_id', editingJc.node_id)
          .eq('ofc_cable_id', routeId)
      : supabase.from('junction_closures').insert(payload);

    const { error } = await query;

    if (error) {
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} JC: ${error.message}`);
    } else {
      onSave(); // Trigger refetch on the parent page
      toast.success(`Junction Closure ${isEditMode ? 'updated' : 'created'} successfully!`);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Junction Closure' : 'Add Junction Closure'} >
      <FormCard
        title={isEditMode ? 'Edit Junction Closure' : 'Add Junction Closure'}
        onSubmit={handleSubmit(
          handleValidSubmit,
          () => toast.error('Please fix the highlighted fields')
        )}
        onCancel={onClose}
        isLoading={isSubmitting}
        heightClass="max-h-[80vh]"
        standalone
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSearchableSelect
            name="node_id"
            label="Junction Closure"
            control={control}
            options={jcOptions || []}
            error={errors.node_id}
            required
            placeholder="Select a Junction Closure"
          />
          <FormInput
            name="position_km"
            label="Position on Route (km)"
            type="number"
            step="0.01"
            register={register}
            error={errors.position_km}
            placeholder="e.g., 12.5"
          />
        </div>
      </FormCard>
    </Modal>
  );
};
