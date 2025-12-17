// components/systems/SystemModal.tsx

"use client";

import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { useTableQuery } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { useForm, SubmitErrorHandler, type SubmitHandler, type Resolver } from "react-hook-form";
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
import { z } from "zod";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Stepper } from "@/components/common/ui/Stepper";

// Extended schema to handle optional ring/capacity fields
const systemModalFormSchema = systemFormValidationSchema.extend({
  ring_id: z.union([z.uuid(), z.literal('')]).optional().nullable(),
  system_capacity_id: z.union([z.uuid(), z.literal('')]).optional().nullable(),
});
type SystemFormValues = z.infer<typeof systemModalFormSchema>;

const createDefaultFormValues = (): SystemFormValues => ({
  system_name: "",
  system_type_id: "",
  system_capacity_id: "",
  node_id: "",
  maan_node_id: null,
  maintenance_terminal_id: null,
  ip_address: "",
  commissioned_on: null,
  remark: "",
  s_no: "",
  status: true,
  ring_id: "",
  order_in_ring: 0,
  make: "",
  is_hub: false,
});

interface SystemModalProps {
  isOpen: boolean;
  onClose: () => void;
  rowData: V_systems_completeRowSchema | null;
  onSubmit: (data: SystemFormData) => void;
  isLoading: boolean;
}

export const SystemModal: FC<SystemModalProps> = ({
  isOpen,
  onClose,
  rowData,
  onSubmit,
  isLoading,
}) => {
  const supabase = createClient();
  const isEditMode = !!rowData;
  const [step, setStep] = useState(1);

  // --- Data Fetching ---
  const { data: systemTypesResult = { data: [] } } = useTableQuery(supabase, "lookup_types", {
    columns: "id, name, is_ring_based, code",
    filters: { category: "SYSTEM_TYPES" },
    orderBy: [{ column: "code", ascending: true }],
  });
  
  const { data: capacitiesResult = { data: [] } } = useTableQuery(supabase, "lookup_types", {
    columns: "id, name",
    filters: { category: "SYSTEM_CAPACITY" },
    orderBy: [{ column: "sort_order", ascending: true }],
  });
  
  const { data: nodesResult = { data: [] } } = useTableQuery(supabase, "nodes", {
    columns: "id, name, maintenance_terminal_id",
  });
  
  const { data: maintenanceTerminalsResult = { data: [] } } = useTableQuery(supabase, "maintenance_areas", {
    columns: "id, name",
    filters: { status: true }
  });
  
  const { data: ringsResult = { data: [] } } = useTableQuery(supabase, "rings", {
    columns: "id, name",
    filters: { status: true },
  });

  // --- Options ---
  const systemTypes = systemTypesResult.data;
  const nodes = nodesResult.data;

  const systemTypeOptions = useMemo(() =>
      systemTypes
        .filter((st) => st.name !== "DEFAULT")
        .map((st) => ({ value: st.id, label: st.code ?? st.name ?? "" })),
    [systemTypes]
  );
  const capacityOptions = useMemo(() =>
    capacitiesResult.data.filter(c => c.name !== "DEFAULT").map(c => ({ value: c.id, label: c.name })),
    [capacitiesResult.data]
  );
  const nodeOptions = useMemo(() => 
    nodes.map((n) => ({ value: n.id, label: n.name })), 
    [nodes]
  );
  const maintenanceTerminalOptions = useMemo(() =>
    maintenanceTerminalsResult.data.map((mt) => ({ value: mt.id, label: mt.name })),
    [maintenanceTerminalsResult.data]
  );
  const ringOptions = useMemo(() => 
    ringsResult.data.map((r) => ({ value: r.id, label: r.name })), 
    [ringsResult.data]
  );

  // --- Form Setup ---
  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    reset,
    control,
    watch,
    setValue,
    trigger,
  } = useForm<SystemFormValues>({
    resolver: zodResolver(systemModalFormSchema) as Resolver<SystemFormValues>,
    defaultValues: createDefaultFormValues(),
    mode: "onChange",
  });

  // --- Watchers & Computed State ---
  const selectedSystemTypeId = watch("system_type_id");
  const selectedNodeId = watch("node_id");
  
  const selectedSystemType = useMemo(
    () => systemTypes.find((st) => st.id === selectedSystemTypeId),
    [systemTypes, selectedSystemTypeId]
  );
  
  const isRingBasedSystem = useMemo(() => selectedSystemType?.is_ring_based === true, [selectedSystemType]);
  const isSdhSystem = useMemo(() => {
    const name = selectedSystemType?.name?.toLowerCase() || "";
    return name.includes("synchronous") || name.includes("sdh");
  }, [selectedSystemType]);

  const needsStep2 = isRingBasedSystem || isSdhSystem;

  // --- Effects ---

  // 1. Reset form when Modal Opens or Row Data Changes
  // We rely on the `key` prop in the render to handle full remounts, 
  // but this ensures data consistency if props update while open.
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && rowData) {
        reset({
          system_name: rowData.system_name || "",
          system_type_id: rowData.system_type_id || "",
          system_capacity_id: rowData.system_capacity_id || "",
          node_id: rowData.node_id || "",
          maan_node_id: rowData.maan_node_id || null,
          maintenance_terminal_id: rowData.maintenance_terminal_id,
          ip_address: rowData.ip_address ? rowData.ip_address.split('/')[0] : "",
          commissioned_on: rowData.commissioned_on || null,
          remark: rowData.remark || "",
          s_no: rowData.s_no || "",
          status: rowData.status ?? true,
          ring_id: rowData.ring_id ?? "",
          order_in_ring: rowData.order_in_ring ?? 0,
          make: rowData.make ?? "",
          is_hub: rowData.is_hub ?? false,
        });
      } else {
        reset(createDefaultFormValues());
      }
      setStep(1);
    }
  }, [isOpen, isEditMode, rowData, reset]);

  // 2. Auto-fill Maintenance Terminal based on Node Selection
  useEffect(() => {
    if (selectedNodeId) {
      const matchedNode = nodes.find((node) => node.id === selectedNodeId);
      if (matchedNode?.maintenance_terminal_id) {
        setValue("maintenance_terminal_id", matchedNode.maintenance_terminal_id);
      }
    }
  }, [selectedNodeId, nodes, setValue]);

  // --- Handlers ---

  const handleClose = useCallback(() => {
    if (isDirty) {
      if (!window.confirm("You have unsaved changes. Close anyway?")) return;
    }
    onClose();
  }, [onClose, isDirty]);

  const onValidSubmit: SubmitHandler<SystemFormValues> = useCallback(
    (formData) => {
      const payload = formData as unknown as SystemFormData;
      onSubmit(payload);
    },
    [onSubmit]
  );

  const onInvalidSubmit: SubmitErrorHandler<SystemFormValues> = (errors) => {
    const errorFields = Object.keys(errors);
    toast.error(`Validation failed. Check fields: ${errorFields.join(', ')}`);
    
    // If error is on step 1 fields, go back to step 1
    const step1Fields: (keyof SystemFormValues)[] = ["system_name", "system_type_id", "node_id"];
    const hasErrorInStep1 = errorFields.some((key) => step1Fields.includes(key as keyof SystemFormValues));
    
    if (hasErrorInStep1 && step !== 1) {
      setStep(1);
    }
  };

  const handleNext = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    const isValid = await trigger(["system_name", "system_type_id", "node_id"]);
    if (isValid) {
      if (needsStep2) setStep(2);
      else handleSubmit(onValidSubmit, onInvalidSubmit)();
    } else {
      toast.error("Please fill in all required fields.");
    }
  };

  // --- Render Helpers ---

  const renderFooter = () => (
    <div className='flex justify-end gap-2 w-full'>
      {step === 2 ? (
        <Button type='button' variant='outline' onClick={() => setStep(1)} disabled={isLoading}>Back</Button>
      ) : (
        <Button type='button' variant='secondary' onClick={handleClose} disabled={isLoading}>Cancel</Button>
      )}
      
      {step === 1 && needsStep2 ? (
        <Button type='button' onClick={handleNext} disabled={isLoading}>Next</Button>
      ) : (
        <Button type='submit' disabled={isLoading}>{isEditMode ? "Update" : "Create"}</Button>
      )}
    </div>
  );

  const modalTitle = isEditMode ? "Edit System" : "Add System";
  
  // Use a stable key to force remount on open/close or data change
  const formKey = isOpen ? (rowData ? `edit-${rowData.id}` : 'new') : 'closed';

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      className='h-0 w-0 bg-transparent'
      closeOnOverlayClick={false}
      closeOnEscape={!isDirty}
    >
      <FormCard
        key={formKey} // Force fresh instance
        standalone
        onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
        onCancel={handleClose}
        isLoading={isLoading}
        title={modalTitle}
        subtitle={needsStep2 ? `Step ${step} of 2` : "Basic Information"}
        widthClass="w-full"
        heightClass="h-full"
        footerContent={renderFooter()}
      >
        {needsStep2 && (
            <div className="mb-6 px-4">
                <Stepper
                    currentStep={step}
                    steps={[
                        { id: 1, label: 'Basic Info', description: 'Type & Location' },
                        { id: 2, label: 'Configuration', description: 'Topology & Details' }
                    ]}
                    onStepClick={async (s) => {
                        if (s < step) setStep(s);
                        else if (s > step) handleNext();
                    }}
                />
            </div>
        )}

        <AnimatePresence mode='wait'>
          {step === 1 ? (
            <motion.div
              key='step1'
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormInput name='system_name' label='System Name' register={register} error={errors.system_name} required />
                <FormSearchableSelect name='system_type_id' label='System Type' control={control} options={systemTypeOptions} error={errors.system_type_id} required />
                <FormSearchableSelect name='system_capacity_id' label='Capacity' control={control} options={capacityOptions} error={errors.system_capacity_id} placeholder="Select capacity" />
                <FormSearchableSelect name='node_id' label='Node / Location' control={control} options={nodeOptions} error={errors.node_id} required />
                
                {selectedSystemType?.code?.trim() === "MAAN" && (
                  <FormInput name='maan_node_id' label='MAAN Node ID' register={register} error={errors.maan_node_id} />
                )}
                
                <FormSearchableSelect name='maintenance_terminal_id' label='Maintenance Terminal' control={control} options={maintenanceTerminalOptions} error={errors.maintenance_terminal_id} />
                <FormIPAddressInput name='ip_address' label='IP Address' control={control} error={errors.ip_address} />
                <FormDateInput name='commissioned_on' label='Commissioned On' control={control} error={errors.commissioned_on} />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key='step2'
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                {isRingBasedSystem && (
                  <>
                     <FormSearchableSelect name="ring_id" label="Ring" control={control} options={ringOptions} error={errors.ring_id} placeholder="Select a ring (optional)" />
                     <FormInput name="order_in_ring" label="Order in Ring" type="number" step="0.1" register={register} error={errors.order_in_ring} placeholder="e.g. 1, 2, 2.1..." />
                     <FormSwitch name="is_hub" label="Is Hub System" control={control} description="Acts as a major aggregation point" />
                  </>
                )}
                {isSdhSystem && (
                  <FormInput name='make' label='Make' register={register} error={errors.make} />
                )}
                <div className='md:col-span-2'>
                  <FormInput name='s_no' label='Serial Number' register={register} error={errors.s_no} />
                </div>
                <div className='md:col-span-2'>
                  <FormTextarea name='remark' label='Remark' control={control} error={errors.remark} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </FormCard>
    </Modal>
  );
};