// path: components/ring-manager/SystemRingModal.tsx
'use client';

import { FC, useCallback, useEffect, useMemo, useState } from 'react';
import type React from 'react';
import { useTableQuery } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { useForm, SubmitErrorHandler, type SubmitHandler, type Resolver } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button, Modal } from '@/components/common/ui';
import { FormCard, FormInput, FormSearchableSelect, FormSwitch } from '@/components/common/form';
import { z } from 'zod';
import { toast } from 'sonner';
import { AnimatePresence, motion } from 'framer-motion';
import { SystemFormData, systemFormValidationSchema } from '@/schemas/system-schemas';

// Local schema override: ensure fields accept empty string inputs from UI
const systemRingFormSchema = systemFormValidationSchema.extend({
  ring_id: z
    .union([z.uuid(), z.literal('')])
    .optional()
    .nullable(),
  selected_system_id: z
    .union([z.uuid(), z.literal('')])
    .optional()
    .nullable(),
});
type SystemRingFormValues = z.infer<typeof systemRingFormSchema>;

const createDefaultFormValues = (): SystemRingFormValues => ({
  system_name: null,
  system_type_id: '',
  node_id: '',
  maan_node_id: null,
  maintenance_terminal_id: null,
  ip_address: null,
  commissioned_on: null,
  remark: null,
  s_no: null,
  status: true,
  ring_id: '',
  order_in_ring: 0,
  make: null,
  is_hub: false,
  selected_system_id: null,
  system_capacity_id: null,
});

interface SystemRingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: (SystemFormData & { id?: string | null })[]) => Promise<void>;
  isLoading: boolean;
}

export const SystemRingModal: FC<SystemRingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}) => {
  const supabase = createClient();
  const [step, setStep] = useState(1);
  const [selectedRingId, setSelectedRingId] = useState<string | null>(null);
  const [systemsToAdd, setSystemsToAdd] = useState<(SystemFormData & { id?: string | null })[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: ringsResult = { data: [] } } = useTableQuery(supabase, 'rings', {
    columns: 'id, name',
  });
  const rings = ringsResult.data;

  const { data: systemsResult = { data: [] } } = useTableQuery(supabase, 'systems', {
    columns: 'id, system_name, system_type_id, node_id, ip_address, s_no, make',
  });

  const systemsOptions = useMemo(() => {
    const queuedSystemIds = new Set(systemsToAdd.map((s) => s.id));
    return systemsResult.data
      .filter((s) => !queuedSystemIds.has(s.id))
      .map((s) => {
        const labels: string[] = [];

        if (s.system_name && s.make && s.ip_address) {
          labels.push(`${s.system_name} (${s.make}) (${s.ip_address})`);
        } else if (s.system_name && s.ip_address) {
          labels.push(`${s.system_name} (${s.ip_address})`);
        } else if (s.system_name) {
          labels.push(s.system_name);
        } else if (s.make) {
          labels.push(s.make);
        } else if (s.ip_address) {
          labels.push(`(${s.ip_address})`);
        }

        return { value: s.id, label: labels.join(' - ') || s.id };
      });
  }, [systemsResult, systemsToAdd]);

  const ringOptions = useMemo(() => rings.map((r) => ({ value: r.id, label: r.name })), [rings]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
    watch,
    setValue,
    trigger,
  } = useForm<SystemRingFormValues>({
    resolver: zodResolver(systemRingFormSchema) as Resolver<SystemRingFormValues>,
    defaultValues: createDefaultFormValues(),
    mode: 'onChange',
    shouldUnregister: false,
  });

  const selectedSystemIdForm = watch('selected_system_id');

  useEffect(() => {
    if (selectedSystemIdForm && systemsResult.data.length > 0) {
      const selectedSystem = systemsResult.data.find((s) => s.id === selectedSystemIdForm);
      if (selectedSystem) {
        setValue('system_name', selectedSystem.system_name || selectedSystem.id);
        setValue('system_type_id', selectedSystem.system_type_id || '');
        setValue('node_id', selectedSystem.node_id || '');
        setValue(
          'ip_address',
          typeof selectedSystem.ip_address === 'string'
            ? selectedSystem.ip_address.split('/')[0]
            : ''
        );
        setValue('s_no', selectedSystem.s_no || '');
        setValue('make', selectedSystem.make || '');
      }
    }
  }, [selectedSystemIdForm, systemsResult.data, setValue]);

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      reset(createDefaultFormValues());
      setStep(1);
      setSelectedRingId(null);
      setSystemsToAdd([]);
      setIsSaving(false);
    }, 200);
  }, [onClose, reset]);

  const onAddSystem: SubmitHandler<SystemRingFormValues> = useCallback(
    (formData) => {
      if (!formData.ring_id) {
        toast.error('Please select a ring.');
        setStep(1);
        return;
      }
      if (!formData.selected_system_id) {
        toast.error('Please select a system.');
        return;
      }

      const systemData = {
        id: formData.selected_system_id,
        system_name: formData.system_name,
        system_type_id: formData.system_type_id,
        node_id: formData.node_id,
        ip_address: formData.ip_address.split('/')[0],
        s_no: formData.s_no,
        make: formData.make,
        status: formData.status,
        is_hub: formData.is_hub,
        ring_id: formData.ring_id || null,
        order_in_ring: formData.order_in_ring,
        // Carry over other potential fields
        commissioned_on: formData.commissioned_on,
        remark: formData.remark,
        maintenance_terminal_id: formData.maintenance_terminal_id,
        maan_node_id: formData.maan_node_id,
        system_capacity_id: formData.system_capacity_id,
      };

      setSystemsToAdd((prev) => [...prev, systemData]);
      toast.success(`System queued! (${systemsToAdd.length + 1} total)`);

      const currentRingId = formData.ring_id || '';
      const nextOrder = (formData.order_in_ring ?? 0) + 1;
      reset({
        ...createDefaultFormValues(),
        ring_id: currentRingId,
        order_in_ring: nextOrder,
        selected_system_id: null,
      });
      setSelectedRingId(formData.ring_id || null);
      setStep(2);
    },
    [reset, systemsToAdd.length]
  );

  const handleSaveAll = async () => {
    if (systemsToAdd.length === 0) {
      toast.error('No systems to save. Please add at least one system.');
      return;
    }
    setIsSaving(true);
    try {
      await onSubmit(systemsToAdd);
      toast.success(`Successfully saved ${systemsToAdd.length} system(s)!`);
      handleClose();
    } catch (error) {
      toast.error('Failed to save systems. Please try again.');
      console.log(error);
    } finally {
      setIsSaving(false);
    }
  };

  const onInvalidSubmit: SubmitErrorHandler<SystemRingFormValues> = (errors) => {
    const errorFields = Object.keys(errors).join(', ');
    toast.error(`Validation failed. Missing or invalid fields: ${errorFields}`);
    if (errors.ring_id && step !== 1) {
      setStep(1);
    }
  };

  const handleNext = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    const ringId = watch('ring_id');
    if (!ringId) {
      toast.error('Please select a ring to continue.');
      return;
    }
    const isValid = await trigger(['ring_id']);
    if (isValid) {
      setSelectedRingId(ringId);
      setStep(2);
    }
  };

  const handleRemoveSystem = (index: number) => {
    setSystemsToAdd((prev) => prev.filter((_, i) => i !== index));
    toast.info('System removed from queue.');
  };

  const renderFooter = () => {
    if (step === 1) {
      return (
        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {systemsToAdd.length > 0 && `${systemsToAdd.length} system(s) queued`}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading || isSaving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleNext} disabled={isLoading || isSaving}>
              Next
            </Button>
          </div>
        </div>
      );
    }
    return (
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500">
          {systemsToAdd.length > 0 && `${systemsToAdd.length} system(s) queued`}
        </div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setStep(1)}
            disabled={isLoading || isSaving}
          >
            Back
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={handleSaveAll}
            disabled={isLoading || isSaving || systemsToAdd.length === 0}
          >
            {isSaving ? 'Saving...' : `Save All (${systemsToAdd.length})`}
          </Button>
          <Button type="submit" disabled={isLoading || isSaving}>
            Add More
          </Button>
        </div>
      </div>
    );
  };

  const step1Fields = (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-blue-800">
            <strong>Step 1:</strong> Select a ring to add systems to.
          </p>
        </div>
        <FormSearchableSelect
          name="ring_id"
          label="Ring *"
          control={control}
          options={ringOptions}
          error={errors.ring_id}
          placeholder="Select a ring..."
        />
      </div>
    </motion.div>
  );

  const step2Fields = (
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="space-y-4">
        {systemsToAdd.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800 font-medium mb-2">
              ✓ {systemsToAdd.length} system(s) queued for saving
            </p>
            <div className="space-y-2">
              {systemsToAdd.map((sys, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center bg-white p-2 rounded border border-green-300"
                >
                  <span className="text-sm text-gray-700 font-medium">
                    {idx + 1}. {sys.system_name} (Order: {sys.order_in_ring})
                  </span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSystem(idx)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            <strong>Adding system to:</strong>{' '}
            {ringOptions.find((r) => r.value === selectedRingId)?.label || 'Selected Ring'}
          </p>
        </div>
        <FormSearchableSelect
          name="selected_system_id"
          label="System *"
          control={control}
          options={systemsOptions}
          error={errors.selected_system_id}
          placeholder="Select a system..."
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormInput
            name="order_in_ring"
            label="Order in Ring"
            type="number"
            step="0.1"
            register={register}
            error={errors.order_in_ring}
            placeholder="e.g., 1, 2, 2.1, 3..."
          />
          <div className="flex items-center gap-4 pt-6">
            <FormSwitch name="status" label="Active" control={control} />
            <FormSwitch name="is_hub" label="Hub System" control={control} />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const modalTitle = `Add Systems to Ring ${
    step === 2 && systemsToAdd.length > 0
      ? `(${systemsToAdd.length} queued)`
      : `(Step ${step} of 2)`
  }`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      visible={false}
      className="h-0 w-0 bg-transparent"
    >
      <FormCard
        standalone
        onSubmit={handleSubmit(onAddSystem, onInvalidSubmit)}
        onCancel={handleClose}
        isLoading={isLoading || isSaving}
        title={modalTitle}
        footerContent={renderFooter()}
      >
        <AnimatePresence mode="wait">{step === 1 ? step1Fields : step2Fields}</AnimatePresence>
      </FormCard>
    </Modal>
  );
};
