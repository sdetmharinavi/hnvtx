// path: components/systems/SystemConnectionFormModal.tsx
"use client";

import { FC, useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { system_connectionsInsertSchema, V_systems_completeRowSchema } from '@/schemas/zod-schemas';
import { useTableQuery } from '@/hooks/database';
import { createClient } from '@/utils/supabase/client';
import { Modal, Button } from '@/components/common/ui';
import { FormCard, FormDateInput, FormInput, FormSearchableSelect, FormSwitch, FormTextarea } from '@/components/common/form';
import { SystemConnectionFormData, useUpsertSystemConnection } from '@/hooks/database/system-connection-hooks';
import { z } from 'zod';

const formSchema = system_connectionsInsertSchema.extend({
  // SFP fields
  sfp_port: z.string().nullable().optional(),
  sfp_type_id: z.string().uuid().nullable().optional(),
  sfp_capacity: z.string().nullable().optional(),
  sfp_serial_no: z.string().nullable().optional(),
  fiber_in: z.number().nullable().optional(),
  fiber_out: z.number().nullable().optional(),
  customer_name: z.string().nullable().optional(),
  bandwidth_allocated_mbps: z.number().nullable().optional(),
  // SDH fields
  stm_no: z.string().nullable().optional(),
  carrier: z.string().nullable().optional(),
  a_slot: z.string().nullable().optional(),
  a_customer: z.string().nullable().optional(),
  b_slot: z.string().nullable().optional(),
  b_customer: z.string().nullable().optional(),
  // VMUX fields
  subscriber: z.string().nullable().optional(),
  c_code: z.string().nullable().optional(),
  channel: z.string().nullable().optional(),
  tk: z.string().nullable().optional(),
  // Override media_type_id to be required since the database function expects it
  media_type_id: z.string().uuid(),
});

type FormValues = z.infer<typeof formSchema>;

interface SystemConnectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentSystem: V_systems_completeRowSchema;
  editingConnection: any | null; // Using 'any' for flexibility with view data
  refetch: () => void;
}

export const SystemConnectionFormModal: FC<SystemConnectionFormModalProps> = ({ isOpen, onClose, parentSystem, editingConnection, refetch }) => {
  const supabase = createClient();
  const isEditMode = !!editingConnection;

  const { data: systems = {data:[]} } = useTableQuery(supabase, 'systems', { columns: 'id, system_name' });
  const { data: mediaTypes = {data:[]} } = useTableQuery(supabase, 'lookup_types', { columns: 'id, name', filters: { category: 'MEDIA_TYPES' } });
  const { data: sfpTypes = {data:[]} } = useTableQuery(supabase, 'lookup_types', { columns: 'id, name', filters: { category: 'SFP_TYPES' } });

  const systemOptions = useMemo(() => systems.data.map(s => ({ value: s.id, label: s.system_name || s.id })), [systems]);
  const mediaTypeOptions = useMemo(() => mediaTypes.data.map(t => ({ value: t.id, label: t.name })), [mediaTypes]);
  const sfpTypeOptions = useMemo(() => sfpTypes.data.map(t => ({ value: t.id, label: t.name })), [sfpTypes]);

  const { control, handleSubmit, register, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && editingConnection) {
        reset({
          ...editingConnection,
          media_type_id: editingConnection.media_type_id ?? "", // Convert null to empty string for required field
          // Coalesce all other optional fields to null
          sn_id: editingConnection.sn_id ?? null,
          en_id: editingConnection.en_id ?? null,
          connected_system_id: editingConnection.connected_system_id ?? null,
        });
      } else {
        reset({
            system_id: parentSystem.id!,
            status: true,
            media_type_id: "", // Provide empty string as default for required field
        });
      }
    }
  }, [isOpen, isEditMode, editingConnection, parentSystem, reset]);

  const upsertMutation = useUpsertSystemConnection();

  const onValidSubmit = useCallback((formData: FormValues) => {
    // Ensure media_type_id is defined (required field)
    if (!formData.media_type_id) {
      throw new Error('Media type is required');
    }

    const payload: SystemConnectionFormData = {
      p_system_id: parentSystem.id!,
      p_media_type_id: formData.media_type_id, // Now properly typed as UUID
      p_status: formData.status ?? true,
      p_id: isEditMode ? editingConnection.id : undefined,
      ...formData,
    };
    
    upsertMutation.mutate(payload, {
      onSuccess: () => {
        refetch();
        onClose();
      }
    });
  }, [parentSystem.id, isEditMode, editingConnection, upsertMutation, refetch, onClose]);
  
  const isLoading = isSubmitting || upsertMutation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditMode ? "Edit System Connection" : "Add System Connection"} size="xl">
      <FormCard
        onSubmit={handleSubmit(onValidSubmit)}
        onCancel={onClose}
        isLoading={isLoading}
        title={isEditMode ? "Edit Connection" : "New Connection"}
        standalone={false} // Renders inside the modal
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1 pr-4">
          <h3 className="text-lg font-medium border-b pb-2">General</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSearchableSelect name="media_type_id" label="Media Type" control={control} options={mediaTypeOptions} error={errors.media_type_id} required />
            <FormInput name="bandwidth_mbps" label="Bandwidth (Mbps)" register={register} type="number" error={errors.bandwidth_mbps} />
            <FormInput name="vlan" label="VLAN" register={register} error={errors.vlan} />
            <FormDateInput name="commissioned_on" label="Commissioned On" control={control} error={errors.commissioned_on} />
          </div>
          
          <h3 className="text-lg font-medium border-b pt-4 pb-2">Connectivity</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormSearchableSelect name="sn_id" label="Start Node System" control={control} options={systemOptions} error={errors.sn_id} />
            <FormInput name="sn_interface" label="Start Node Interface" register={register} error={errors.sn_interface} />
            <FormSearchableSelect name="en_id" label="End Node System" control={control} options={systemOptions} error={errors.en_id} />
            <FormInput name="en_interface" label="End Node Interface" register={register} error={errors.en_interface} />
            <FormSearchableSelect name="connected_system_id" label="Connected To System" control={control} options={systemOptions} error={errors.connected_system_id} />
          </div>

          {/* Conditional Sections */}
          {parentSystem.is_ring_based && (
            <>
              <h3 className="text-lg font-medium border-b pt-4 pb-2">SFP Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput name="customer_name" label="Customer Name" register={register} error={errors.customer_name} />
                <FormInput name="sfp_port" label="SFP Port" register={register} error={errors.sfp_port} />
                <FormSearchableSelect name="sfp_type_id" label="SFP Type" control={control} options={sfpTypeOptions} error={errors.sfp_type_id} />
                <FormInput name="sfp_capacity" label="SFP Capacity" register={register} error={errors.sfp_capacity} />
              </div>
            </>
          )}

          {parentSystem.is_sdh && (
            <>
              <h3 className="text-lg font-medium border-b pt-4 pb-2">SDH Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput name="stm_no" label="STM No." register={register} error={errors.stm_no} />
                <FormInput name="carrier" label="Carrier" register={register} error={errors.carrier} />
                <FormInput name="a_slot" label="A-Side Slot" register={register} error={errors.a_slot} />
                <FormInput name="a_customer" label="A-Side Customer" register={register} error={errors.a_customer} />
                <FormInput name="b_slot" label="B-Side Slot" register={register} error={errors.b_slot} />
                <FormInput name="b_customer" label="B-Side Customer" register={register} error={errors.b_customer} />
              </div>
            </>
          )}

          {parentSystem.system_type_name === 'VMUX' && (
             <>
              <h3 className="text-lg font-medium border-b pt-4 pb-2">VMUX Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput name="subscriber" label="Subscriber" register={register} error={errors.subscriber} />
                <FormInput name="c_code" label="C-Code" register={register} error={errors.c_code} />
                <FormInput name="channel" label="Channel" register={register} error={errors.channel} />
                <FormInput name="tk" label="TK" register={register} error={errors.tk} />
              </div>
            </>
          )}
          
          <FormTextarea name="remark" label="Remark" control={control} error={errors.remark} />
          <FormSwitch name="status" label="Status" control={control} className="my-4" />
        </div>
      </FormCard>
    </Modal>
  );
};