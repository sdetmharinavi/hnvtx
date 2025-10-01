// path: components/systems/SystemModal.tsx

'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useTableQuery } from '@/hooks/database';
import { useRpcMutation } from '@/hooks/database/rpc-queries';
import type { RpcFunctionArgs } from '@/hooks/database/queries-type-helpers';
import { createClient } from '@/utils/supabase/client';
import { useForm, FieldErrors } from 'react-hook-form'; // Import FieldErrors
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Modal } from '@/components/common/ui';
import { FormCard, FormDateInput, FormInput, FormIPAddressInput, FormSearchableSelect, FormSwitch, FormTextarea } from '@/components/common/form';
import { V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import { systemFormValidationSchema, SystemFormData } from '@/schemas/system-schemas';
import { AnimatePresence, motion } from 'framer-motion';

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
  const [step, setStep] = useState(1);

  const { data: systemTypes = [] } = useTableQuery(supabase, 'lookup_types', { columns: 'id, name, category', filters: { category: 'SYSTEM_TYPES' } });
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
    trigger,
  } = useForm<SystemFormValues>({
    resolver: zodResolver(systemFormValidationSchema),
    defaultValues: createDefaultFormValues(),
    mode: 'onChange'
  });

  const selectedSystemTypeId = watch('system_type_id');
  const selectedNodeId = watch('node_id');

  const selectedSystemType = useMemo(() => systemTypes.find(st => st.id === selectedSystemTypeId), [systemTypes, selectedSystemTypeId]);

  const isRingBasedSystem = useMemo(() => selectedSystemType?.category?.includes('RING_BASED'), [selectedSystemType]);
  const isSdhSystem = useMemo(() => selectedSystemType?.name.includes('SDH'), [selectedSystemType]);
  const isVmuxSystem = useMemo(() => selectedSystemType?.name === 'VMUX', [selectedSystemType]);
  const needsStep2 = isRingBasedSystem || isSdhSystem || isVmuxSystem;

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
        reset(createDefaultFormValues());
        setStep(1);
    }, 200);
  }, [onClose, reset]);

  useEffect(() => {
    if (isOpen) {
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
                make: rowData.make,
                vm_id: rowData.vmux_vm_id,
            });
        } else {
            reset(createDefaultFormValues());
        }
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
      handleClose();
    },
    onError: (err) => toast.error(`Failed to save system: ${err.message}`),
  });

  const onValidSubmit = useCallback((formData: SystemFormValues) => {
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
        p_gne: isSdhSystem ? (formData.gne || undefined) : undefined,
        p_make: formData.make || undefined,
        p_vm_id: isVmuxSystem ? (formData.vm_id || undefined) : undefined,
    };
    upsertSystemMutation.mutate(payload);
  }, [isEditMode, rowData, upsertSystemMutation, isRingBasedSystem, isSdhSystem, isVmuxSystem]);
  
  // **THE FIX: Create the onInvalid handler.**
  const onInvalidSubmit = (errors: FieldErrors<SystemFormValues>) => {
    toast.error("Validation failed. Please check required fields on all steps.");
    // If the error is not in the current step, switch to step 1 to show it.
    const step1Fields: (keyof SystemFormValues)[] = ['system_name', 'system_type_id', 'node_id'];
    const hasErrorInStep1 = Object.keys(errors).some(key => step1Fields.includes(key as keyof SystemFormValues));
    if (hasErrorInStep1 && step !== 1) {
        setStep(1);
    }
  };

  const handleNext = async () => {
    const fieldsToValidate: (keyof SystemFormValues)[] = ['system_name', 'system_type_id', 'node_id'];
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      if (needsStep2) {
        setStep(2);
      } else {
        handleSubmit(onValidSubmit, onInvalidSubmit)();
      }
    } else {
      toast.error("Please fill in all required fields to continue.");
    }
  };

  const renderFooter = () => (
    <div className="flex justify-end gap-2">
      {step > 1 && (
        <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={isSubmitting || upsertSystemMutation.isPending}>
          Back
        </Button>
      )}
      <Button type="button" variant="secondary" onClick={handleClose} disabled={isSubmitting || upsertSystemMutation.isPending}>
        Cancel
      </Button>
      {step === 1 ? (
        <Button type="button" onClick={handleNext} disabled={isSubmitting}>
          {needsStep2 ? 'Next' : (isEditMode ? 'Update System' : 'Create System')}
        </Button>
      ) : (
        <Button type="submit" disabled={isSubmitting || upsertSystemMutation.isPending}>
          {isEditMode ? 'Update System' : 'Create System'}
        </Button>
      )}
    </div>
  );

  const step1Fields = (
    <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput name="system_name" label="System Name" register={register} error={errors.system_name} required />
        <FormSearchableSelect name="system_type_id" label="System Type" control={control} options={systemTypeOptions} error={errors.system_type_id} required />
        <FormSearchableSelect name="node_id" label="Node / Location" control={control} options={nodeOptions} error={errors.node_id} required />
        <FormSearchableSelect name="maintenance_terminal_id" label="Maintenance Terminal" control={control} options={maintenanceTerminalOptions} error={errors.maintenance_terminal_id} />
        <FormIPAddressInput name="ip_address" label="IP Address" control={control} error={errors.ip_address} />
        <FormDateInput name="commissioned_on" label="Commissioned On" control={control} error={errors.commissioned_on} />
      </div>
    </motion.div>
  );

  const step2Fields = (
    <motion.div key="step2" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.3 }}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {isRingBasedSystem && (
            <FormSearchableSelect name="ring_id" label="Ring" control={control} options={ringOptions} error={errors.ring_id} />
        )}
        {isSdhSystem && (
            <>
                <FormInput name="gne" label="GNE" register={register} error={errors.gne} />
                <FormInput name="make" label="Make" register={register} error={errors.make} />
            </>
        )}
        {isVmuxSystem && (
            <FormInput name="vm_id" label="VM ID" register={register} error={errors.vm_id} />
        )}
        <div className="md:col-span-2">
            <FormInput name="s_no" label="Serial Number" register={register} error={errors.s_no} />
        </div>
        <div className="md:col-span-2">
            <FormTextarea name="remark" label="Remark" control={control} error={errors.remark} />
        </div>
        <div className="md:col-span-2">
            <FormSwitch name="status" label="Status" control={control} className="my-4" />
        </div>
      </div>
    </motion.div>
  );

  const modalTitle = isEditMode
    ? 'Edit System'
    : `Add System ${needsStep2 ? `(Step ${step} of 2)` : ''}`;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={modalTitle} size="xl" visible={false} className="h-screen w-screen transparent bg-gray-700 rounded-2xl">
      <FormCard
        onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
        onCancel={handleClose}
        isLoading={upsertSystemMutation.isPending || isSubmitting}
        standalone
        title={modalTitle}
        footerContent={renderFooter()}
      >
        <AnimatePresence mode="wait">
          {step === 1 ? step1Fields : step2Fields}
        </AnimatePresence>
      </FormCard>
    </Modal>
  );
};