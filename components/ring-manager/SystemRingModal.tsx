"use client";

import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useTableQuery } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { useForm, SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Modal } from "@/components/common/ui";
import {
  FormCard,
  FormDateInput,
  FormInput,
  FormIPAddressInput,
  FormSearchableSelect,
  FormSwitch,
  FormTextarea,
} from "@/components/common/form";
import { V_systems_completeRowSchema } from "@/schemas/zod-schemas";
import { systemFormValidationSchema, SystemFormData } from "@/schemas/system-schemas";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";

type SystemFormValues = SystemFormData;

const createDefaultFormValues = (): SystemFormValues => ({
  system_name: "",
  system_type_id: "",
  node_id: "",
  maan_node_id: null,
  maintenance_terminal_id: null,
  ip_address: "",
  commissioned_on: null,
  remark: "",
  s_no: "",
  status: true,
  ring_id: null,
  order_in_ring: 0,
  make: "",
  is_hub: false,
});

interface SystemRingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: SystemFormData[]) => Promise<void>; // Changed to accept array
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
  const [systemsToAdd, setSystemsToAdd] = useState<SystemFormData[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const { data: ringsResult = { data: [] } } = useTableQuery(supabase, "rings", {
    columns: "id, name",
  });
  const rings = ringsResult.data;
  
  const { data: systemsResult = { data: [] } } = useTableQuery(supabase, "systems", {
    columns: "id, system_name, system_type_id, node_id, ip_address, s_no, make",
    // filter to get only ring based systems
    filters: { is_ring_based: true },
  });
  const systemsOptions = useMemo(() => {
    // Get IDs of systems already queued
    const queuedSystemIds = systemsToAdd.map(s => s.system_name);
    
    // Filter out already queued systems
    return systemsResult.data
      .filter(s => !queuedSystemIds.includes(s.id))
      .map((s) => ({ value: s.id, label: s.system_name || s.id }));
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
  } = useForm<SystemFormValues>({
    resolver: zodResolver(systemFormValidationSchema),
    defaultValues: createDefaultFormValues(),
    mode: "onChange",
    shouldUnregister: false,
  });
  
  // Watch for system selection changes to auto-populate related fields
  const selectedSystemId = watch("system_name");
  
  useEffect(() => {
    if (selectedSystemId && systemsResult.data.length > 0) {
      const selectedSystem = systemsResult.data.find(s => s.id === selectedSystemId);
      if (selectedSystem) {
        // Auto-populate fields from the selected system
        setValue("system_type_id", selectedSystem.system_type_id || "");
        setValue("node_id", selectedSystem.node_id || "");
        setValue("ip_address", selectedSystem.ip_address || "");
        setValue("s_no", selectedSystem.s_no || "");
        setValue("make", selectedSystem.make || "");
        setValue("system_name", selectedSystem.system_name || selectedSystem.id);
      }
    }
  }, [selectedSystemId, systemsResult.data, setValue]);
  
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

  const onAddSystem = useCallback(
    (formData: SystemFormValues) => {
      console.log("Adding system to queue:", formData);
      
      // Validate that required fields are filled
      if (!formData.ring_id) {
        toast.error("Please select a ring.");
        setStep(1);
        return;
      }
      
      if (!formData.system_name) {
        toast.error("Please select a system.");
        return;
      }
      
      // Create a complete data object with all fields
      const systemData: SystemFormData = {
        system_name: formData.system_name,
        system_type_id: formData.system_type_id,
        node_id: formData.node_id,
        maan_node_id: formData.maan_node_id,
        maintenance_terminal_id: formData.maintenance_terminal_id,
        ip_address: formData.ip_address,
        commissioned_on: formData.commissioned_on,
        remark: formData.remark,
        s_no: formData.s_no,
        status: formData.status,
        ring_id: formData.ring_id,
        order_in_ring: formData.order_in_ring,
        make: formData.make,
        is_hub: formData.is_hub,
      };
      
      // Add system to the array
      setSystemsToAdd(prev => [...prev, systemData]);
      
      // Show success message
      toast.success(`System queued! (${systemsToAdd.length + 1} total)`);
      
      // Auto-reset for adding another system - keep ring_id, increment order
      const currentRingId = formData.ring_id ?? null;
      const nextOrder = formData.order_in_ring ?? 0;
      reset({
        ...createDefaultFormValues(),
        ring_id: currentRingId,
        order_in_ring: nextOrder,
      });
      setSelectedRingId(currentRingId);
      // Stay on step 2 to add more systems
      setStep(2);
    },
    [reset, systemsToAdd.length]
  );

  const handleSaveAll = async () => {
    if (systemsToAdd.length === 0) {
      toast.error("No systems to save. Please add at least one system.");
      return;
    }

    setIsSaving(true);
    try {
      console.log("Saving all systems:", systemsToAdd);
      await onSubmit(systemsToAdd);
      toast.success(`Successfully saved ${systemsToAdd.length} system(s)!`);
      handleClose();
    } catch (error) {
      console.error("Error saving systems:", error);
      toast.error("Failed to save systems. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const onInvalidSubmit: SubmitErrorHandler<SystemFormValues> = (errors) => {
    console.log("Validation errors:", errors);
    console.log("Form values:", watch());
    
    // Create a readable error message
    const errorFields = Object.keys(errors).join(", ");
    toast.error(`Validation failed. Missing or invalid fields: ${errorFields}`);
    
    // Check if ring_id has an error (step 1)
    if (errors.ring_id && step !== 1) {
      setStep(1);
      toast.error("Please select a ring first.");
    }
  };

  const handleNext = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    
    // Validate step 1 (ring selection)
    const ringId = watch("ring_id");
    
    if (!ringId) {
      toast.error("Please select a ring to continue.");
      return;
    }
    
    const isValid = await trigger(["ring_id"]);
    
    if (isValid) {
      setSelectedRingId(ringId ?? null);
      setStep(2);
    } else {
      toast.error("Please select a ring to continue.");
    }
  };

  const handleRemoveSystem = (index: number) => {
    setSystemsToAdd(prev => prev.filter((_, i) => i !== index));
    toast.info("System removed from queue.");
  };

  const renderFooter = () => {
    if (step === 1) {
      return (
        <div className='flex justify-between items-center'>
          <div className='text-sm text-gray-500'>
            {systemsToAdd.length > 0 && `${systemsToAdd.length} system(s) queued`}
          </div>
          <div className='flex gap-2'>
            <Button type='button' variant='secondary' onClick={handleClose} disabled={isLoading || isSaving}>
              Cancel
            </Button>
            <Button type='button' onClick={handleNext} disabled={isLoading || isSaving}>
              Next
            </Button>
          </div>
        </div>
      );
    }
    
    if (step === 2) {
      return (
        <div className='flex justify-between items-center'>
          <div className='text-sm text-gray-500'>
            {systemsToAdd.length > 0 && `${systemsToAdd.length} system(s) queued`}
          </div>
          <div className='flex gap-2'>
            <Button type='button' variant='outline' onClick={() => setStep(1)} disabled={isLoading || isSaving}>
              Back
            </Button>
            <Button 
              type='button' 
              variant='secondary' 
              onClick={handleSaveAll} 
              disabled={isLoading || isSaving || systemsToAdd.length === 0}
            >
              {isSaving ? 'Saving...' : `Save All (${systemsToAdd.length})`}
            </Button>
            <Button type='submit' disabled={isLoading || isSaving}>
              Add More
            </Button>
          </div>
        </div>
      );
    }
  };

  const step1Fields = (
    <motion.div
      key='step1'
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}>
      <div className='space-y-4'>
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4'>
          <p className='text-sm text-blue-800'>
            <strong>Step 1:</strong> Select a ring. You'll be able to add multiple systems to this ring one by one.
          </p>
        </div>
        <FormSearchableSelect
          name='ring_id'
          label='Ring *'
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
      key='step2'
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}>
      <div className='space-y-4'>
        {systemsToAdd.length > 0 && (
          <div className='bg-green-50 border border-green-200 rounded-lg p-4'>
            <div className='flex justify-between items-center mb-2'>
              <p className='text-sm text-green-800 font-medium'>
                ✓ {systemsToAdd.length} system(s) queued for saving
              </p>
            </div>
            <div className='space-y-2 mt-3'>
              {systemsToAdd.map((sys, idx) => (
                <div key={idx} className='flex justify-between items-center bg-white p-2 rounded border border-green-300'>
                  <div className='flex-1'>
                    <span className='text-sm text-gray-700 font-medium'>
                      {idx + 1}. {systemsOptions.find(o => o.value === sys.system_name)?.label || sys.system_name}
                    </span>
                    <div className='text-xs text-gray-500 mt-1'>
                      Order: {sys.order_in_ring} | 
                      Status: {sys.status ? 'Active' : 'Inactive'} | 
                      Hub: {sys.is_hub ? 'Yes' : 'No'}
                    </div>
                  </div>
                  <button
                    type='button'
                    onClick={() => handleRemoveSystem(idx)}
                    className='text-red-600 hover:text-red-800 text-sm ml-2'
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className='bg-blue-50 border border-blue-200 rounded-lg p-4'>
          <p className='text-sm text-blue-800'>
            <strong>Adding system to:</strong> {ringOptions.find(r => r.value === selectedRingId)?.label || 'Selected Ring'}
          </p>
        </div>

        <FormSearchableSelect
          name='system_name'
          label='System *'
          control={control}
          options={systemsOptions}
          error={errors.system_name}
          placeholder="Select a system..."
        />
        
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormInput
            name='order_in_ring'
            label='Order in Ring'
            type='number'
            step='0.01'
            register={register}
            error={errors.order_in_ring}
            placeholder='e.g., 1, 2, 3 or 0.1, 0.2, 0.3...'
          />
          
          <div className='flex items-center gap-4'>
            <FormSwitch 
              name='status' 
              label='Active' 
              control={control} 
            />
            <FormSwitch 
              name='is_hub' 
              label='Hub System' 
              control={control} 
            />
          </div>
        </div>
      </div>
    </motion.div>
  );

  const modalTitle = `Add Systems to Ring ${step === 2 && systemsToAdd.length > 0 ? `(${systemsToAdd.length} queued)` : `(Step ${step} of 2)`}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      visible={false}
      className='h-0 w-0 bg-transparent'>
      <FormCard
        standalone
        onSubmit={handleSubmit(onAddSystem, onInvalidSubmit)}
        onCancel={handleClose}
        isLoading={isLoading || isSaving}
        title={modalTitle}
        footerContent={renderFooter()}>
        <AnimatePresence mode='wait'>
          {step === 1 ? step1Fields : step2Fields}
        </AnimatePresence>
      </FormCard>
    </Modal>
  );
};