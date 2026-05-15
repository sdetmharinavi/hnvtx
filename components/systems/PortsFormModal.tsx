// components/systems/PortsFormModal.tsx
'use client';

import { FC } from 'react';
import {
  ports_managementInsertSchema,
  V_ports_management_completeRowSchema,
} from '@/schemas/zod-schemas';
import { FormInput, FormSearchableSelect, FormSwitch } from '@/components/common/form';
import { z } from 'zod';
import { useLookupTypeOptions } from '@/hooks/data/useDropdownOptions';
import { BaseFormModal } from '@/components/common/form/BaseFormModal';
import { useFormModal } from '@/hooks/useFormModal';

type PortsFormValues = z.infer<typeof ports_managementInsertSchema>;

interface PortsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemId: string;
  editingRecord:
    | (V_ports_management_completeRowSchema & {
        port_utilization?: boolean | null;
        port_admin_status?: boolean | null;
        services_count?: number | null;
      })
    | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export const PortsFormModal: FC<PortsFormModalProps> = ({
  isOpen,
  onClose,
  systemId,
  editingRecord,
  onSubmit,
  isLoading,
}) => {
  const { options: portTypeOptions, isLoading: isLoadingTypes } =
    useLookupTypeOptions('PORT_TYPES');

  // Use the standardized hook for form lifecycle management
  const { form, isEditMode } = useFormModal<PortsFormValues, V_ports_management_completeRowSchema>({
    isOpen,
    schema: ports_managementInsertSchema,
    record: editingRecord,
    defaultValues: {
      system_id: systemId,
      port: '',
      port_type_id: null,
      port_capacity: null,
      sfp_serial_no: null,
      port_utilization: false,
      port_admin_status: false,
      services_count: 0,
    },
    // Map existing record data to form fields
    mapRecord: (record) => ({
      system_id: record.system_id ?? systemId,
      port: record.port,
      port_type_id: record.port_type_id,
      port_capacity: record.port_capacity,
      sfp_serial_no: record.sfp_serial_no,
      port_utilization: record.port_utilization ?? false,
      port_admin_status: record.port_admin_status ?? false,
      services_count: record.services_count ?? 0,
    }),
    // Re-initialize defaults if systemId changes while modal is closed
    resetDeps: [systemId],
  });

  const {
    control,
    register,
    formState: { errors },
  } = form;

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title='Port'
      isEditMode={isEditMode}
      isLoading={isLoading || isLoadingTypes}
      form={form}
      onSubmit={onSubmit}
    >
      <div className='space-y-6'>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormInput
            name='port'
            label='Port Name/Number'
            register={register}
            error={errors.port}
            required
            placeholder='e.g., Gi0/1'
          />
          <FormSearchableSelect
            name='port_type_id'
            label='Port Type'
            control={control}
            options={portTypeOptions}
            error={errors.port_type_id}
          />
          <FormInput
            name='port_capacity'
            label='Port Capacity'
            register={register}
            error={errors.port_capacity}
            placeholder='e.g., 1G, 10G'
          />
          <FormInput
            name='sfp_serial_no'
            label='SFP Serial No.'
            register={register}
            error={errors.sfp_serial_no}
          />
        </div>

        <div className='border-t border-gray-200 dark:border-gray-700 pt-4'>
          <h4 className='text-sm font-medium text-gray-900 dark:text-gray-100 mb-3'>
            Port Status & Metrics
          </h4>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-4'>
              <FormSwitch
                name='port_admin_status'
                label='Admin Status'
                control={control}
                error={errors.port_admin_status}
                description='Enable/Disable port (Up/Down)'
              />
              <FormSwitch
                name='port_utilization'
                label='Port Utilization'
                control={control}
                error={errors.port_utilization}
                description='Mark as currently in use'
              />
            </div>
            <div>
              <FormInput
                name='services_count'
                label='Services Count'
                type='number'
                min='0'
                register={register}
                error={errors.services_count}
                placeholder='0'
              />
            </div>
          </div>
        </div>
      </div>
    </BaseFormModal>
  );
};
