// components/designations/DesignationFormModal.tsx
'use client';

import React, { useMemo } from 'react';
import { z } from 'zod';
import { FormInput, FormSearchableSelect, FormSwitch } from '@/components/common/form/FormControls';
import {
  employee_designationsInsertSchema,
  Employee_designationsInsertSchema,
  Employee_designationsRowSchema,
} from '@/schemas/zod-schemas';
import { DesignationWithRelations } from '@/config/designations';
import { BaseFormModal } from '@/components/common/form/BaseFormModal';
import { useFormModal } from '@/hooks/useFormModal';

interface DesignationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Employee_designationsInsertSchema) => void;
  designation: DesignationWithRelations | null;
  allDesignations: Employee_designationsRowSchema[];
  isLoading: boolean;
}

const designationFormSchema = employee_designationsInsertSchema.pick({
  id: true,
  name: true,
  parent_id: true,
  status: true,
});
type DesignationForm = z.infer<typeof designationFormSchema>;

export function DesignationFormModal({
  isOpen,
  onClose,
  onSubmit,
  designation,
  allDesignations,
  isLoading,
}: DesignationFormModalProps) {
  const { form, isEditMode } = useFormModal<DesignationForm, DesignationWithRelations>({
    isOpen,
    schema: designationFormSchema,
    record: designation,
    defaultValues: {
      name: '',
      parent_id: null,
      status: true,
    },
    mapRecord: (record) => ({
      id: record.id,
      name: record.name,
      parent_id: record.parent_id ?? null,
      status: record.status ?? true,
    }),
  });

  const {
    register,
    control,
    formState: { errors },
  } = form;

  const availableParents = useMemo(() => {
    if (!designation || !designation.id) return allDesignations;

    // Recursive check to prevent selecting a descendant as a parent (circular reference)
    const getDescendantIds = (
      designationId: string,
      designations: Employee_designationsRowSchema[],
    ): Set<string> => {
      const descendants = new Set<string>([designationId]);
      const children = designations.filter((d) => d.parent_id === designationId);
      children.forEach((child) => {
        if (!child.id) return;
        const childDescendants = getDescendantIds(child.id, designations);
        childDescendants.forEach((id) => descendants.add(id));
      });
      return descendants;
    };

    const excludeIds = getDescendantIds(designation.id, allDesignations);
    return allDesignations.filter((d) => !d.id || !excludeIds.has(d.id));
  }, [designation, allDesignations]);

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title='Designation'
      isEditMode={isEditMode}
      isLoading={isLoading}
      form={form}
      onSubmit={(data) => onSubmit(data as Employee_designationsInsertSchema)}
      heightClass='h-auto'
    >
      <div className='space-y-4'>
        <FormInput
          name='name'
          label='Designation Name'
          register={register}
          error={errors.name}
          required
        />
        <FormSearchableSelect
          name='parent_id'
          label='Parent Designation'
          control={control}
          error={errors.parent_id}
          options={availableParents.map((d) => ({ value: d.id, label: d.name }))}
          placeholder='Select parent (optional)'
        />
        <FormSwitch
          name='status'
          label='Status'
          control={control}
          error={errors.status}
          className='mt-4'
        />
      </div>
    </BaseFormModal>
  );
}
