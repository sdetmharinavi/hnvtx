"use client";

import { useMemo, useEffect } from "react";
import { Modal } from "@/components/common/ui";
import { FormCard, FormInput, FormTextarea, FormSearchableSelect, FormSelect } from "@/components/common/form";
import { useForm, Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { initiateFileSchema, forwardFileSchema, InitiateFilePayload, ForwardFilePayload } from "@/schemas/efile-schemas";
import { useInitiateFile, useForwardFile, useEmployeeOptions, useUpdateFileDetails, UpdateFilePayload } from "@/hooks/data/useEFilesData";
import { V_employeesRowSchema, V_e_files_extendedRowSchema } from "@/schemas/zod-schemas";

// Helper
const getEmployeeOptions = (employees: V_employeesRowSchema[] | undefined) => {
    return (employees || []).map(e => ({
        value: e.id!,
        label: `${e.employee_name} (${e.employee_designation_name || 'No Desig'}) - ${e.maintenance_area_name || 'No Area'}`
    }));
};

// --- INITIATE MODAL ---
export const InitiateFileModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { mutate, isPending } = useInitiateFile();
  const { data: employeeData } = useEmployeeOptions();
  
  const employeeOptions = useMemo(() => getEmployeeOptions(employeeData?.data), [employeeData]);

  const { register, control, handleSubmit, formState: { errors } } = useForm<InitiateFilePayload>({
    resolver: zodResolver(initiateFileSchema),
    defaultValues: { priority: 'normal' }
  });

  const onSubmit = (data: InitiateFilePayload) => {
    mutate(data, { onSuccess: onClose });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Initiate New E-File" size="lg">
      <FormCard onSubmit={handleSubmit(onSubmit)} onCancel={onClose} isLoading={isPending} title="New File Record" standalone>
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput name="file_number" label="File Number *" register={register} error={errors.file_number} placeholder="e.g. FILE/2024/001" required />
                <FormSelect 
                    name="priority" 
                    label="Priority" 
                    control={control} 
                    options={[
                        { value: 'normal', label: 'Normal' },
                        { value: 'urgent', label: 'Urgent' },
                        { value: 'immediate', label: 'Immediate' }
                    ]} 
                />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <FormInput name="category" label="Category *" register={register} error={errors.category} placeholder="e.g. Administrative" required />
                 <FormSearchableSelect 
                    name="initiator_employee_id" 
                    label="Initiator (Employee) *" 
                    control={control} 
                    options={employeeOptions} 
                    error={errors.initiator_employee_id} 
                    placeholder="Select employee..."
                    required
                    searchPlaceholder="Search employees..."
                 />
            </div>

            <FormInput name="subject" label="Subject *" register={register} error={errors.subject} required />
            
            <FormTextarea name="description" label="Description" control={control} rows={3} />
            
            <FormTextarea name="remarks" label="Initial Note" control={control} rows={2} placeholder="e.g. Starting new file..." />
        </div>
      </FormCard>
    </Modal>
  );
};

// --- FORWARD MODAL ---
export const ForwardFileModal = ({ isOpen, onClose, fileId }: { isOpen: boolean; onClose: () => void; fileId: string }) => {
    const { mutate, isPending } = useForwardFile();
    const { data: employeeData } = useEmployeeOptions();
  
    const employeeOptions = useMemo(() => getEmployeeOptions(employeeData?.data), [employeeData]);

    const { control, handleSubmit, formState: { errors } } = useForm<ForwardFilePayload>({
        resolver: zodResolver(forwardFileSchema) as Resolver<ForwardFilePayload>,
        defaultValues: { file_id: fileId, action_type: 'forwarded' }
    });

    const onSubmit = (data: ForwardFilePayload) => {
        mutate(data, { onSuccess: onClose });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Forward File">
            <FormCard onSubmit={handleSubmit(onSubmit)} onCancel={onClose} isLoading={isPending} title="Forwarding Details" standalone submitText="Send">
                <FormSearchableSelect 
                    name="to_employee_id" 
                    label="Forward To (Employee) *" 
                    control={control} 
                    options={employeeOptions} 
                    error={errors.to_employee_id} 
                    placeholder="Select recipient..."
                    required
                    searchPlaceholder="Search employees..."
                />
                <FormSelect 
                    name="action_type" 
                    label="Action" 
                    control={control} 
                    options={[{value: 'forwarded', label: 'Forward'}, {value: 'returned', label: 'Return'}]} 
                />
                <FormTextarea name="remarks" label="Remarks / Instructions *" control={control} error={errors.remarks} required rows={4} />
            </FormCard>
        </Modal>
    );
};


// --- EDIT DETAILS MODAL (NEW) ---

const editSchema = z.object({
    subject: z.string().min(1, "Subject is required"),
    description: z.string().optional(),
    category: z.string().min(1, "Category is required"),
    priority: z.enum(['normal', 'urgent', 'immediate']),
});

type EditSchemaType = z.infer<typeof editSchema>;

export const EditFileModal = ({ isOpen, onClose, file }: { isOpen: boolean; onClose: () => void; file: V_e_files_extendedRowSchema }) => {
    const { mutate, isPending } = useUpdateFileDetails();
    
    const { register, control, handleSubmit, formState: { errors }, reset } = useForm<EditSchemaType>({
        resolver: zodResolver(editSchema),
    });

    useEffect(() => {
        if (isOpen && file) {
            reset({
                subject: file.subject || '',
                description: file.description || '',
                category: file.category || '',
                priority: (file.priority as 'normal' | 'urgent' | 'immediate') || 'normal'
            });
        }
    }, [isOpen, file, reset]);

    const onSubmit = (data: EditSchemaType) => {
        if(!file.id) return;
        mutate({
            file_id: file.id,
            subject: data.subject,
            description: data.description || '',
            category: data.category,
            priority: data.priority
        }, { onSuccess: onClose });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Edit File Details">
            <FormCard onSubmit={handleSubmit(onSubmit)} onCancel={onClose} isLoading={isPending} title="Edit Details" standalone submitText="Update">
                 <FormInput name="subject" label="Subject *" register={register} error={errors.subject} required />
                 <div className="grid grid-cols-2 gap-4">
                    <FormInput name="category" label="Category *" register={register} error={errors.category} required />
                    <FormSelect 
                        name="priority" 
                        label="Priority" 
                        control={control} 
                        options={[
                            { value: 'normal', label: 'Normal' },
                            { value: 'urgent', label: 'Urgent' },
                            { value: 'immediate', label: 'Immediate' }
                        ]} 
                    />
                 </div>
                 <FormTextarea name="description" label="Description" control={control} rows={4} />
            </FormCard>
        </Modal>
    );
};