// components/services/ServiceFormModal.tsx
'use client';

import { FC } from 'react';
import { SubmitHandler } from 'react-hook-form';
import {
  FormInput,
  FormSearchableSelect,
  FormSwitch,
  FormTextarea,
} from '@/components/common/form';
import { V_servicesRowSchema } from '@/schemas/zod-schemas';
import { useActiveNodeOptions, useLookupTypeOptions } from '@/hooks/data/useDropdownOptions';
import { BaseFormModal } from '@/components/common/form/BaseFormModal';
import { useFormModal } from '@/hooks/useFormModal';
import { z } from 'zod';

const serviceFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  node_id: z.string().min(1, 'Start Location is required'), // Changed to string for compatibility with Select values
  end_node_id: z.string().nullable().optional(),
  link_type_id: z.string().nullable().optional(),
  bandwidth_allocated: z.string().nullable().optional(),
  vlan: z.string().nullable().optional(),
  lc_id: z.string().nullable().optional(),
  unique_id: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.boolean(),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingService: V_servicesRowSchema | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export const ServiceFormModal: FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  editingService,
  onSubmit,
  isLoading,
}) => {
  const { options: nodeOptions, isLoading: isLoadingNodes } = useActiveNodeOptions();
  const { options: linkTypeOptions, isLoading: isLoadingLinks } =
    useLookupTypeOptions('LINK_TYPES');

  // Use the hook to handle form lifecycle
  const { form, isEditMode } = useFormModal<ServiceFormValues, V_servicesRowSchema>({
    isOpen,
    schema: serviceFormSchema,
    record: editingService,
    defaultValues: {
      name: '',
      node_id: '',
      end_node_id: '',
      link_type_id: '',
      bandwidth_allocated: '',
      vlan: '',
      lc_id: '',
      unique_id: '',
      description: '',
      status: true,
    },
    mapRecord: (record) => ({
      name: record.name || '',
      node_id: record.node_id || '',
      end_node_id: record.end_node_id || '',
      link_type_id: record.link_type_id || '',
      bandwidth_allocated: record.bandwidth_allocated || '',
      vlan: record.vlan || '',
      lc_id: record.lc_id || '',
      unique_id: record.unique_id || '',
      description: record.description || '',
      status: record.status ?? true,
    }),
  });

  const {
    register,
    control,
    watch,
    formState: { errors },
  } = form;

  const startNodeId = watch('node_id');

  // Filter end node options to prevent selecting same node as start
  const endNodeOptions = nodeOptions.filter((n) => n.value !== startNodeId);

  const onValidSubmit: SubmitHandler<ServiceFormValues> = (data) => {
    const toNull = (val: string | null | undefined) =>
      !val || val.trim() === '' ? null : val.trim();

    const sanitizedData = {
      ...data,
      end_node_id: toNull(data.end_node_id),
      link_type_id: toNull(data.link_type_id),
      bandwidth_allocated: toNull(data.bandwidth_allocated),
      vlan: toNull(data.vlan),
      lc_id: toNull(data.lc_id),
      unique_id: toNull(data.unique_id),
      description: toNull(data.description),
    };

    onSubmit(sanitizedData);
  };

  const combinedLoading = isLoading || isLoadingNodes || isLoadingLinks;

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title='Service'
      isEditMode={isEditMode}
      isLoading={combinedLoading}
      form={form}
      onSubmit={onValidSubmit}
      size='lg'
    >
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        <div className='md:col-span-2'>
          <FormInput
            name='name'
            label='Service / Customer Name'
            register={register}
            error={errors.name}
            required
            disabled={combinedLoading}
            placeholder='e.g. SBI-Kolkata-Main'
          />
        </div>

        <FormSearchableSelect
          name='node_id'
          label='Start Node / Location'
          control={control}
          options={nodeOptions}
          error={errors.node_id}
          required
          disabled={combinedLoading}
          placeholder='Select location A'
          isLoading={isLoadingNodes}
        />

        <FormSearchableSelect
          name='end_node_id'
          label='End Node / Destination (Optional)'
          control={control}
          options={endNodeOptions}
          error={errors.end_node_id}
          disabled={combinedLoading}
          placeholder='Select location B'
          isLoading={isLoadingNodes}
        />

        <FormSearchableSelect
          name='link_type_id'
          label='Link Type'
          control={control}
          options={linkTypeOptions}
          error={errors.link_type_id}
          disabled={combinedLoading}
          placeholder='e.g. MPLS, ILL'
          isLoading={isLoadingLinks}
        />

        <FormInput
          name='bandwidth_allocated'
          label='Bandwidth'
          register={register}
          error={errors.bandwidth_allocated}
          disabled={combinedLoading}
          placeholder='e.g. 100 Mbps'
        />

        <FormInput
          name='vlan'
          label='VLAN'
          register={register}
          error={errors.vlan}
          disabled={combinedLoading}
        />

        <FormInput
          name='lc_id'
          label='LC ID / Circuit ID'
          register={register}
          error={errors.lc_id}
          disabled={combinedLoading}
        />

        <FormInput
          name='unique_id'
          label='Unique ID'
          register={register}
          error={errors.unique_id}
          disabled={combinedLoading}
        />
      </div>
      <div className='mt-4'>
        <FormTextarea
          name='description'
          label='Description / Notes'
          control={control}
          error={errors.description}
          disabled={combinedLoading}
        />
        <FormSwitch name='status' label='Active Status' control={control} className='mt-4' />
      </div>
    </BaseFormModal>
  );
};
