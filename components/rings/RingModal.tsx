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
  FormSelect 
} from "@/components/common/form/FormControls";
import { ringsInsertSchema, RingsInsertSchema, V_ringsRowSchema } from "@/schemas/zod-schemas";
import { DynamicStatusBuilder } from "@/components/common/form/DynamicStatusBuilder";

interface RingModalProps {
  isOpen: boolean;
  onClose: () => void;
  // THE FIX: Use the View schema to match the data passed from the Page
  editingRing?: V_ringsRowSchema | null;
  onSubmit: (data: RingsInsertSchema) => void;
  isLoading: boolean;
  ringTypes: Array<{ id: string; name: string; code: string | null }>;
  maintenanceAreas: Array<{ id: string; name: string; code: string | null }>;
}

const STATUS_OPTIONS = {
    OFC: [
        { value: 'Pending', label: 'Pending' },
        { value: 'Partial Ready', label: 'Partial Ready' },
        { value: 'Ready', label: 'Ready' }
    ],
    SPEC: [
        { value: 'Pending', label: 'Pending' },
        { value: 'Survey', label: 'Survey' },
        { value: 'Issued', label: 'Issued' }
    ],
    BTS: [
        { value: 'Pending', label: 'Pending' },
        { value: 'Configured', label: 'Configured' },
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
      (ringTypes || []).filter((rt) => rt.name !== "DEFAULT").map((rt) => ({
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
    if (isOpen) {
      if (editingRing) {
        // Use setTimeout to ensure the modal DOM is ready and form is mounted before resetting values
        // This fixes race conditions where select inputs might not catch the update
        const timer = setTimeout(() => {
          reset({
            name: editingRing.name ?? "",
            description: editingRing.description ?? null,
            status: editingRing.status ?? true,
            ring_type_id: editingRing.ring_type_id ?? null,
            maintenance_terminal_id: editingRing.maintenance_terminal_id ?? null,
            
            // Explicitly map these fields. If null/undefined in DB, force 'Pending'.
            ofc_status: editingRing.ofc_status || 'Pending',
            spec_status: editingRing.spec_status || 'Pending',
            bts_status: editingRing.bts_status || 'Pending',
          });
        }, 0);
        return () => clearTimeout(timer);
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
    }
  }, [isOpen, editingRing, reset]);

  const onValidSubmit: SubmitHandler<RingsInsertSchema> = useCallback(
    (formData) => {
      onSubmit(formData);
    },
    [onSubmit]
  );

  // Key to force re-render of dynamic elements when switching records
  const formKey = isOpen ? (editingRing ? `edit-${editingRing.id}` : 'new') : 'closed';

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
            key={`ring-type-${formKey}`} // Force re-mount on change
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
          key={`ma-${formKey}`} // Force re-mount on change
          name='maintenance_terminal_id'
          label='Maintenance Terminal'
          control={control}
          error={errors.maintenance_terminal_id}
          disabled={isLoading}
          placeholder='Select maintenance terminal'
          options={maintenanceAreaOptions}
        />

        {/* STATUS DROPDOWNS */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3 mt-4">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phase Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormSelect 
                    key={`spec-${formKey}`} // Force re-mount ensures default value is picked up from control
                    name="spec_status" 
                    label="SPEC Status" 
                    control={control} 
                    options={STATUS_OPTIONS.SPEC} 
                    error={errors.spec_status}
                    placeholder="Select Status"
                />
                <FormSelect 
                    key={`ofc-${formKey}`}
                    name="ofc_status" 
                    label="OFC Status" 
                    control={control} 
                    options={STATUS_OPTIONS.OFC} 
                    error={errors.ofc_status}
                    placeholder="Select Status"
                />
                <FormSelect 
                    key={`bts-${formKey}`}
                    name="bts_status" 
                    label="Working Status" 
                    control={control} 
                    options={STATUS_OPTIONS.BTS} 
                    error={errors.bts_status}
                    placeholder="Select Status"
                />
            </div>
        </div>

        <DynamicStatusBuilder
          key={`dynamic-${formKey}`}
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
          className='my-4'
        />
      </FormCard>
    </Modal>
  );
}