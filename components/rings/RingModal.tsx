"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { Modal } from "@/components/common/ui/Modal";
import { Option } from "@/components/common/ui/select/SearchableSelect";
import { useForm, SubmitHandler, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormCard } from "@/components/common/form/FormCard";
import {
  FormInput,
  FormSearchableSelect,
  FormSwitch,
  FormSelect // Import FormSelect
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

// Options for the new statuses
const STATUS_OPTIONS = {
    OFC: [
        { value: 'Pending', label: 'Pending' },
        { value: 'Blowing', label: 'Blowing' },
        { value: 'Splicing', label: 'Splicing' },
        { value: 'Ready', label: 'Ready' }
    ],
    SPEC: [
        { value: 'Pending', label: 'Pending' },
        { value: 'Survey', label: 'Survey' },
        { value: 'Issued', label: 'Issued' }
    ],
    BTS: [
        { value: 'Pending', label: 'Pending' },
        { value: 'Integrated', label: 'Integrated' },
        { value: 'On-Air', label: 'On-Air' }
    ]
};

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
    resolver: zodResolver(ringsInsertSchema) as Resolver<RingsInsertSchema>,
    defaultValues: {
      name: "",
      description: null,
      ring_type_id: null,
      maintenance_terminal_id: null,
      status: true,
      ofc_status: 'Pending',
      spec_status: 'Pending',
      bts_status: 'Pending',
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
        // New Fields
        ofc_status: editingRing.ofc_status ?? 'Pending',
        spec_status: editingRing.spec_status ?? 'Pending',
        bts_status: editingRing.bts_status ?? 'Pending',
      });
    } else {
      reset({
        name: "",
        description: null,
        status: true,
        ring_type_id: null,
        maintenance_terminal_id: null,
        ofc_status: 'Pending',
        spec_status: 'Pending',
        bts_status: 'Pending',
      });
    }
  }, [isOpen, editingRing, reset]);

  const onValidSubmit: SubmitHandler<RingsInsertSchema> = useCallback(
    (formData) => {
      onSubmit(formData);
    },
    [onSubmit]
  );

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
        heightClass='min-h-calc(90vh - 100px)'
        title={isEdit ? "Edit Ring" : "Add Ring"}
        onCancel={onClose}
        isLoading={isLoading}
        standalone={true}>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
        </div>

        <FormSearchableSelect
          name='maintenance_terminal_id'
          label='Maintenance Terminal'
          control={control}
          error={errors.maintenance_terminal_id}
          disabled={isLoading}
          placeholder='Select maintenance terminal'
          options={maintenanceAreaOptions}
        />

        {/* NEW STATUS DROPDOWNS */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phase Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormSelect 
                    name="spec_status" 
                    label="SPEC Status" 
                    control={control} 
                    options={STATUS_OPTIONS.SPEC} 
                    error={errors.spec_status}
                />
                <FormSelect 
                    name="ofc_status" 
                    label="OFC Status" 
                    control={control} 
                    options={STATUS_OPTIONS.OFC} 
                    error={errors.ofc_status}
                />
                <FormSelect 
                    name="bts_status" 
                    label="BTS Status" 
                    control={control} 
                    options={STATUS_OPTIONS.BTS} 
                    error={errors.bts_status}
                />
            </div>
        </div>

        <DynamicStatusBuilder
          key={builderKey}
          name="description"
          label="Extra Details"
          control={control}
          error={errors.description}
        />
        
        <FormSwitch
          name='status'
          label='Active Record'
          control={control}
          error={errors.status}
          className='my-2'
        />
      </FormCard>
    </Modal>
  );
}