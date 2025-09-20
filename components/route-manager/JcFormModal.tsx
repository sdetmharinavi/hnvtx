// path: components/route-manager/JcFormModal.tsx
'use client';

import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal } from '@/components/common/ui';
import { FormCard, FormInput, FormSearchableSelect } from '@/components/common/form';
import { useTableQuery } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { JunctionClosure } from './types';
import { Button } from '../common/ui';
import { toast } from 'sonner';

// Define the Zod schema for the form
const jcFormSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters long.'),
  jc_type_id: z.string().uuid('Please select a valid JC type.'),
  capacity: z.preprocess(
    (val) => parseInt(String(val), 10),
    z.number().int().positive('Capacity must be a positive number.')
  ),
  latitude: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(-90).max(90, 'Invalid latitude.')
  ).optional().nullable(),
  longitude: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(-180).max(180, 'Invalid longitude.')
  ).optional().nullable(),
  position_km: z.preprocess(
    (val) => parseFloat(String(val)),
    z.number().min(0, 'Position must be a positive number.')
  ).optional().nullable(),
});

type JcFormData = z.infer<typeof jcFormSchema>;

interface JcFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void; // Callback to trigger a refetch
  routeId: string | null;
  editingJc: JunctionClosure | null;
}

export const JcFormModal: React.FC<JcFormModalProps> = ({ isOpen, onClose, onSave, routeId, editingJc }) => {
  const supabase = createClient();
  const isEditMode = !!editingJc;

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<JcFormData>({
    resolver: zodResolver(jcFormSchema),
  });

  // Fetch JC types for the dropdown
  const { data: jcTypesData, isLoading: isLoadingTypes } = useTableQuery(supabase, 'lookup_types', {
    filters: { category: 'JC_TYPES', name: { operator: 'neq', value: 'DEFAULT' } },
    orderBy: [{ column: 'name' }],
  });

  const jcTypeOptions = useMemo(() =>
    jcTypesData?.map(type => ({ value: type.id, label: type.name })) || [],
    [jcTypesData]
  );

  useEffect(() => {
    if (isOpen) {
      if (editingJc) {
        reset({
          name: editingJc.name,
          // Find the corresponding jc_type_id from the fetched types
          jc_type_id: jcTypesData?.find(t => t.id === (editingJc as any).jc_type_id)?.id || '',
          capacity: (editingJc as any).capacity || 24,
          latitude: (editingJc as any).latitude || null,
          longitude: (editingJc as any).longitude || null,
          position_km: editingJc.position_km || null,
        });
      } else {
        reset({
          name: '',
          jc_type_id: '',
          capacity: 24,
          latitude: null,
          longitude: null,
          position_km: null,
        });
      }
    }
  }, [isOpen, editingJc, reset, jcTypesData]);

  const handleValidSubmit = async (formData: JcFormData) => {
    if (!routeId) {
      toast.error("No route selected to add the JC to.");
      return;
    }

    const payload = {
      ...formData,
      ofc_cable_id: routeId,
    };

    const query = isEditMode
      ? supabase.from('junction_closures').update(payload).eq('id', editingJc.id)
      : supabase.from('junction_closures').insert(payload);

    const { error } = await query;

    if (error) {
      toast.error(`Failed to ${isEditMode ? 'update' : 'create'} JC: ${error.message}`);
    } else {
      toast.success(`Junction Closure ${isEditMode ? 'updated' : 'created'} successfully!`);
      onSave(); // Trigger refetch on the parent page
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Junction Closure' : 'Add Junction Closure'}>
      <FormCard
        title={isEditMode ? 'Edit Junction Closure' : 'Add Junction Closure'}
        onSubmit={handleSubmit(handleValidSubmit)}
        onCancel={onClose}
        isLoading={isSubmitting}
        heightClass="max-h-[80vh]"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            name="name"
            label="JC Name"
            register={register}
            error={errors.name}
            required
            placeholder="e.g., JC-Main-01"
          />
          <FormSearchableSelect
            name="jc_type_id"
            label="JC Type"
            control={control}
            options={jcTypeOptions}
            error={errors.jc_type_id}
            required
            placeholder={isLoadingTypes ? 'Loading types...' : 'Select a type'}
            disabled={isLoadingTypes}
          />
          <FormInput
            name="capacity"
            label="Splice Capacity"
            type="number"
            register={register}
            error={errors.capacity}
            required
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
          <FormInput
            name="latitude"
            label="Latitude"
            type="number"
            step="any"
            register={register}
            error={errors.latitude}
            placeholder="e.g., 22.5726"
          />
          <FormInput
            name="longitude"
            label="Longitude"
            type="number"
            step="any"
            register={register}
            error={errors.longitude}
            placeholder="e.g., 88.3639"
          />
        </div>
      </FormCard>
    </Modal>
  );
};
