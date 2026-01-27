// components/nodes/NodeFormModal.tsx
'use client';

import React from 'react';
import {
  FormInput,
  FormSearchableSelect,
  FormSwitch,
  FormTextarea,
} from '@/components/common/form/FormControls';
import { NodesInsertSchema, nodesInsertSchema, NodesRowSchema } from '@/schemas/zod-schemas';
import { useLookupTypeOptions, useMaintenanceAreaOptions } from '@/hooks/data/useDropdownOptions';
import { BaseFormModal } from '@/components/common/form/BaseFormModal';
import { useFormModal } from '@/hooks/useFormModal';

interface NodeFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingNode?: NodesRowSchema | null;
  onSubmit: (data: NodesInsertSchema) => void;
  isLoading: boolean;
}

export function NodeFormModal({
  isOpen,
  onClose,
  editingNode,
  onSubmit,
  isLoading,
}: NodeFormModalProps) {
  const { options: nodeTypeOptions } = useLookupTypeOptions('NODE_TYPES');
  const { options: maintenanceAreaOptions } = useMaintenanceAreaOptions();

  const { form, isEditMode } = useFormModal<NodesInsertSchema, NodesRowSchema>({
    isOpen,
    schema: nodesInsertSchema,
    record: editingNode,
    defaultValues: {
      name: '',
      node_type_id: null,
      latitude: null,
      longitude: null,
      maintenance_terminal_id: null,
      remark: null,
      status: true,
    },
    mapRecord: (record) => ({
      name: record.name ?? '',
      node_type_id: record.node_type_id ?? null,
      latitude: record.latitude,
      longitude: record.longitude,
      maintenance_terminal_id: record.maintenance_terminal_id ?? null,
      remark: typeof record.remark === 'string' ? record.remark : null,
      status: record.status ?? true,
    }),
  });

  const {
    register,
    control,
    formState: { errors },
  } = form;

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title='Node'
      isEditMode={isEditMode}
      isLoading={isLoading}
      form={form}
      onSubmit={onSubmit}
    >
      <div className='space-y-6'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700'>
            Basic Information
          </h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6'>
            <div className='md:col-span-2'>
              <FormInput
                name='name'
                label='Node Name'
                register={register}
                error={errors.name}
                disabled={isLoading}
                placeholder='Enter node name'
              />
            </div>
            <FormSearchableSelect
              name='node_type_id'
              label='Node Type'
              control={control}
              options={nodeTypeOptions}
              error={errors.node_type_id}
              disabled={isLoading}
              placeholder='Select node type'
            />
            <FormSearchableSelect
              name='maintenance_terminal_id'
              label='Maintenance Terminal'
              control={control}
              options={maintenanceAreaOptions}
              error={errors.maintenance_terminal_id}
              disabled={isLoading}
              placeholder='Select maintenance terminal'
            />
          </div>
        </div>

        <div>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700'>
            Location Coordinates
          </h3>
          <div className='grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6'>
            <FormInput
              name='latitude'
              label='Latitude'
              register={register}
              error={errors.latitude}
              disabled={isLoading}
              type='number'
              step='any'
              placeholder='e.g., 22.5726'
            />
            <FormInput
              name='longitude'
              label='Longitude'
              register={register}
              error={errors.longitude}
              disabled={isLoading}
              type='number'
              step='any'
              placeholder='e.g., 88.3639'
            />
          </div>
        </div>

        <div>
          <h3 className='text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 pb-2 border-b border-gray-200 dark:border-gray-700'>
            Additional Information
          </h3>
          <div className='space-y-4 md:space-y-6'>
            <FormTextarea
              name='remark'
              label='Remark'
              control={control}
              error={errors.remark}
              disabled={isLoading}
              placeholder='Add any additional notes or remarks'
              rows={4}
            />
            <div className='flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg'>
              <div>
                <p className='font-medium text-gray-900 dark:text-gray-100'>Node Status</p>
                <p className='text-sm text-gray-500 dark:text-gray-400 mt-1'>
                  Enable or disable this node
                </p>
              </div>
              <FormSwitch name='status' label='' control={control} error={errors.status} />
            </div>
          </div>
        </div>
      </div>
    </BaseFormModal>
  );
}
