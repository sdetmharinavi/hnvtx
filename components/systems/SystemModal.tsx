// path: components/systems/SystemModal.tsx

"use client";

import { FC, useCallback, useEffect, useMemo, useState } from "react";
import type React from "react";
import { useTableQuery } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { useForm, SubmitErrorHandler, type Resolver, type SubmitHandler } from "react-hook-form";
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

// Local schema override: ensure ring_id accepts empty string from the UI component
const systemModalFormSchema = systemFormValidationSchema.extend({
  ring_id: z.union([z.string().uuid(), z.literal('')]).optional().nullable(),
});
type SystemFormValues = z.infer<typeof systemModalFormSchema>;

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

  const { data: systemTypesResult = { data: [] } } = useTableQuery(supabase, "lookup_types", {
    columns: "id, name, is_ring_based, code",
    filters: { category: "SYSTEM_TYPES" },
    orderBy: [{ column: "code", ascending: true }],
  });
  const systemTypes = systemTypesResult.data;
  const { data: nodesResult = { data: [] } } = useTableQuery(supabase, "nodes", {
    columns: "id, name, maintenance_terminal_id",
  });
  const nodes = nodesResult.data;
  const { data: maintenanceTerminalsResult = { data: [] } } = useTableQuery(
    supabase,
    "maintenance_areas",
    { columns: "id, name" }
  );
  const maintenanceTerminals = maintenanceTerminalsResult.data;
  
  // Fetch rings for the dropdown in step 2
  const { data: ringsResult = { data: [] } } = useTableQuery(supabase, "rings", {
    columns: "id, name",
    filters: { status: true },
  });
  const rings = ringsResult.data;

  const systemTypeOptions = useMemo(
    () =>
      systemTypes
        .filter((st) => st.name !== "DEFAULT")
        .map((st) => ({ value: st.id, label: st.code ?? st.name ?? "" })),
    [systemTypes]
  );
  const nodeOptions = useMemo(() => nodes.map((n) => ({ value: n.id, label: n.name })), [nodes]);
  const maintenanceTerminalOptions = useMemo(
    () => maintenanceTerminals.map((mt) => ({ value: mt.id, label: mt.name })),
    [maintenanceTerminals]
  );
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
    resolver: zodResolver(systemModalFormSchema) as Resolver<SystemFormValues>,
    defaultValues: createDefaultFormValues(),
    mode: "onChange",
  });

  const selectedSystemTypeId = watch("system_type_id");
  const selectedNodeId = watch("node_id");
  const selectedSystemType = useMemo(
    () => systemTypes.find((st) => st.id === selectedSystemTypeId),
    [systemTypes, selectedSystemTypeId]
  );
  const isRingBasedSystem = useMemo(
    () => selectedSystemType?.is_ring_based === true,
    [selectedSystemType]
  );
  const isSdhSystem = useMemo(() => {
    const name = selectedSystemType?.name?.toLowerCase() || "";
    return name.includes("synchronous") || name.includes("sdh");
  }, [selectedSystemType]);
  
  const needsStep2 = isRingBasedSystem || isSdhSystem;

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
          system_name: rowData.system_name || "",
          system_type_id: rowData.system_type_id || "",
          node_id: rowData.node_id || "",
          maan_node_id: rowData.maan_node_id || null,
          maintenance_terminal_id: rowData.maintenance_terminal_id,
          ip_address: (rowData.ip_address as string) || "",
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

  useEffect(() => {
    if (selectedNodeId) {
      const matchedNode = nodes.find((node) => node.id === selectedNodeId);
      if (matchedNode?.maintenance_terminal_id) {
        setValue("maintenance_terminal_id", matchedNode.maintenance_terminal_id);
      }
    }
  }, [selectedNodeId, nodes, setValue]);

  const onValidSubmit: SubmitHandler<SystemFormValues> = useCallback(
    (formData) => {
      // The zod transform handles empty string -> null conversion for us
      const payload = formData as unknown as SystemFormData;
      onSubmit(payload);
    },
    [onSubmit]
  );

  const onInvalidSubmit: SubmitErrorHandler<SystemFormValues> = (errors) => {
    // Build a readable error list
    const errorList = Object.entries(errors).map(([field, err]) => {
      return `${field}: ${(err)?.message ?? "Invalid value"}`;
    });

    // Show full error list in toast
    toast.error(
      <>
        <div className='font-semibold mb-1'>Validation Errors:</div>
        <ul className='list-disc pl-5 space-y-1'>
          {errorList.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      </>
    );

    // Step 1 fields
    const step1Fields: (keyof SystemFormValues)[] = [
      "system_name",
      "system_type_id",
      "node_id",
      "maintenance_terminal_id",
      "ip_address",
      "commissioned_on",
      "maan_node_id",
    ];

    // Step 2 fields
    const step2Fields: (keyof SystemFormValues)[] = [
      "make",
      "s_no",
      "remark",
      "order_in_ring",
      "ring_id",
      "is_hub",
    ];

    const errorKeys = Object.keys(errors) as (keyof SystemFormValues)[];

    // Check where errors are
    const hasStep1Error = errorKeys.some((f) => step1Fields.includes(f));
    const hasStep2Error = errorKeys.some((f) => step2Fields.includes(f));

    // Jump to correct step
    if (hasStep1Error) setStep(1);
    else if (hasStep2Error) setStep(2);
  };

  const handleNext = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    e?.stopPropagation();
    const fieldsToValidate: (keyof SystemFormValues)[] = [
      "system_name",
      "system_type_id",
      "node_id",
    ];
    const isValid = await trigger(fieldsToValidate);
    if (isValid) {
      if (needsStep2) setStep(2);
    } else {
      toast.error("Please fill in all required fields to continue.");
    }
  };

  const renderFooter = () => {
    if (step === 1 && needsStep2) {
      return (
        <div className='flex justify-end gap-2'>
          <Button type='button' variant='secondary' onClick={handleClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type='button' onClick={handleNext} disabled={isLoading}>
            Next
          </Button>
        </div>
      );
    }
    if (step === 2) {
      return (
        <div className='flex justify-end gap-2'>
          <Button type='button' variant='outline' onClick={() => setStep(1)} disabled={isLoading}>
            Back
          </Button>
          <Button type='submit' disabled={isLoading}>
            {isEditMode ? "Update System" : "Create System"}
          </Button>
        </div>
      );
    }
    return (
      <div className='flex justify-end gap-2'>
        <Button type='button' variant='secondary' onClick={handleClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button type='submit' disabled={isLoading}>
          {isEditMode ? "Update System" : "Create System"}
        </Button>
      </div>
    );
  };

  const step1Fields = (
    <motion.div
      key='step1'
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}>
      {" "}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {" "}
        <FormInput
          name='system_name'
          label='System Name'
          register={register}
          error={errors.system_name}
          required
        />{" "}
        <FormSearchableSelect
          name='system_type_id'
          label='System Type'
          control={control}
          options={systemTypeOptions}
          error={errors.system_type_id}
          required
        />{" "}
        <FormSearchableSelect
          name='node_id'
          label='Node / Location'
          control={control}
          options={nodeOptions}
          error={errors.node_id}
          required
        />{" "}
        {selectedSystemType?.code?.trim() === "MAAN" && (
          <FormInput
            name='maan_node_id'
            label='MAAN Node ID'
            register={register}
            error={errors.maan_node_id}
          />
        )}
        <FormSearchableSelect
          name='maintenance_terminal_id'
          label='Maintenance Terminal'
          control={control}
          options={maintenanceTerminalOptions}
          error={errors.maintenance_terminal_id}
        />{" "}
        <FormIPAddressInput
          name='ip_address'
          label='IP Address'
          control={control}
          error={errors.ip_address}
        />{" "}
        <FormDateInput
          name='commissioned_on'
          label='Commissioned On'
          control={control}
          error={errors.commissioned_on}
        />{" "}
      </div>{" "}
    </motion.div>
  );

  const step2Fields = (
    <motion.div
      key='step2'
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}>
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {isRingBasedSystem && (
          <>
             <FormSearchableSelect
               name="ring_id"
               label="Ring"
               control={control}
               options={ringOptions}
               error={errors.ring_id}
               placeholder="Select a ring (optional)"
             />
             <FormInput
               name="order_in_ring"
               label="Order in Ring"
               type="number"
               step="0.1"
               register={register}
               error={errors.order_in_ring}
               placeholder="e.g. 1, 2, 3"
             />
             <FormSwitch name="is_hub" label="Is Hub System" control={control} />
          </>
        )}
        {isSdhSystem && (
          <FormInput name='make' label='Make' register={register} error={errors.make} />
        )}
        <div className='md:col-span-2'>
          <FormInput
            name='s_no'
            label='Serial Number'
            register={register}
            error={errors.s_no}
          />
        </div>
        <div className='md:col-span-2'>
          <FormTextarea name='remark' label='Remark' control={control} error={errors.remark} />
        </div>
      </div>
    </motion.div>
  );
  
  const modalTitle = isEditMode
    ? "Edit System"
    : `Add System ${needsStep2 ? `(Step ${step} of 2)` : ""}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      size='xl'
      visible={false}
      className='h-0 w-0 bg-transparent'>
      <FormCard
        standalone
        onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
        onCancel={handleClose}
        isLoading={isLoading}
        title={modalTitle}
        footerContent={renderFooter()}>
        <AnimatePresence mode='wait'>{step === 1 ? step1Fields : step2Fields}</AnimatePresence>
      </FormCard>
    </Modal>
  );
};