import { useEffect, useMemo } from "react";
import { EmployeeDesignation, DesignationWithRelations } from "@/config/designations";
import { useForm } from "react-hook-form";
import { employeeDesignationSchema } from "@/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormCard } from "../common/ui/form/FormCard";
import { FormInput, FormSearchableSelect, FormSwitch } from "@/components/common/ui/form/FormControls";

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
    formState: { errors },
    reset,
    control,
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
    const parsedData = {
      ...data,
    };
    onSubmit(parsedData as unknown as EmployeeDesignation);
  };

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
        <FormCard onSubmit={handleSubmit(onValidSubmit)} title={designation ? "Edit Designation" : "Add New Designation"} onCancel={onClose} heightClass="h-[calc(90vh-140px)]">
          <FormInput name='name' label='Designation Name' register={register} error={errors.name} required />
          <FormSearchableSelect name='parent_id' label='Parent Designation' control={control} error={errors.parent_id} required options={availableParents.map((d) => ({ value: d.id, label: d.name }))} />
          <FormSwitch name='status' label='Status' control={control} error={errors.status} className="mt-4" />
        </FormCard>
      </div>
    </div>
  );
}
