// path: components/route-manager/JcFormModal.tsx
'use client';

import { useEffect, useMemo, useState } from 'react';
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

  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Junction_closuresInsertSchema>({
    resolver: zodResolver(junction_closuresInsertSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (editingJc) {
        reset({
          name: editingJc.name,
          latitude: editingJc.latitude,
          longitude: editingJc.longitude,
          position_km: editingJc.position_km || null,
        });
      } else {
        reset({
          name: '',
          latitude: null,
          longitude: null,
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

  // When JC name changes, update lat/long automatically
  const jcName = watch("name");

useEffect(() => {
  if (!jcName) return;
  const selected = jcLists?.find((jc) => jc.id === jcName);
  if (selected) {
    setValue("latitude", selected.latitude ?? null);
    setValue("longitude", selected.longitude ?? null);
  }
}, [jcName, jcLists, setValue]);

  const handleValidSubmit = async (formData: Junction_closuresInsertSchema) => {
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
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit Junction Closure' : 'Add Junction Closure'} >
      <FormCard
        title={isEditMode ? 'Edit Junction Closure' : 'Add Junction Closure'}
        onSubmit={handleSubmit(handleValidSubmit)}
        onCancel={onClose}
        isLoading={isSubmitting}
        heightClass="max-h-[80vh]"
        standalone
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormSearchableSelect
            name="name"
            label="JC Name"
            control={control}
            options={jcOptions || []}
            error={errors.name}
            required
            placeholder="e.g., JC-Main-01"
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
