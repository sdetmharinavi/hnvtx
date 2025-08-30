'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import {
  useGetLookupTypesByCategory,
  useTableQuery,
  useTableInsert,
  useTableUpdate,
} from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { SystemFormData, systemFormSchema } from '@/schemas';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import z from 'zod';
import { SystemRowsWithRelations } from '@/types/relational-row-types';
import { Modal } from '@/components/common/ui';
import {
  FormCard,
  FormDateInput,
  FormInput,
  FormSearchableSelect,
  FormSwitch,
  FormTextarea,
} from '@/components/common/form';
import IPAddressInput from '@/components/common/form/IPAddressInput';
import { Option } from '@/components/common/ui/select/SearchableSelect';

interface AddSystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  rowData: SystemRowsWithRelations | null;
  onCreated: (data: z.output<typeof systemFormSchema>) => void;
  onUpdated: (data: z.output<typeof systemFormSchema>) => void;
}

export const AddSystemModal: FC<AddSystemModalProps> = ({
  isOpen,
  onClose,
  rowData,
  onCreated,
  onUpdated,
}) => {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [ipv4Value, setIPv4Value] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch data for dropdowns
  const { data: systemTypes = [], isLoading: isLoadingSystemTypes } =
    useGetLookupTypesByCategory(supabase, 'SYSTEM_TYPES');

  // Filter out DEFAULT system type
  const filteredSystemTypes = useMemo(() => {
    return systemTypes.filter(type => type.name !== 'DEFAULT');
  }, [systemTypes]);
  const { data: nodes = [], isLoading: isLoadingNodes } = useTableQuery(
    supabase,
    'nodes',
    {
      columns: 'id, name',
      orderBy: [{ column: 'name' }],
    }
  );

  const { data: maintenanceTerminals = [], isLoading: isLoadingMaintenanceTerminals } =
    useTableQuery(
      supabase,
      'maintenance_areas',  
      {
        columns: 'id, name',
        orderBy: [{ column: 'name' }],
      }
    );

  const systemTypesOptions: Option[] = useMemo(
    () => filteredSystemTypes.map((t) => ({ value: t.id, label: t.code })),
    [filteredSystemTypes]
  );

  const nodesOptions: Option[] = useMemo(
    () => nodes.map((n) => ({ value: n.id, label: n.name })),
    [nodes]
  );

  const maintenanceTerminalsOptions: Option[] = useMemo(
    () => maintenanceTerminals.map((t) => ({ value: t.id, label: t.name })),
    [maintenanceTerminals]
  );

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    setValue,
  } = useForm<SystemFormData>({
    resolver: zodResolver(systemFormSchema),
    defaultValues: getDefaultFormValues(rowData)
  });

  // Reset form when modal opens or rowData changes
  useEffect(() => {
    reset(getDefaultFormValues(rowData));
  }, [rowData, reset]);

  // Helper function to get default form values
  function getDefaultFormValues(data: SystemRowsWithRelations | null): SystemFormData {
    if (!data) {
      return {
        system_name: null,
        system_type_id: '',
        node_id: '',
        maintenance_terminal_id: null,
        ip_address: '',
        commissioned_on: null,
        remark: null,
        status: true,
      };
    }

    return {
      system_name: data.system_name || null,
      system_type_id: data.system_type_id,
      node_id: data.node_id,
      maintenance_terminal_id: data.maintenance_terminal_id || null,
      ip_address: (data.ip_address as string) || '',
      commissioned_on: data.commissioned_on ? new Date(data.commissioned_on) : null,
      remark: data.remark || null,
      status: data.status ?? true,
    };
  }

  // Mutation to insert a new system - FIXED: Removed duplicate onSuccess callbacks
  const { mutate: addSystem, isPending: isAddingSystem } = useTableInsert(
    supabase,
    'systems',
    {
      onSuccess: (data) => {
        toast.success('System added successfully!');
        queryClient.invalidateQueries({ queryKey: ['v_systems_complete'] });
        // Parse the form data that was submitted
        const parsedData = systemFormSchema.parse(data);
        onCreated(parsedData);
        onClose();
      },
      onError: (error) => {
        toast.error(`Failed to add system: ${error.message}`);
      },
    }
  );

  // Mutation to update an existing system - FIXED: Removed duplicate onSuccess callbacks
  const { mutate: updateSystem, isPending: isUpdatingSystem } = useTableUpdate(
    supabase,
    'systems',
    {
      onSuccess: (data) => {
        toast.success('System updated successfully!');
        queryClient.invalidateQueries({ queryKey: ['v_systems_complete'] });
        // Parse the form data that was submitted
        const parsedData = systemFormSchema.parse(data);
        onUpdated(parsedData);
        onClose();
      },
      onError: (error) => {
        toast.error(`Failed to update system: ${error.message}`);
      },
    }
  );

  // FIXED: Simplified onValidSubmit - removed nested onSuccess callbacks
  const onValidSubmit = useCallback(
    async (formData: SystemFormData) => {
      if (isProcessing) return; // Prevent multiple submissions
    
      setIsProcessing(true);
      try {
        // The form data is already validated by zod, but we need to ensure proper typing
        const transformedData = systemFormSchema.parse(formData);

        if (rowData) {
          // For updates - just call the mutation, let the hook handle success/error
          updateSystem({
            id: rowData.id,
            data: transformedData,
          });
        } else {
          // For new records - just call the mutation, let the hook handle success/error
          addSystem(transformedData);
        }
      } catch (error) {
        console.error('Form validation error:', error);
        if (error instanceof z.ZodError) {
          toast.error('Validation failed. Please check the form for errors.');
        } else {
          toast.error('An unexpected error occurred. Please try again.');
        }
      } finally {
        setIsProcessing(false);
      }
    },
    [isProcessing, rowData, updateSystem, addSystem]
  );

  const submitting = isAddingSystem || isUpdatingSystem || isSubmitting;
  const isLoading = isLoadingSystemTypes || isLoadingNodes || isLoadingMaintenanceTerminals;

  if (!isOpen) {
    return null;
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={rowData ? 'Edit System' : 'Add System'}
      visible={false}
      className="h-screen w-screen transparent bg-gray-700 rounded-2xl"
    >
      {/* Form */}
      <FormCard
        onSubmit={handleSubmit(onValidSubmit)}
        heightClass="min-h-calc(90vh - 200px)"
        title={rowData ? 'Edit System' : 'Add System'}
        onCancel={onClose}
        isLoading={isLoading}
        disableSubmit={submitting}
        standalone
      >
        <FormInput
          name="system_name"
          label="System Name"
          type="text"
          required
          register={register}
          error={errors.system_name}
        />
        <FormSearchableSelect
          name="system_type_id"
          label="System Type"
          control={control}
          options={systemTypesOptions}
          required
          error={errors.system_type_id}
        />

        <FormSearchableSelect
          name="node_id"
          label="Node / Location"
          control={control}
          options={nodesOptions}
          required
          error={errors.node_id}
        />

        <FormDateInput
          name="commissioned_on"
          label="Commissioned On"
          control={control}
          error={errors.commissioned_on}
        />

        <IPAddressInput
          value={ipv4Value}
          label="IP Address"
          onChange={(value, validation) => {
            if (validation.isValid) {
              setIPv4Value(value);
              setValue('ip_address', value, { shouldValidate: true });
            }
          }}
          placeholder="Enter IPv4 address (e.g., 192.168.1.1)"
          allowIPv4={true}
          allowIPv6={false}
        />

        <FormInput
          name="s_no"
          label="Serial Number"
          type="text"
          required
          register={register}
          error={errors.s_no}
        />
        
        <FormSearchableSelect
          name="maintenance_terminal_id"
          label="Maintenance Terminal"
          control={control}
          options={maintenanceTerminalsOptions}
          required
          error={errors.maintenance_terminal_id}
        />
          
        <FormSwitch
          name="status"
          label="Status"
          control={control}
          error={errors.status}
          className='my-2'
        />

        <FormTextarea
          name="remark"
          label="Remark"
          control={control}
          error={errors.remark}
        />
      </FormCard>
    </Modal>
  );
};