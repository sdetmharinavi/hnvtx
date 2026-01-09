// components/rings/RingModal.tsx
'use client';

import React, { useEffect, useMemo } from 'react';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import { useForm, Resolver } from 'react-hook-form'; // Added Resolver import
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput, FormSearchableSelect, FormSwitch, FormSelect } from '@/components/common/form';
import { ringsInsertSchema, RingsInsertSchema, V_ringsRowSchema } from '@/schemas/zod-schemas';
import { DynamicStatusBuilder } from '@/components/common/form/DynamicStatusBuilder';
import { BaseFormModal } from '@/components/common/form/BaseFormModal';

interface RingModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRing?: V_ringsRowSchema | null;
  onSubmit: (data: RingsInsertSchema) => void;
  isLoading: boolean;
  ringTypes: Array<{ id: string; name: string; code: string | null }>;
  maintenanceAreas: Array<{ id: string; name: string; code: string | null }>;
  isLoadingDropdowns?: boolean;
}

const STATUS_OPTIONS = {
  OFC: [
    { value: 'Pending', label: 'Pending' },
    { value: 'Partial Ready', label: 'Partial Ready' },
    { value: 'Ready', label: 'Ready' },
  ],
  SPEC: [
    { value: 'Pending', label: 'Pending' },
    { value: 'Survey', label: 'Survey' },
    { value: 'Issued', label: 'Issued' },
  ],
  BTS: [
    { value: 'Pending', label: 'Pending' },
    { value: 'Configured', label: 'Configured' },
    { value: 'On-Air', label: 'On-Air' },
  ],
};

export function RingModal({
  isOpen,
  onClose,
  editingRing,
  onSubmit,
  isLoading,
  ringTypes,
  maintenanceAreas,
  isLoadingDropdowns = false,
}: RingModalProps) {
  const isEdit = Boolean(editingRing);
  const formKey = isOpen ? (editingRing ? `edit-${editingRing.id}` : 'new') : 'closed';

  const form = useForm<RingsInsertSchema>({
    // THE FIX: Explicitly cast the resolver to satisfy the strict type requirements
    resolver: zodResolver(ringsInsertSchema) as unknown as Resolver<RingsInsertSchema>,
    defaultValues: {
      name: '',
      description: null,
      ring_type_id: null,
      maintenance_terminal_id: null,
      status: true,
      is_closed_loop: true,
      ofc_status: 'Pending',
      spec_status: 'Pending',
      bts_status: 'Pending',
    },
  });

  const {
    register,
    control,
    reset,
    formState: { errors },
  } = form;

  const ringTypeOptions: Option[] = useMemo(
    () =>
      (ringTypes || [])
        .filter((rt) => rt.name !== 'DEFAULT')
        .map((rt) => ({
          value: rt.id,
          label: `${rt.name}${rt.code ? ` (${rt.code})` : ''}`,
        })),
    [ringTypes]
  );

  const maintenanceAreaOptions: Option[] = useMemo(
    () =>
      (maintenanceAreas || []).map((a) => ({
        value: a.id,
        label: `${a.name}${a.code ? ` (${a.code})` : ''}`,
      })),
    [maintenanceAreas]
  );

  useEffect(() => {
    if (isOpen) {
      if (editingRing) {
        const timer = setTimeout(() => {
          reset({
            name: editingRing.name ?? '',
            description: editingRing.description ?? null,
            status: editingRing.status ?? true,
            is_closed_loop: editingRing.is_closed_loop ?? true,
            ring_type_id: editingRing.ring_type_id ?? null,
            maintenance_terminal_id: editingRing.maintenance_terminal_id ?? null,
            ofc_status: editingRing.ofc_status || 'Pending',
            spec_status: editingRing.spec_status || 'Pending',
            bts_status: editingRing.bts_status || 'Pending',
          });
        }, 0);
        return () => clearTimeout(timer);
      } else {
        reset({
          name: '',
          description: null,
          status: true,
          is_closed_loop: true,
          ring_type_id: null,
          maintenance_terminal_id: null,
          ofc_status: 'Pending',
          spec_status: 'Pending',
          bts_status: 'Pending',
        });
      }
    }
  }, [isOpen, editingRing, reset]);

  return (
    // THE FIX: Pass the generic type to BaseFormModal explicitly
    <BaseFormModal<RingsInsertSchema>
      isOpen={isOpen}
      onClose={onClose}
      title="Ring"
      isEditMode={isEdit}
      isLoading={isLoading}
      form={form}
      onSubmit={onSubmit}
      heightClass="min-h-calc(90vh - 100px)"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          name="name"
          label="Name"
          register={register}
          error={errors.name}
          disabled={isLoading}
          placeholder="Enter ring name"
          required
        />
        <FormSearchableSelect
          key={`ring-type-${formKey}`}
          name="ring_type_id"
          label="Ring Type"
          control={control}
          error={errors.ring_type_id}
          disabled={isLoading}
          isLoading={isLoadingDropdowns}
          placeholder={isLoadingDropdowns ? 'Loading types...' : 'Select ring type'}
          options={ringTypeOptions}
          required
        />
      </div>

      <FormSearchableSelect
        key={`ma-${formKey}`}
        name="maintenance_terminal_id"
        label="Maintenance Terminal"
        control={control}
        error={errors.maintenance_terminal_id}
        disabled={isLoading}
        isLoading={isLoadingDropdowns}
        placeholder={isLoadingDropdowns ? 'Loading areas...' : 'Select maintenance terminal'}
        options={maintenanceAreaOptions}
      />

      <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3 mt-4">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Phase Status</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormSelect
            key={`spec-${formKey}`}
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

      <div className="flex items-center gap-6 my-4 p-4 border border-gray-100 dark:border-gray-700 rounded-lg">
        <FormSwitch
          name="is_closed_loop"
          label="Closed Loop Ring"
          control={control}
          error={errors.is_closed_loop}
          description="Connects the last node back to the first node."
        />
        <FormSwitch name="status" label="Active Record" control={control} error={errors.status} />
      </div>
    </BaseFormModal>
  );
}
