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

type SystemFormValues = SystemsInsertSchema & {
  ring_id?: string;
  gne?: string;
  make?: string;
  vm_id?: string;
};

const createDefaultFormValues = (): SystemFormValues => ({
  status: true,
  system_name: '',
  system_type_id: '',
  node_id: '',
  maintenance_terminal_id: undefined,
  ip_address: '',
  commissioned_on: null,
  remark: '',
  s_no: '',
  ring_id: undefined,
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

  // Fetch data for dropdowns
  const { data: systemTypes = [] } = useTableQuery(supabase, 'lookup_types', { filters: { category: 'SYSTEM_TYPES' } });
  const { data: nodes = [] } = useTableQuery(supabase, 'nodes', { columns: 'id, name' });
  const { data: maintenanceTerminals = [] } = useTableQuery(supabase, 'maintenance_areas', { columns: 'id, name' });
  const { data: rings = [] } = useTableQuery(supabase, 'rings', { columns: 'id, name' });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
    watch,
  } = useForm<SystemFormValues>({
    resolver: zodResolver(systemsInsertSchema), // We only validate the base schema here
    defaultValues: createDefaultFormValues()
  });

  const selectedSystemTypeId = watch('system_type_id');
  const selectedSystemType = useMemo(() => systemTypes.find(st => st.id === selectedSystemTypeId), [systemTypes, selectedSystemTypeId]);

  useEffect(() => {
    if (rowData) {
      reset({
        ...createDefaultFormValues(),
        system_name: rowData.system_name ?? '',
        system_type_id: rowData.system_type_id ?? '',
        node_id: rowData.node_id ?? '',
        maintenance_terminal_id: rowData.maintenance_terminal_id ?? undefined,
        ip_address: rowData.ip_address ?? '',
        commissioned_on: rowData.commissioned_on ?? null,
        remark: rowData.remark ?? '',
        s_no: rowData.s_no ?? '',
        status: rowData.status ?? true,
        ring_id: rowData.ring_id ?? undefined,
        gne: rowData.sdh_gne ?? '',
        make: rowData.sdh_make ?? '',
        vm_id: rowData.vmux_vm_id ?? '',
      });
    } else {
      reset(createDefaultFormValues());
    }
  }, [rowData, reset]);

  const upsertSystemMutation = useRpcMutation(supabase, 'upsert_system_with_details', {
    onSuccess: () => {
      toast.success(`System ${isEditMode ? 'updated' : 'created'} successfully.`);
      refetch();
      onClose();
    },
    onError: (err) => toast.error(`Failed to save system: ${err.message}`),
  });

  const onValidSubmit = useCallback((formData: any) => {
    const payload: Partial<RpcFunctionArgs<'upsert_system_with_details'>> = {
      p_system_name: formData.system_name,
      p_system_type_id: formData.system_type_id,
      p_node_id: formData.node_id,
      p_ip_address: formData.ip_address,
      p_maintenance_terminal_id: formData.maintenance_terminal_id,
      p_commissioned_on: formData.commissioned_on,
      p_s_no: formData.s_no,
      p_remark: formData.remark,
      p_status: formData.status,
      p_ring_id: formData.ring_id,
      p_gne: formData.gne,
      p_make: formData.make,
      p_vm_id: formData.vm_id,
    };

    if (isEditMode && rowData?.id) {
      payload.p_id = rowData.id;
    }

    // cast to the full args type after conditionally adding p_id
    upsertSystemMutation.mutate(payload as RpcFunctionArgs<'upsert_system_with_details'>);
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
          <FormSearchableSelect name="system_type_id" label="System Type" control={control} options={systemTypes.map(st => ({ value: st.id, label: st.name }))} error={errors.system_type_id} required />
          <FormSearchableSelect name="node_id" label="Node / Location" control={control} options={nodes.map(n => ({ value: n.id, label: n.name }))} error={errors.node_id} required />
          <FormSearchableSelect name="maintenance_terminal_id" label="Maintenance Terminal" control={control} options={maintenanceTerminals.map(mt => ({ value: mt.id, label: mt.name }))} error={errors.maintenance_terminal_id} />
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
            <FormSearchableSelect name="ring_id" label="Ring" control={control} options={rings.map(r => ({ value: r.id, label: r.name }))} error={errors.ring_id} />
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