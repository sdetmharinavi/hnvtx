"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { Modal } from "@/components/common/ui/Modal";
import { Option } from "@/components/common/ui/select/SearchableSelect";
// THE FIX: Import Resolver type
import { useForm, SubmitHandler, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormCard } from "@/components/common/form/FormCard";
import {
  FormInput,
  FormSearchableSelect,
  FormSwitch,
} from "@/components/common/form/FormControls";
import { ringsInsertSchema, RingsInsertSchema, RingsRowSchema } from "@/schemas/zod-schemas";
import { DynamicStatusBuilder } from "@/components/common/form/DynamicStatusBuilder";

interface RingModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRing?: RingsRowSchema | null;
  onSubmit: (data: RingsInsertSchema) => void;
  isLoading: boolean;
  ringTypes: Array<{ id: string; name: string; code: string | null }>;
  maintenanceAreas: Array<{ id: string; name: string; code: string | null }>;
}

export function RingModal({
  isOpen,
  onClose,
  editingRing,
  onSubmit,
  isLoading,
  ringTypes,
  maintenanceAreas,
}: RingModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<RingsInsertSchema>({
    // THE FIX: Explicitly cast the resolver to resolve the type mismatch
    resolver: zodResolver(ringsInsertSchema) as Resolver<RingsInsertSchema>,
    defaultValues: {
      name: "",
      description: null,
      ring_type_id: null,
      maintenance_terminal_id: null,
      status: true,
    },
  });

  const isEdit = useMemo(() => Boolean(editingRing), [editingRing]);

  const ringTypeOptions: Option[] = useMemo(
    () =>
      (ringTypes || []).map((rt) => ({
        value: rt.id,
        label: `${rt.name}${rt.code ? ` (${rt.code})` : ""}`,
      })),
    [ringTypes]
  );

  const maintenanceAreaOptions: Option[] = useMemo(
    () =>
      (maintenanceAreas || []).map((a) => ({
        value: a.id,
        label: `${a.name}${a.code ? ` (${a.code})` : ""}`,
      })),
    [maintenanceAreas]
  );

  useEffect(() => {
    if (!isOpen) return;
    
    if (editingRing) {
      reset({
        name: editingRing.name ?? "",
        description: editingRing.description ?? null,
        status: editingRing.status ?? true,
        ring_type_id: editingRing.ring_type_id ?? null,
        maintenance_terminal_id: editingRing.maintenance_terminal_id ?? null,
      });
    } else {
      reset({
        name: "",
        description: null,
        status: true,
        ring_type_id: null,
        maintenance_terminal_id: null,
      });
    }
  }, [isOpen, editingRing, reset]);

  const onValidSubmit: SubmitHandler<RingsInsertSchema> = useCallback(
    (formData) => {
      onSubmit(formData);
    },
    [onSubmit]
  );

  // Force a unique key for the builder to ensure it re-initializes its local state when the modal opens/closes or ring changes
  const builderKey = isOpen ? (editingRing ? `edit-${editingRing.id}` : 'new') : 'closed';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Ring" : "Add Ring"}
      visible={false}
      className='transparent bg-gray-700 rounded-2xl'>
      <FormCard
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        onSubmit={handleSubmit(onValidSubmit as any)}
        heightClass='min-h-calc(90vh - 200px)'
        title={isEdit ? "Edit Ring" : "Add Ring"}
        onCancel={onClose}
        isLoading={isLoading}
        standalone={true}>
        <FormInput
          name='name'
          label='Name'
          register={register}
          error={errors.name}
          disabled={isLoading}
          placeholder='Enter ring name'
        />
        <FormSearchableSelect
          name='ring_type_id'
          label='Ring Type'
          control={control}
          error={errors.ring_type_id}
          disabled={isLoading}
          placeholder='Select ring type'
          options={ringTypeOptions}
        />

        <FormSearchableSelect
          name='maintenance_terminal_id'
          label='Maintenance Terminal'
          control={control}
          error={errors.maintenance_terminal_id}
          disabled={isLoading}
          placeholder='Select maintenance terminal'
          options={maintenanceAreaOptions}
        />

        <DynamicStatusBuilder
          key={builderKey}
          name="description"
          label="Status & Description"
          control={control}
          error={errors.description}
        />
        
        <FormSwitch
          name='status'
          label='Status'
          control={control}
          error={errors.status}
          className='my-2'
        />
      </FormCard>
    </Modal>
  );
}