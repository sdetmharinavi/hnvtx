import { useEffect, useMemo, useState, FormEvent } from "react";
import { TablesInsert } from "@/types/supabase-types";
import { EmployeeDesignation, DesignationWithRelations } from "@/components/designations/designationTypes";
import { Resolver, useForm } from "react-hook-form";
import { employeeDesignationSchema } from "@/schemas/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

interface DesignationFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EmployeeDesignation) => void;
  designation: DesignationWithRelations | null;
  allDesignations: EmployeeDesignation[];
  isLoading: boolean;
}

export function DesignationFormModal({ isOpen, onClose, onSubmit, designation, allDesignations, isLoading }: DesignationFormModalProps) {
  // === React Hook Form Setup ===
  // Create a form-specific schema that excludes timestamp fields to avoid Date vs string/null mismatches
  const designationFormSchema = employeeDesignationSchema.pick({ id: true, name: true, parent_id: true, status: true });
  type DesignationForm = z.infer<typeof designationFormSchema>;

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty, isSubmitting },
    reset,
    watch,
  } = useForm<DesignationForm>({
    resolver: zodResolver(designationFormSchema),
    defaultValues: {
      name: "",
      parent_id: null,
      status: true,
    },
  });

  const availableParents = useMemo(() => {
    if (!designation) return allDesignations;

    const getDescendantIds = (designationId: string, designations: EmployeeDesignation[]): Set<string> => {
      const descendants = new Set<string>([designationId]);
      const children = designations.filter((d) => d.parent_id === designationId);
      children.forEach((child) => {
        const childDescendants = getDescendantIds(child.id, designations);
        childDescendants.forEach((id) => descendants.add(id));
      });
      return descendants;
    };

    const excludeIds = getDescendantIds(designation.id, allDesignations);
    return allDesignations.filter((d) => !excludeIds.has(d.id));
  }, [designation, allDesignations]);

  // Reset form when designation changes (to pre-fill the form when editing)
  useEffect(() => {
    if (designation) {
      reset({
        id: designation.id,
        name: designation.name,
        parent_id: designation.parent_id ?? null,
        status: designation.status ?? true,
      });
    }
  }, [designation, reset]);

  const onValidSubmit = (data: DesignationForm) => {
    // Forward only the fields we collect; backend/consumer can add timestamps as needed
    onSubmit(data as unknown as EmployeeDesignation);
  };

  // Watch the name field to control submit button state
  const nameValue = watch("name") ?? "";

  if (!isOpen) return null;

  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
      <div className='max-h-[90vh] w-full max-w-md overflow-y-auto rounded-lg bg-white p-6 dark:bg-gray-800'>
        <div className='mb-4 flex items-center justify-between'>
          <h2 className='text-lg font-semibold text-gray-900 dark:text-white'>{designation ? "Edit Designation" : "Add New Designation"}</h2>
          <button onClick={onClose} className='text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'>
            ×
          </button>
        </div>
        <form onSubmit={handleSubmit(onValidSubmit)} className='space-y-4'>
          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Designation Name *</label>
            <input
              id='name'
              type='text'
              {...register("name")}
              placeholder='Designation Name'
              required
              className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-600'
            />
            {errors.name && <p className='text-red-500 text-xs mt-1'>{errors.name.message}</p>}
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1'>Parent Designation</label>
            <select
              id='parent_id'
              {...register("parent_id", { setValueAs: (v) => (v === "" ? null : v) })}
              className='w-full rounded-lg border border-gray-300 px-3 py-2 focus:ring-2 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-600'>
              <option value=''>No Parent (Root Level)</option>
              {availableParents.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
            {errors.parent_id && <p className='text-red-500 text-xs mt-1'>{errors.parent_id.message}</p>}
          </div>

          <div className='flex gap-3 pt-4'>
            <button type='button' onClick={onClose} disabled={isLoading} className='flex-1 rounded-lg border border-gray-300 px-4 py-2 text-gray-700 hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700'>
              Cancel
            </button>
            <button
              type='submit'
              disabled={isLoading || nameValue.trim().length === 0 || isSubmitting || !isDirty}
              className='flex-1 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 disabled:opacity-50 dark:bg-blue-700 dark:hover:bg-blue-800'>
              {isLoading ? "Saving..." : designation ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
