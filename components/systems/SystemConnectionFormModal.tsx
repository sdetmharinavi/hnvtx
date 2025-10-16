// path: components/systems/SystemConnectionFormModal.tsx
"use client";

import { FC, useCallback, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { system_connectionsInsertSchema, V_system_connections_completeRowSchema, V_systems_completeRowSchema } from "@/schemas/zod-schemas";
import { useTableQuery } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { Modal } from "@/components/common/ui";
import { FormCard, FormDateInput, FormInput, FormSearchableSelect, FormSwitch, FormTextarea } from "@/components/common/form";
import { z } from "zod";
import { toast } from "sonner";

const formSchema = system_connectionsInsertSchema.extend({
  port: z.string().nullable().optional(),
  port_type_id: z.uuid().nullable().optional(),
  port_capacity: z.string().nullable().optional(),
  sfp_serial_no: z.string().nullable().optional(),
  fiber_in: z.number().nullable().optional(),
  fiber_out: z.number().nullable().optional(),
  customer_name: z.string().nullable().optional(),
  bandwidth_allocated_mbps: z.number().nullable().optional(),
  stm_no: z.string().nullable().optional(),
  carrier: z.string().nullable().optional(),
  a_slot: z.string().nullable().optional(),
  a_customer: z.string().nullable().optional(),
  b_slot: z.string().nullable().optional(),
  b_customer: z.string().nullable().optional(),
  subscriber: z.string().nullable().optional(),
  c_code: z.string().nullable().optional(),
  channel: z.string().nullable().optional(),
  tk: z.string().nullable().optional(),
  media_type_id: z.uuid(),
});

export type SystemConnectionFormValues = z.infer<typeof formSchema>;

interface SystemConnectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentSystem: V_systems_completeRowSchema;
  editingConnection: V_system_connections_completeRowSchema | null;
  // THE FIX: Accept onSubmit function and isLoading state from parent.
  onSubmit: (data: SystemConnectionFormValues) => void;
  isLoading: boolean;
}

export const SystemConnectionFormModal: FC<SystemConnectionFormModalProps> = ({ isOpen, onClose, parentSystem, editingConnection, onSubmit, isLoading }) => {
  const supabase = createClient();
  const isEditMode = !!editingConnection;

  const { data: systems = { data: [] } } = useTableQuery(supabase, "systems", { columns: "id, system_name" });
  const { data: mediaTypes = { data: [] } } = useTableQuery(supabase, "lookup_types", { columns: "id, name", filters: { category: "MEDIA_TYPES" } });
  const { data: sfpTypes = { data: [] } } = useTableQuery(supabase, "lookup_types", { columns: "id, name", filters: { category: "SFP_TYPES" } });

  const systemOptions = useMemo(() => systems.data.map((s) => ({ value: s.id, label: s.system_name || s.id })), [systems]);
  const mediaTypeOptions = useMemo(() => mediaTypes.data.map((t) => ({ value: t.id, label: t.name })), [mediaTypes]);
  const sfpTypeOptions = useMemo(() => sfpTypes.data.map((t) => ({ value: t.id, label: t.name })), [sfpTypes]);

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm<SystemConnectionFormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && editingConnection) {
        reset({
          system_id: editingConnection.system_id ?? "",
          media_type_id: editingConnection.media_type_id ?? "",
          status: editingConnection.status ?? true,
          sn_id: editingConnection.sn_id ?? null,
          en_id: editingConnection.en_id ?? null,
          connected_system_id: editingConnection.connected_system_id ?? null,
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
        reset({
          system_id: parentSystem.id!,
          status: true,
          media_type_id: "",
        });
      }
    }
  }, [isOpen, isEditMode, editingConnection, parentSystem, reset]);

  const isRingBasedSystem = parentSystem.is_ring_based === true;
  const systemTypeName = parentSystem.system_type_name?.toLowerCase() || '';
  const isSdhSystem = systemTypeName.includes('Plesiochronous Digital Hierarchy') || systemTypeName.includes('Synchronous Digital Hierarchy') || systemTypeName.includes('Next Generation SDH');

  // THE FIX: This function now simply calls the onSubmit prop.
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

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit System Connection" : "Add System Connection"} className='w-0 h-0 transparent'>
      <FormCard onSubmit={handleSubmit(onValidSubmit)} onCancel={onClose} isLoading={isLoading} title={isEditMode ? "Edit Connection" : "New Connection"} standalone>
        <div className='space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4'>
          <h3 className='text-lg font-medium border-b pb-2'>General</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormSearchableSelect name='media_type_id' label='Media Type' control={control} options={mediaTypeOptions} error={errors.media_type_id} required />
            <FormInput name='bandwidth_mbps' label='Bandwidth (Mbps)' register={register} type='number' error={errors.bandwidth_mbps} />
            <FormInput name='vlan' label='VLAN' register={register} error={errors.vlan} />
            <FormDateInput name='commissioned_on' label='Commissioned On' control={control} error={errors.commissioned_on} />
          </div>

          <h3 className='text-lg font-medium border-b pt-4 pb-2'>Connectivity</h3>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormSearchableSelect name='sn_id' label='Start Node System' control={control} options={systemOptions} error={errors.sn_id} />
            <FormInput name='sn_interface' label='Start Node Interface' register={register} error={errors.sn_interface} />
            <FormSearchableSelect name='en_id' label='End Node System' control={control} options={systemOptions} error={errors.en_id} />
            <FormInput name='en_interface' label='End Node Interface' register={register} error={errors.en_interface} />
            <FormSearchableSelect name='connected_system_id' label='Connected To System' control={control} options={systemOptions} error={errors.connected_system_id} />
          </div>

          {isRingBasedSystem && (
            <>
              <h3 className='text-lg font-medium border-b pt-4 pb-2'>SFP Details</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormInput name='customer_name' label='Customer Name' register={register} error={errors.customer_name} />
                <FormInput name='port' label='Port' register={register} error={errors.port} />
                <FormSearchableSelect name='port_type_id' label='Port Type' control={control} options={sfpTypeOptions} error={errors.port_type_id} />
                <FormInput name='port_capacity' label='Port Capacity' register={register} error={errors.port_capacity} />
              </div>
            </>
          )}

          {isSdhSystem && (
            <>
              <h3 className='text-lg font-medium border-b pt-4 pb-2'>SDH Details</h3>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormInput name='stm_no' label='STM No.' register={register} error={errors.stm_no} />
                <FormInput name='carrier' label='Carrier' register={register} error={errors.carrier} />
                <FormInput name='a_slot' label='A-Side Slot' register={register} error={errors.a_slot} />
                <FormInput name='a_customer' label='A-Side Customer' register={register} error={errors.a_customer} />
                <FormInput name='b_slot' label='B-Side Slot' register={register} error={errors.b_slot} />
                <FormInput name='b_customer' label='B-Side Customer' register={register} error={errors.b_customer} />
              </div>
            </>
          )}

          <FormTextarea name='remark' label='Remark' control={control} error={errors.remark} />
          <FormSwitch name='status' label='Status' control={control} className='my-4' />
        </div>
      </FormCard>
    </Modal>
  );
};
