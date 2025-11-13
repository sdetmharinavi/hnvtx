// path: components/systems/SystemConnectionFormModal.tsx
"use client";

import { FC, useCallback, useEffect, useMemo, useState } from "react";
import { SubmitErrorHandler, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  system_connectionsInsertSchema,
  ports_managementInsertSchema,
  sdh_connectionsInsertSchema,
  V_system_connections_completeRowSchema,
  V_systems_completeRowSchema,
} from "@/schemas/zod-schemas";
import { useTableQuery } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { Modal } from "@/components/common/ui";
import {
  FormCard,
  FormDateInput,
  FormInput,
  FormSearchableSelect,
  FormSwitch,
  FormTextarea,
} from "@/components/common/form";
import { z } from "zod";
import { toast } from "sonner";
import { AnimatePresence, motion } from "framer-motion";
import { Button } from "@/components/common/ui";

// Create a single, unified schema by merging all required fields
const formSchema = system_connectionsInsertSchema
  .extend(ports_managementInsertSchema.omit({ system_connection_id: true }).shape)
  .extend(sdh_connectionsInsertSchema.omit({ system_connection_id: true }).shape);

export type SystemConnectionFormValues = z.infer<typeof formSchema>;

interface SystemConnectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentSystem: V_systems_completeRowSchema;
  editingConnection: V_system_connections_completeRowSchema | null;
  onSubmit: (data: SystemConnectionFormValues) => void;
  isLoading: boolean;
}

export const SystemConnectionFormModal: FC<SystemConnectionFormModalProps> = ({
  isOpen,
  onClose,
  parentSystem,
  editingConnection,
  onSubmit,
  isLoading,
}) => {
  const supabase = createClient();
  const isEditMode = !!editingConnection;
  const [step, setStep] = useState(1);

  const { data: systems = { data: [] } } = useTableQuery(supabase, "systems", {
    columns: "id, system_name",
    filters: { system_name: { operator: "neq", value: "DEFAULT" } },
  });
  const { data: mediaTypes = { data: [] } } = useTableQuery(supabase, "lookup_types", {
    columns: "id, name",
    filters: { category: "MEDIA_TYPES", name: { operator: "neq", value: "DEFAULT" } },
  });
  const { data: portTypes = { data: [] } } = useTableQuery(supabase, "lookup_types", {
    columns: "id, name",
    filters: { category: "PORT_TYPES", name: { operator: "neq", value: "DEFAULT" } },
  });
  const { data: systemTypes = { data: [] } } = useTableQuery(supabase, "lookup_types", {
    columns: "id, code",
    filters: { category: "SYSTEM_TYPES", name: { operator: "neq", value: "DEFAULT" } },
  });

  const systemOptions = useMemo(
    () => systems.data.map((s) => ({ value: s.id, label: s.system_name || s.id })),
    [systems]
  );
  const mediaTypeOptions = useMemo(
    () => mediaTypes.data.map((t) => ({ value: t.id, label: t.name })),
    [mediaTypes]
  );
  const portTypeOptions = useMemo(
    () => portTypes.data.map((t) => ({ value: t.id, label: t.name })),
    [portTypes]
  );

  const systemTypesOptions = useMemo(
    () => systemTypes.data.map((t) => ({ value: t.id, label: t.code || t.id })),
    [systemTypes]
  );

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    reset,
    trigger,
  } = useForm<SystemConnectionFormValues>({
    resolver: zodResolver(formSchema),
  });

  const isRingBasedSystem = parentSystem.is_ring_based === true;
  const systemTypeName = parentSystem.system_type_name?.toLowerCase() || "";
  const isSdhSystem = systemTypeName.includes("synchronous") || systemTypeName.includes("sdh");
  const needsStep2 = isRingBasedSystem || isSdhSystem;

  useEffect(() => {
    if (isOpen) {
      setStep(1); // Always reset to step 1 when opening
      if (isEditMode && editingConnection) {
        reset({
          system_id: editingConnection.system_id ?? "",
          media_type_id: editingConnection.media_type_id ?? "",
          status: editingConnection.status ?? true,
          sn_id: editingConnection.sn_id ?? null,
          en_id: editingConnection.en_id ?? null,
          connected_system_type_id: editingConnection.connected_system_type_id ?? null,
          sn_ip: editingConnection.sn_ip ?? null,
          sn_interface: editingConnection.sn_interface ?? null,
          en_ip: editingConnection.en_ip ?? null,
          en_interface: editingConnection.en_interface ?? null,
          bandwidth_mbps: editingConnection.bandwidth_mbps ?? null,
          vlan: editingConnection.vlan ?? null,
          commissioned_on: editingConnection.commissioned_on ?? null,
          remark: editingConnection.remark ?? null,
          port: editingConnection.port ?? null,
          port_type_id: editingConnection.port_type_id ?? null,
          port_capacity: editingConnection.port_capacity ?? null,
          sfp_serial_no: editingConnection.sfp_serial_no ?? null,
          fiber_in: editingConnection.fiber_in ?? null,
          fiber_out: editingConnection.fiber_out ?? null,
          customer_name: editingConnection.customer_name ?? null,
          bandwidth_allocated_mbps: editingConnection.bandwidth_allocated_mbps ?? null,
          stm_no: editingConnection.sdh_stm_no ?? null,
          carrier: editingConnection.sdh_carrier ?? null,
          a_slot: editingConnection.sdh_a_slot ?? null,
          a_customer: editingConnection.sdh_a_customer ?? null,
          b_slot: editingConnection.sdh_b_slot ?? null,
          b_customer: editingConnection.sdh_b_customer ?? null,
        });
      } else {
        reset({ system_id: parentSystem.id!, status: true, media_type_id: "" });
      }
    }
  }, [isOpen, isEditMode, editingConnection, parentSystem, reset]);

  const onValidSubmit = useCallback(
    (formData: SystemConnectionFormValues) => {
      if (!formData.media_type_id) {
        toast.error("Media Type is a required field.");
        return;
      }
      onSubmit(formData);
    },
    [onSubmit]
  );

  const onInvalidSubmit: SubmitErrorHandler<SystemConnectionFormValues> = (errors) => {
    toast.error("Please fix the validation errors.");
    if (Object.keys(errors).some((k) => ["system_id", "media_type_id"].includes(k)) && step !== 1) {
      setStep(1);
    }
  };

  const handleNext = async () => {
    const isValid = await trigger(["media_type_id"]);
    if (isValid && needsStep2) {
      setStep(2);
    } else if (isValid) {
      handleSubmit(onValidSubmit, onInvalidSubmit)();
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
        <h3 className='text-lg font-medium border-b pb-2'>General</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormSearchableSelect
            name='media_type_id'
            label='Media Type'
            control={control}
            options={mediaTypeOptions}
            error={errors.media_type_id}
            required
          />
          <FormInput
            name='bandwidth_mbps'
            label='Bandwidth (Mbps)'
            register={register}
            type='number'
            error={errors.bandwidth_mbps}
          />
          <FormInput name='vlan' label='VLAN' register={register} error={errors.vlan} />
          <FormDateInput
            name='commissioned_on'
            label='Commissioned On'
            control={control}
            error={errors.commissioned_on}
          />
        </div>

        <h3 className='text-lg font-medium border-b pt-4 pb-2'>Connectivity</h3>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormSearchableSelect
            name='sn_id'
            label='Start Node System'
            control={control}
            options={systemOptions}
            error={errors.sn_id}
          />
          <FormInput
            name='sn_interface'
            label='Start Node Interface'
            register={register}
            error={errors.sn_interface}
          />
          <FormSearchableSelect
            name='en_id'
            label='End Node System'
            control={control}
            options={systemOptions}
            error={errors.en_id}
          />
          <FormInput
            name='en_interface'
            label='End Node Interface'
            register={register}
            error={errors.en_interface}
          />
          <FormSearchableSelect
            name='connected_system_type_id'
            label='Type:'
            control={control}
            options={systemTypesOptions}
            error={errors.connected_system_type_id}
          />
        </div>
      </div>
    </motion.div>
  );

  const step2Fields = (
    <motion.div
      key='step2'
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}>
      {isRingBasedSystem && (
        <div className='space-y-4'>
          <h3 className='text-lg font-medium border-b pb-2'>Port Details</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormInput
              name='customer_name'
              label='Customer Name'
              register={register}
              error={errors.customer_name}
            />
            <FormInput name='port' label='Port' register={register} error={errors.port} />
            <FormSearchableSelect
              name='port_type_id'
              label='Port Type'
              control={control}
              options={portTypeOptions}
              error={errors.port_type_id}
            />
            <FormInput
              name='port_capacity'
              label='Port Capacity'
              register={register}
              error={errors.port_capacity}
            />
          </div>
        </div>
      )}
      {isSdhSystem && (
        <div className='space-y-4 mt-6'>
          <h3 className='text-lg font-medium border-b pb-2'>SDH Details</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormInput name='stm_no' label='STM No.' register={register} error={errors.stm_no} />
            <FormInput name='carrier' label='Carrier' register={register} error={errors.carrier} />
            <FormInput
              name='a_slot'
              label='A-Side Slot'
              register={register}
              error={errors.a_slot}
            />
            <FormInput
              name='a_customer'
              label='A-Side Customer'
              register={register}
              error={errors.a_customer}
            />
            <FormInput
              name='b_slot'
              label='B-Side Slot'
              register={register}
              error={errors.b_slot}
            />
            <FormInput
              name='b_customer'
              label='B-Side Customer'
              register={register}
              error={errors.b_customer}
            />
          </div>
        </div>
      )}
    </motion.div>
  );

  const renderFooter = () => {
    if (step === 1 && needsStep2) {
      return (
        <div className='flex justify-end gap-2'>
          <Button type='button' variant='outline' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type='button' onClick={handleNext} disabled={isLoading}>
            Next
          </Button>
        </div>
      );
    }
    return (
      <div className='flex justify-between w-full'>
        {step === 2 && (
          <Button type='button' variant='outline' onClick={() => setStep(1)} disabled={isLoading}>
            Back
          </Button>
        )}
        <div className='flex justify-end gap-2 w-full'>
          <Button type='button' variant='secondary' onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type='submit' disabled={isLoading}>
            {isLoading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </div>
    );
  };

  const modalTitle = isEditMode
    ? "Edit Connection"
    : `New Connection ${needsStep2 ? `(Step ${step} of 2)` : ""}`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      size='xl'
      className='w-0 h-0 transparent'>
      <FormCard
        onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)}
        onCancel={onClose}
        isLoading={isLoading}
        title={modalTitle}
        standalone
        footerContent={renderFooter()}>
        <div className='max-h-[70vh] overflow-y-auto p-1 pr-4'>
          <AnimatePresence mode='wait'>{step === 1 ? step1Fields : step2Fields}</AnimatePresence>
          {step === 2 && (
            <div className='mt-6 space-y-4 border-t pt-6 dark:border-gray-700'>
              <FormTextarea name='remark' label='Remark' control={control} error={errors.remark} />
              <FormSwitch name='status' label='Status' control={control} className='my-4' />
            </div>
          )}
        </div>
      </FormCard>
    </Modal>
  );
};
