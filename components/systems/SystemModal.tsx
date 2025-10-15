// path: components/systems/SystemModal.tsx

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
  maintenance_terminal_id: null,
  ip_address: "",
  commissioned_on: null,
  remark: "",
  s_no: "",
  status: true,
  ring_id: null,
  order_in_ring: 0,
  gne: null,
  make: "",
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
    columns: "id, name, is_ring_based, is_sdh, code",
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
  const { data: ringsResult = { data: [] } } = useTableQuery(supabase, "rings", {
    columns: "id, name",
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
    resolver: zodResolver(systemFormValidationSchema),
    defaultValues: createDefaultFormValues(),
    mode: "onChange",
  });

  const selectedSystemTypeId = watch("system_type_id");
  const selectedNodeId = watch("node_id");
  const selectedSystemType = useMemo(
    () => systemTypes.find((st) => st.id === selectedSystemTypeId),
    [systemTypes, selectedSystemTypeId]
  );
  const isRingBasedSystem = useMemo(() => selectedSystemType?.is_ring_based, [selectedSystemType]);
  const isSdhSystem = useMemo(() => selectedSystemType?.is_sdh, [selectedSystemType]);
  const needsStep2 = isRingBasedSystem || isSdhSystem;

  const handleClose = useCallback(() => {
    onClose();
    setTimeout(() => {
      reset(createDefaultFormValues());
      setStep(1);
    }, 200);
  }, [onClose, reset]);

  // THE FIX: The dependency array is now corrected to only react to props changes,
  // not internal form state changes.
  useEffect(() => {
    if (isOpen) {
      if (isEditMode && rowData) {
        reset({
          system_name: rowData.system_name || "",
          system_type_id: rowData.system_type_id || "",
          node_id: rowData.node_id || "",
          maintenance_terminal_id: rowData.maintenance_terminal_id,
          ip_address: (rowData.ip_address as string) || "",
          commissioned_on: rowData.commissioned_on || null,
          remark: rowData.remark || "",
          s_no: rowData.s_no || "",
          status: rowData.status ?? true,
          ring_id: rowData.ring_id ?? null,
          order_in_ring: rowData.order_in_ring ?? 0,
          gne: rowData.sdh_gne ?? null,
          make: rowData.make ?? "",
        });
      } else {
        reset(createDefaultFormValues());
      }
      // Always reset to step 1 when the modal opens.
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

  const onValidSubmit = useCallback(
    (formData: SystemFormValues) => {
      onSubmit(formData);
    },
    [onSubmit]
  );

  const onInvalidSubmit: SubmitErrorHandler<SystemFormValues> = (errors) => {
    toast.error("Validation failed. Please check required fields on all steps.");
    const step1Fields: (keyof SystemFormValues)[] = ["system_name", "system_type_id", "node_id"];
    const hasErrorInStep1 = Object.keys(errors).some((key) =>
      step1Fields.includes(key as keyof SystemFormValues)
    );
    if (hasErrorInStep1 && step !== 1) {
      setStep(1);
    }
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
      {" "}
      <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
        {" "}
        {isRingBasedSystem && (
          <>
          <FormSearchableSelect
            name='ring_id'
            label='Ring'
            control={control}
            options={ringOptions}
            error={errors.ring_id}
          />
          <FormInput
              name="order_in_ring"
              label="Order in Ring"
              type="number"
              register={register}
              error={errors.order_in_ring}
              placeholder="e.g., 1, 2, 3..."
            />
            </>
        )}{" "}
        {isSdhSystem && (
          <>
            {" "}
            <FormInput name='gne' label='GNE' register={register} error={errors.gne} />{" "}
            <FormInput name='make' label='Make' register={register} error={errors.make} />{" "}
          </>
        )}{" "}
        <div className='md:col-span-2'>
          {" "}
          <FormInput
            name='s_no'
            label='Serial Number'
            register={register}
            error={errors.s_no}
          />{" "}
        </div>{" "}
        <div className='md:col-span-2'>
          {" "}
          <FormTextarea name='remark' label='Remark' control={control} error={errors.remark} />{" "}
        </div>{" "}
        <div className='md:col-span-2'>
          {" "}
          <FormSwitch name='status' label='Status' control={control} className='my-4' />{" "}
        </div>{" "}
      </div>{" "}
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