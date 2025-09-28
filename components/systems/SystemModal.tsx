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
import { V_systems_completeRowSchema } from '@/schemas/zod-schemas';
// CORRECTED: Import the new, correct validation schema
import { systemFormValidationSchema, SystemFormData } from '@/schemas/system-schemas';

type SystemFormValues = SystemFormData;

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

  const { data: systemTypes = [] } = useTableQuery(supabase, 'lookup_types', { filters: { category: 'SYSTEM_TYPES' } });
  const { data: nodes = [] } = useTableQuery(supabase, 'nodes', { columns: 'id, name, maintenance_terminal_id' });
  const { data: maintenanceTerminals = [] } = useTableQuery(supabase, 'maintenance_areas', { columns: 'id, name' });
  const { data: rings = [] } = useTableQuery(supabase, 'rings', { columns: 'id, name' });

  const systemTypeOptions = useMemo(() => systemTypes.map(st => ({ value: st.id, label: st.name })), [systemTypes]);
  const nodeOptions = useMemo(() => nodes.map(n => ({ value: n.id, label: n.name })), [nodes]);
  const maintenanceTerminalOptions = useMemo(() => maintenanceTerminals.map(mt => ({ value: mt.id, label: mt.name })), [maintenanceTerminals]);
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
    resolver: zodResolver(systemFormValidationSchema), // Use the correct form schema
    defaultValues: createDefaultFormValues()
  });

  const selectedSystemTypeId = watch('system_type_id');
  const selectedNodeId = watch('node_id');
  
  const selectedSystemType = useMemo(() => systemTypes.find(st => st.id === selectedSystemTypeId), [systemTypes, selectedSystemTypeId]);
  
  const isRingBasedSystem = useMemo(() => {
    if (!selectedSystemType) return false;
    return [
      'Next Gen Optical Transport Network', 'Converged Packet Aggregation Node', 'Multi-Access Aggregation Node', 
      'Multiprotocol Label Switching', 'Next Generation SDH', 'Optical Transport Network', 
      'Packet Transport Network', 'Plesiochronous Digital Hierarchy', 'Synchronous Digital Hierarchy'
    ].includes(selectedSystemType.name);
  }, [selectedSystemType]);

  useEffect(() => {
    if (!isOpen) return;
    if (isEditMode && rowData) {
      reset({
        system_name: rowData.system_name || '',
        system_type_id: rowData.system_type_id || '',
        node_id: rowData.node_id || '',
        maintenance_terminal_id: rowData.maintenance_terminal_id,
        ip_address: (rowData.ip_address as string) || '',
        commissioned_on: rowData.commissioned_on || null,
        remark: rowData.remark || '',
        s_no: rowData.s_no || '',
        status: rowData.status ?? true,
        ring_id: rowData.ring_id,
        gne: rowData.sdh_gne,
        make: rowData.sdh_make,
        vm_id: rowData.vmux_vm_id,
      });
    } else {
      reset(createDefaultFormValues());
    }
  }, [isOpen, isEditMode, rowData, reset]);

  useEffect(() => {
    if (selectedNodeId) {
      const matchedNode = nodes.find((node) => node.id === selectedNodeId);
      if (matchedNode?.maintenance_terminal_id) {
        setValue('maintenance_terminal_id', matchedNode.maintenance_terminal_id);
      }
    }
  }, [selectedNodeId, nodes, setValue]);

  const upsertSystemMutation = useRpcMutation(supabase, 'upsert_system_with_details', {
    onSuccess: () => {
      toast.success(`System ${isEditMode ? 'updated' : 'created'} successfully.`);
      refetch();
      onClose();
    },
    onError: (err) => toast.error(`Failed to save system: ${err.message}`),
  });

  const onValidSubmit = useCallback((formData: SystemFormValues) => {
    console.log("formData", formData);
    const payload: RpcFunctionArgs<'upsert_system_with_details'> = {
      p_system_name: formData.system_name!,
      p_system_type_id: formData.system_type_id!,
      p_node_id: formData.node_id!,
      p_status: formData.status ?? true,
      p_ip_address: formData.ip_address || undefined,
      p_maintenance_terminal_id: formData.maintenance_terminal_id || undefined,
      p_commissioned_on: formData.commissioned_on ? formData.commissioned_on : undefined,
      p_s_no: formData.s_no || undefined,
      p_remark: formData.remark || undefined,
      p_id: isEditMode ? rowData!.id! : undefined,
      p_ring_id: isRingBasedSystem ? (formData.ring_id || undefined) : undefined,
      p_gne: formData.gne || undefined,
      p_make: formData.make || undefined,
      p_vm_id: formData.vm_id || undefined,
    };
    upsertSystemMutation.mutate(payload);
  }, [isEditMode, rowData, upsertSystemMutation, isRingBasedSystem]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? 'Edit System' : 'Add System'} size="xl" visible={false} className="h-screen w-screen transparent bg-gray-700 rounded-2xl">
      <FormCard
        onSubmit={handleSubmit(onValidSubmit, (errors) => console.error("Form validation errors:", errors))}
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

          {selectedSystemType?.name === 'SDH' && (
            <>
              <FormInput name="gne" label="GNE" register={register} error={errors.gne} />
              <FormInput name="make" label="Make" register={register} error={errors.make} />
            </>
          )}
          
          {isRingBasedSystem && (
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