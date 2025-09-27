// path: components/systems/SystemModal.tsx

'use client';

import { FC, useCallback, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { useTableQuery } from '@/hooks/database';
import { useRpcMutation } from '@/hooks/database/rpc-queries';
import type { RpcFunctionArgs } from '@/hooks/database/queries-type-helpers';
import { createClient } from '@/utils/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Modal } from '@/components/common/ui';
import { FormCard, FormDateInput, FormInput, FormIPAddressInput, FormSearchableSelect, FormSwitch, FormTextarea } from '@/components/common/form';
import { V_systems_completeRowSchema, systemsInsertSchema, SystemsInsertSchema } from '@/schemas/zod-schemas';
import { Option } from '@/components/common/ui/select/SearchableSelect';

// This type represents all possible fields the form can handle.
// It's a combination of the base system insert type and all possible subtype fields.
type SystemFormValues = SystemsInsertSchema & {
  ring_id?: string | null;
  gne?: string | null;
  make?: string | null;
  vm_id?: string | null;
};

// A helper function to provide clean default values for the form.
const createDefaultFormValues = (): SystemFormValues => ({
  system_name: '',
  system_type_id: '',
  node_id: '',
  maintenance_terminal_id: null,
  ip_address: '',
  commissioned_on: null,
  remark: '',
  s_no: '',
  status: true,
  ring_id: null,
  gne: '',
  make: '',
  vm_id: '',
});

interface SystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  rowData: V_systems_completeRowSchema | null;
  refetch: () => void;
}

export const SystemModal: FC<SystemModalProps> = ({ isOpen, onClose, rowData, refetch }) => {
  const supabase = createClient();
  const isEditMode = !!rowData;

  // Fetch data for dropdowns, memoized for performance
  const { data: systemTypes = [] } = useTableQuery(supabase, 'lookup_types', { filters: { category: 'SYSTEM_TYPES' } });
  const { data: nodes = [] } = useTableQuery(supabase, 'nodes', { columns: 'id, name, maintenance_terminal_id' });
  const { data: maintenanceTerminals = [] } = useTableQuery(supabase, 'maintenance_areas', { columns: 'id, name' });
  const { data: rings = [] } = useTableQuery(supabase, 'rings', { columns: 'id, name' });

  const systemTypeOptions = useMemo(() => systemTypes.map(st => ({ value: st.id, label: st.name })), [systemTypes]);
  const nodeOptions = useMemo(() => nodes.map(n => ({ value: n.id, label: n.name })), [nodes]);
  const maintenanceTerminalOptions = useMemo(() => {
    const baseOptions = maintenanceTerminals.map(mt => ({ value: mt.id, label: mt.name }));

    if (isEditMode && rowData) {
      const normalizedTerminalName = rowData.system_maintenance_terminal_name?.trim().toLowerCase();
      const nodeMatch = rowData.node_id
        ? nodes.find((node) => node.id === rowData.node_id)
        : normalizedTerminalName
          ? nodes.find((node) => node.name?.trim().toLowerCase() === normalizedTerminalName)
          : undefined;

      const candidateIds = [
        rowData.maintenance_terminal_id,
        nodeMatch?.maintenance_terminal_id,
      ].filter((value): value is string => !!value);

      for (const candidateId of candidateIds) {
        const hasExistingOption = baseOptions.some(option => option.value === candidateId);
        if (!hasExistingOption) {
          baseOptions.push({
            value: candidateId,
            label: rowData.system_maintenance_terminal_name || 'Existing Maintenance Terminal',
          });
        }
      }
    }

    return baseOptions;
  }, [maintenanceTerminals, isEditMode, rowData, nodes]);
  const ringOptions = useMemo(() => rings.map(r => ({ value: r.id, label: r.name })), [rings]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch,
    setValue,
  } = useForm<SystemFormValues>({
    // IMPORTANT: The resolver validates against the BASE schema.
    // The RPC function will handle the logic for the optional subtype fields.
    resolver: zodResolver(systemsInsertSchema), 
    defaultValues: createDefaultFormValues()
  });

  const selectedSystemTypeId = watch('system_type_id');
  const selectedNodeId = watch('node_id');
  const selectedMaintenanceTerminalId = watch('maintenance_terminal_id');
  const selectedSystemType = useMemo(() => systemTypes.find(st => st.id === selectedSystemTypeId), [systemTypes, selectedSystemTypeId]);

  // Effect to reset and populate the form when the modal opens or the data changes.
  useEffect(() => {
    if (!isOpen) return;

    if (isEditMode && rowData) {
      const resolvedSystemTypeId = rowData.system_type_id
        ?? systemTypes.find((type) => type.name === rowData.system_type_name)?.id
        ?? '';

      const resolvedNodeId = rowData.node_id
        ?? nodes.find((node) => node.name === rowData.node_name)?.id
        ?? '';

      const maintenanceTerminalById = rowData.maintenance_terminal_id
        ? maintenanceTerminals.find((terminal) => terminal.id === rowData.maintenance_terminal_id)
        : undefined;

      const normalizedTerminalName = rowData.system_maintenance_terminal_name?.trim().toLowerCase();
      const maintenanceTerminalByName = normalizedTerminalName
        ? maintenanceTerminals.find((terminal) => terminal.name?.trim().toLowerCase() === normalizedTerminalName)
        : undefined;

      const nodeMatch = rowData.node_id
        ? nodes.find((node) => node.id === rowData.node_id)
        : undefined;

      const resolvedMaintenanceTerminalId = maintenanceTerminalById?.id
        ?? maintenanceTerminalByName?.id
        ?? nodeMatch?.maintenance_terminal_id
        ?? (rowData.maintenance_terminal_id && rowData.maintenance_terminal_id !== '' ? rowData.maintenance_terminal_id : null);

      const resolvedRingId = rowData.ring_id
        ?? rings.find((ring) => ring.name === rowData.ring_logical_area_name)?.id
        ?? null;

      reset({
        system_name: rowData.system_name || '',
        system_type_id: resolvedSystemTypeId,
        node_id: resolvedNodeId,
        maintenance_terminal_id: resolvedMaintenanceTerminalId,
        ip_address: (rowData.ip_address as string) || '',
        commissioned_on: rowData.commissioned_on || null,
        remark: rowData.remark || '',
        s_no: rowData.s_no || '',
        status: rowData.status ?? true,
        ring_id: resolvedRingId,
        gne: rowData.sdh_gne,
        make: rowData.sdh_make,
        vm_id: rowData.vmux_vm_id,
      });
    } else {
      reset(createDefaultFormValues());
    }
  }, [
    isOpen,
    isEditMode,
    rowData,
    reset,
    systemTypes,
    nodes,
    maintenanceTerminals,
    rings,
  ]);

  useEffect(() => {
    if (!selectedNodeId || selectedMaintenanceTerminalId) return;

    const matchedNode = nodes.find((node) => node.id === selectedNodeId);
    if (!matchedNode?.maintenance_terminal_id) return;

    setValue('maintenance_terminal_id', matchedNode.maintenance_terminal_id);
  }, [selectedNodeId, selectedMaintenanceTerminalId, nodes, setValue]);

  const upsertSystemMutation = useRpcMutation(supabase, 'upsert_system_with_details', {
    onSuccess: () => {
      toast.success(`System ${isEditMode ? 'updated' : 'created'} successfully.`);
      refetch();
      onClose();
    },
    onError: (err) => toast.error(`Failed to save system: ${err.message}`),
  });

  const onValidSubmit = useCallback((formData: SystemFormValues) => {
    // Construct the payload for our transactional RPC function
    const payload = {
      p_id: isEditMode ? rowData!.id! : undefined,
      p_system_name: formData.system_name || '', // Ensure it's a string, not null
      p_system_type_id: formData.system_type_id!, // Assumes this is always present
      p_node_id: formData.node_id!, // Assumes this is always present
      p_ip_address: formData.ip_address || null,
      p_maintenance_terminal_id: formData.maintenance_terminal_id ?? null, // Convert undefined to null for optional UUID
      p_commissioned_on: formData.commissioned_on ?? null, // Convert undefined to null for optional date
      p_s_no: formData.s_no || null,
      p_remark: formData.remark || '', // Ensure string
      p_status: formData.status ?? true,
      p_ring_id: formData.ring_id || undefined, // Convert null to undefined
      p_gne: formData.gne || undefined, // Convert null to undefined
      p_make: formData.make || undefined, // Convert null to undefined
      p_vm_id: formData.vm_id || undefined, // Convert null to undefined
    } as RpcFunctionArgs<'upsert_system_with_details'>;
    upsertSystemMutation.mutate(payload);
  }, [isEditMode, rowData, upsertSystemMutation]);
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit System' : 'Add System'} size="xl" visible={false} className="h-screen w-screen transparent bg-gray-700 rounded-2xl">
      <FormCard
        onSubmit={handleSubmit(onValidSubmit)}
        onCancel={onClose}
        isLoading={upsertSystemMutation.isPending || isSubmitting}
        standalone
        title={isEditMode ? 'Edit System' : 'Add System'}
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput name="system_name" label="System Name" register={register} error={errors.system_name} required />
          <FormSearchableSelect name="system_type_id" label="System Type" control={control} options={systemTypeOptions} error={errors.system_type_id} required />
          <FormSearchableSelect name="node_id" label="Node / Location" control={control} options={nodeOptions} error={errors.node_id} required />
          <FormSearchableSelect name="maintenance_terminal_id" label="Maintenance Terminal" control={control} options={maintenanceTerminalOptions} error={errors.maintenance_terminal_id} />
          <FormIPAddressInput name="ip_address" label="IP Address" control={control} error={errors.ip_address} />
          <FormDateInput name="commissioned_on" label="Commissioned On" control={control} error={errors.commissioned_on} />
          <FormInput name="s_no" label="Serial Number" register={register} error={errors.s_no} />
          
          {/* Conditional Fields */}
          {selectedSystemType?.name === 'SDH' && (
            <>
              <FormInput name="gne" label="GNE" register={register} error={errors.gne} />
              <FormInput name="make" label="Make" register={register} error={errors.make} />
            </>
          )}
          {(selectedSystemType?.name === 'CPAN' || selectedSystemType?.name === 'MAAN') && (
            <FormSearchableSelect name="ring_id" label="Ring" control={control} options={ringOptions} error={errors.ring_id} />
          )}
          {selectedSystemType?.name === 'VMUX' && (
            <FormInput name="vm_id" label="VM ID" register={register} error={errors.vm_id} />
          )}
        </div>
        <FormSwitch name="status" label="Status" control={control} className="my-4" />
        <FormTextarea name="remark" label="Remark" control={control} error={errors.remark} />
      </FormCard>
    </Modal>
  );
};