// components/designations/DesignationFormModal.tsx
import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FormInput, FormSearchableSelect, FormSwitch } from '@/components/common/form/FormControls';
import {
  employee_designationsInsertSchema,
  Employee_designationsInsertSchema,
  Employee_designationsRowSchema,
} from '@/schemas/zod-schemas';
import { DesignationWithRelations } from '@/config/designations';
import { BaseFormModal } from '@/components/common/form/BaseFormModal'; // IMPORT

interface DesignationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Employee_designationsInsertSchema) => void;
  designation: DesignationWithRelations | null;
  allDesignations: Employee_designationsRowSchema[];
  isLoading: boolean;
}

export function DesignationFormModal({
  isOpen,
  onClose,
  onSubmit,
  designation,
  allDesignations,
  isLoading,
}: DesignationFormModalProps) {
  const designationFormSchema = employee_designationsInsertSchema.pick({
    id: true,
    name: true,
    parent_id: true,
    status: true,
  });
  type DesignationForm = z.infer<typeof designationFormSchema>;

  const form = useForm<DesignationForm>({
    resolver: zodResolver(designationFormSchema),
    defaultValues: {
      name: '',
      parent_id: null,
      status: true,
    },
  });

  const {
    reset,
    register,
    control,
    formState: { errors },
  } = form;
  const isEdit = !!designation;

  const availableParents = useMemo(() => {
    if (!designation || !designation.id) return allDesignations;

    const getDescendantIds = (
      designationId: string,
      designations: Employee_designationsInsertSchema[]
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

  useEffect(() => {
    if (isOpen) {
      if (designation) {
        reset({
          id: designation.id,
          name: designation.name,
          parent_id: designation.parent_id ?? null,
          status: designation.status ?? true,
        });
      } else {
        reset({
          name: '',
          parent_id: null,
          status: true,
        });
      }
    }
  }, [designation, reset, isOpen]);

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="Designation"
      isEditMode={isEdit}
      isLoading={isLoading}
      form={form}
      onSubmit={(data) => onSubmit(data as Employee_designationsInsertSchema)}
      heightClass="h-auto" // Auto height for smaller forms
    >
      <div className="space-y-4">
        <FormInput
          name="name"
          label="Designation Name"
          register={register}
          error={errors.name}
          required
        />
        <FormSearchableSelect
          name="parent_id"
          label="Parent Designation"
          control={control}
          error={errors.parent_id}
          options={availableParents.map((d) => ({ value: d.id, label: d.name }))}
          placeholder="Select parent (optional)"
        />
        <FormSwitch
          name="status"
          label="Status"
          control={control}
          error={errors.status}
          className="mt-4"
        />
      </div>
    </BaseFormModal>
  );
}
