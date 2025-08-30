'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
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
import { Modal } from '@/components/common/ui';
import {
  FormCard,
  FormDateInput,
  FormInput,
  FormIPAddressInput,
  FormSearchableSelect,
  FormSwitch,
  FormTextarea,
} from '@/components/common/form';
import { Option } from '@/components/common/ui/select/SearchableSelect';
import { SystemRowsWithCountWithRelations } from '@/types/view-row-types';

interface SystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  rowData: SystemRowsWithCountWithRelations | null;
  refetch: () => void;
}

export const SystemModal: FC<SystemModalProps> = ({
  isOpen,
  onClose,
  rowData,
  refetch,
}) => {
  const supabase = createClient();
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch data for dropdowns
  const { data: systemTypes = [], isLoading: isLoadingSystemTypes } =
    useGetLookupTypesByCategory(supabase, 'SYSTEM_TYPES');

  // Filter out DEFAULT system type
  const filteredSystemTypes = useMemo(() => {
    return systemTypes.filter((type) => type.name !== 'DEFAULT');
  }, [systemTypes]);

  const { data: nodes = [], isLoading: isLoadingNodes } = useTableQuery(
    supabase,
    'nodes',
    {
      columns: 'id, name',
      orderBy: [{ column: 'name' }],
    }
  );

  const {
    data: maintenanceTerminals = [],
    isLoading: isLoadingMaintenanceTerminals,
  } = useTableQuery(supabase, 'maintenance_areas', {
    columns: 'id, name',
    orderBy: [{ column: 'name' }],
  });
  const isLoading =
    isLoadingSystemTypes || isLoadingNodes || isLoadingMaintenanceTerminals;
  const systemTypesOptions: Option[] = useMemo(
    () =>
      filteredSystemTypes.map((t) => ({ value: String(t.id), label: t.code })),
    [filteredSystemTypes]
  );

  const nodesOptions: Option[] = useMemo(
    () => nodes.map((n) => ({ value: String(n.id), label: n.name })),
    [nodes]
  );

  const maintenanceTerminalsOptions: Option[] = useMemo(
    () =>
      maintenanceTerminals.map((t) => ({ value: String(t.id), label: t.name })),
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
    defaultValues: {
      system_name: null,
      system_type_id: '',
      node_id: '',
      maintenance_terminal_id: null,
      ip_address: '',
      commissioned_on: null,
      remark: null,
      status: true,
    },
  });

  // Reset form when modal opens or rowData changes
  useEffect(() => {
    if (!isOpen) {
      // Reset form when closing
      reset({
        system_name: null,
        system_type_id: '',
        node_id: '',
        maintenance_terminal_id: null,
        s_no: null,
        ip_address: '',
        commissioned_on: null,
        remark: null,
        status: true,
      });
      return;
    }

    // Wait for options to load before populating
    if (isLoading) {
      return;
    }

    if (rowData) {
      console.log('Raw rowData:', rowData); // Debug log

      // Cast rowData to access the joined fields that aren't in the base type
      const extendedRowData = rowData as SystemRowsWithCountWithRelations;

      // Find IDs by matching names/codes from the related data
      const findSystemTypeId = () => {
        if (rowData.system_type_id) return String(rowData.system_type_id);
        if (extendedRowData.system_type_code) {
          const matchedType = systemTypesOptions.find(
            (option) => option.label === extendedRowData.system_type_code
          );
          return matchedType ? matchedType.value : '';
        }
        return '';
      };

      const findNodeId = () => {
        if (rowData.node_id) return String(rowData.node_id);
        if (extendedRowData.node_name) {
          const matchedNode = nodesOptions.find(
            (option) => option.label === extendedRowData.node_name
          );
          return matchedNode ? matchedNode.value : '';
        }
        return '';
      };

      const findMaintenanceTerminalId = () => {
        if (rowData.maintenance_terminal_id)
          return String(rowData.maintenance_terminal_id);
        if (extendedRowData.system_maintenance_terminal_name) {
          const matchedTerminal = maintenanceTerminalsOptions.find(
            (option) =>
              option.label === extendedRowData.system_maintenance_terminal_name
          );
          return matchedTerminal ? matchedTerminal.value : '';
        }
        return '';
      };

      // Prepare form values - ensure all IDs are strings and handle null/undefined
      const formValues = {
        system_name: rowData.system_name || null,
        system_type_id: findSystemTypeId(),
        node_id: findNodeId(),
        maintenance_terminal_id: findMaintenanceTerminalId(),
        s_no: rowData.s_no || null,
        ip_address: rowData.ip_address?.toString() || '', // Let the form handle the value
        commissioned_on: rowData.commissioned_on
          ? new Date(rowData.commissioned_on)
          : null,
        remark: rowData.remark || null,
        status: rowData.status ?? true,
      };

      console.log('Populating form with:', formValues);
      console.log('Available options:', {
        systemTypesOptions,
        nodesOptions,
        maintenanceTerminalsOptions,
      });

      // Reset form with values
      reset(formValues);
    } else {
      // Reset to default values for new record
      reset({
        system_name: null,
        system_type_id: '',
        node_id: '',
        maintenance_terminal_id: null,
        s_no: null,
        ip_address: '',
        commissioned_on: null,
        remark: null,
        status: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, rowData, reset, setValue, isLoading]);

  // Data mutations
  const onMutationSuccess = () => {
    refetch();
    onClose();
  };

  const createSystemMutation = useTableInsert(supabase, 'systems', {
    onSuccess: onMutationSuccess,
  });
  const updateSystemMutation = useTableUpdate(supabase, 'systems', {
    onSuccess: onMutationSuccess,
  });

  // FIXED: Simplified onValidSubmit - removed nested onSuccess callbacks
  const onValidSubmit = useCallback(
    async (formData: SystemFormData) => {
      if (isProcessing) return; // Prevent multiple submissions

      setIsProcessing(true);
      try {
        // Transform the form data according to the schema
        const transformedData = systemFormSchema.safeParse(formData);

        if (!transformedData.success) {
          console.error('Form validation error:', transformedData.error);
          toast.error('Validation failed. Please check the form for errors.');
          return;
        }

        // Ensure we're passing a plain object, not an array
        const dataToSubmit = { ...transformedData.data };

        if (rowData) {
          // For updates
          updateSystemMutation.mutate({
            id: rowData.id as string,
            data: dataToSubmit,
          });
        } else {
          // For new records - ensure we're passing a single object, not an array
          createSystemMutation.mutate(dataToSubmit);
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
    [isProcessing, rowData, updateSystemMutation, createSystemMutation]
  );

  const submitting =
    createSystemMutation.isPending ||
    updateSystemMutation.isPending ||
    isSubmitting;

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

        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            System Type <span className="text-red-500">*</span>
          </label>
          <FormSearchableSelect
            name="system_type_id"
            label=""
            control={control}
            options={systemTypesOptions}
            required
            error={errors.system_type_id}
          />
        </div>

        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Node / Location <span className="text-red-500">*</span>
          </label>
          <FormSearchableSelect
            name="node_id"
            label=""
            control={control}
            options={nodesOptions}
            required
            error={errors.node_id}
          />
        </div>

        <FormDateInput
          name="commissioned_on"
          label="Commissioned On"
          control={control}
          error={errors.commissioned_on}
        />

        <FormIPAddressInput
          name="ip_address"
          label="IP Address"
          control={control}
          error={errors.ip_address}
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

        <div className="form-group">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Maintenance Terminal <span className="text-red-500">*</span>
          </label>
          <FormSearchableSelect
            name="maintenance_terminal_id"
            label=""
            control={control}
            options={maintenanceTerminalsOptions}
            required
            error={errors.maintenance_terminal_id}
          />
        </div>

        <FormSwitch
          name="status"
          label="Status"
          control={control}
          error={errors.status}
          className="my-2"
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
