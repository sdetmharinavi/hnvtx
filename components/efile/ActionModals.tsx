'use client';

import { useEffect } from 'react';
import { Modal } from '@/components/common/ui';
import {
  FormCard,
  FormInput,
  FormTextarea,
  FormSearchableSelect,
  FormSelect,
  FormRichTextEditor,
  FormDateInput,
} from '@/components/common/form';
import { useForm, Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  initiateFileSchema,
  forwardFileSchema,
  InitiateFilePayload,
  ForwardFilePayload,
  UpdateMovementPayload,
  updateMovementSchema,
} from '@/schemas/efile-schemas';
import {
  useInitiateFile,
  useForwardFile,
  useUpdateFileDetails,
  useUpdateMovement,
} from '@/hooks/data/useEFilesData';
import {
  V_e_files_extendedRowSchema,
  V_file_movements_extendedRowSchema,
} from '@/schemas/zod-schemas';
import { useEmployeeOptions } from '@/hooks/data/useDropdownOptions';

// --- INITIATE MODAL ---
export const InitiateFileModal = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { mutate, isPending } = useInitiateFile();
  const { options: employeeOptions, isLoading: isLoadingEmployees } = useEmployeeOptions();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<InitiateFilePayload>({
    resolver: zodResolver(initiateFileSchema),
    defaultValues: {
      priority: 'normal',
      // Default to today in YYYY-MM-DD format for the date input
      action_date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = (data: InitiateFilePayload) => {
    mutate(data, { onSuccess: onClose });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Initiate New E-File"
      className="w-0 h-0 bg-transparent"
    >
      <FormCard
        onSubmit={handleSubmit(onSubmit)}
        onCancel={onClose}
        isLoading={isPending || isLoadingEmployees}
        title="New File Record"
        standalone
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              name="file_number"
              label="File Number *"
              register={register}
              error={errors.file_number}
              placeholder="e.g. FILE/2024/001"
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                name="priority"
                label="Priority"
                control={control}
                options={[
                  { value: 'normal', label: 'Normal' },
                  { value: 'urgent', label: 'Urgent' },
                  { value: 'immediate', label: 'Immediate' },
                ]}
              />
              <FormDateInput
                name="action_date"
                label="Creation Date"
                control={control}
                error={errors.action_date}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSelect
              name="category"
              label="Category *"
              control={control}
              options={[
                { value: 'administrative', label: 'Administrative' },
                { value: 'technical', label: 'Technical' },
                { value: 'other', label: 'Other' },
              ]}
            />
            <FormSearchableSelect
              name="initiator_employee_id"
              label="Initiator (Employee) *"
              control={control}
              options={employeeOptions}
              error={errors.initiator_employee_id}
              placeholder="Select employee..."
              required
              isLoading={isLoadingEmployees}
              searchPlaceholder="Search employees..."
            />
          </div>

          <FormInput
            name="subject"
            label="Subject *"
            register={register}
            error={errors.subject}
            required
          />
          <FormRichTextEditor
            name="description"
            label="Description"
            control={control}
            error={errors.description}
          />
          <FormTextarea
            name="remarks"
            label="Initial Note"
            control={control}
            rows={2}
            placeholder="e.g. Starting new file..."
          />
        </div>
      </FormCard>
    </Modal>
  );
};

// --- FORWARD MODAL ---
export const ForwardFileModal = ({
  isOpen,
  onClose,
  fileId,
}: {
  isOpen: boolean;
  onClose: () => void;
  fileId: string;
}) => {
  const { mutate, isPending } = useForwardFile();
  const { options: employeeOptions, isLoading: isLoadingEmployees } = useEmployeeOptions();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ForwardFilePayload>({
    resolver: zodResolver(forwardFileSchema) as Resolver<ForwardFilePayload>,
    defaultValues: {
      file_id: fileId,
      action_type: 'forwarded',
      action_date: new Date().toISOString().split('T')[0],
    },
  });

  const onSubmit = (data: ForwardFilePayload) => {
    mutate(data, { onSuccess: onClose });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Forward File">
      <FormCard
        onSubmit={handleSubmit(onSubmit)}
        onCancel={onClose}
        isLoading={isPending || isLoadingEmployees}
        title="Forwarding Details"
        standalone
        submitText="Send"
      >
        <FormSearchableSelect
          name="to_employee_id"
          label="Forward To (Employee) *"
          control={control}
          options={employeeOptions}
          error={errors.to_employee_id}
          placeholder="Select recipient..."
          required
          isLoading={isLoadingEmployees}
          searchPlaceholder="Search employees..."
        />
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            name="action_type"
            label="Action"
            control={control}
            options={[
              { value: 'forwarded', label: 'Forward' },
              { value: 'returned', label: 'Return' },
            ]}
          />
          <FormDateInput
            name="action_date"
            label="Movement Date"
            control={control}
            error={errors.action_date}
          />
        </div>
        <FormTextarea
          name="remarks"
          label="Remarks / Instructions *"
          control={control}
          error={errors.remarks}
          required
          rows={4}
        />
      </FormCard>
    </Modal>
  );
};

// --- EDIT MOVEMENT MODAL (NEW) ---
export const EditMovementModal = ({
  isOpen,
  onClose,
  movement,
  fileId,
}: {
  isOpen: boolean;
  onClose: () => void;
  movement: V_file_movements_extendedRowSchema;
  fileId: string;
}) => {
  const { mutate, isPending } = useUpdateMovement();

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<UpdateMovementPayload>({
    resolver: zodResolver(updateMovementSchema),
    defaultValues: {
      movement_id: movement.id || '',
      remarks: movement.remarks || '',
      // Use action_date if available, else created_at
      action_date: (movement?.action_date || movement?.created_at || '').split('T')[0] || '',
    },
  });

  useEffect(() => {
    if (isOpen && movement) {
      reset({
        movement_id: movement.id || '',
        remarks: movement.remarks || '',
        action_date: (movement?.action_date || movement?.created_at || '').split('T')[0] || '',
      });
    }
  }, [isOpen, movement, reset]);

  const onSubmit = (data: UpdateMovementPayload) => {
    mutate({ ...data, fileId }, { onSuccess: onClose });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Movement Log">
      <FormCard
        onSubmit={handleSubmit(onSubmit)}
        onCancel={onClose}
        isLoading={isPending}
        title="Edit Log Entry"
        standalone
        submitText="Save Changes"
      >
        <FormDateInput
          name="action_date"
          label="Date of Action"
          control={control}
          error={errors.action_date}
          required
        />
        <FormTextarea
          name="remarks"
          label="Remarks"
          control={control}
          error={errors.remarks}
          required
          rows={4}
        />
      </FormCard>
    </Modal>
  );
};

// --- EDIT DETAILS MODAL ---
const editSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  priority: z.enum(['normal', 'urgent', 'immediate']),
});

type EditSchemaType = z.infer<typeof editSchema>;

export const EditFileModal = ({
  isOpen,
  onClose,
  file,
}: {
  isOpen: boolean;
  onClose: () => void;
  file: V_e_files_extendedRowSchema;
}) => {
  const { mutate, isPending } = useUpdateFileDetails();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<EditSchemaType>({
    resolver: zodResolver(editSchema),
  });

  useEffect(() => {
    if (isOpen && file) {
      reset({
        subject: file.subject || '',
        description: file.description || '',
        category: file.category || '',
        priority: (file.priority as 'normal' | 'urgent' | 'immediate') || 'normal',
      });
    }
  }, [isOpen, file, reset]);

  const onSubmit = (data: EditSchemaType) => {
    if (!file.id) return;
    mutate(
      {
        file_id: file.id,
        subject: data.subject,
        description: data.description || '',
        category: data.category,
        priority: data.priority,
      },
      { onSuccess: onClose }
    );
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Edit File Details"
      className="w-0 h-0 bg-transparent"
    >
      <FormCard
        onSubmit={handleSubmit(onSubmit)}
        onCancel={onClose}
        isLoading={isPending}
        title="Edit Details"
        standalone
        submitText="Update"
      >
        <FormInput
          name="subject"
          label="Subject *"
          register={register}
          error={errors.subject}
          required
        />
        <div className="grid grid-cols-2 gap-4">
          <FormSelect
            name="category"
            label="Category *"
            control={control}
            options={[
              { value: 'administrative', label: 'Administrative' },
              { value: 'technical', label: 'Technical' },
              { value: 'other', label: 'Other' },
            ]}
            error={errors.category}
          />
          <FormSelect
            name="priority"
            label="Priority"
            control={control}
            options={[
              { value: 'normal', label: 'Normal' },
              { value: 'urgent', label: 'Urgent' },
              { value: 'immediate', label: 'Immediate' },
            ]}
          />
        </div>
        <FormRichTextEditor name="description" label="Description" control={control} />
      </FormCard>
    </Modal>
  );
};
