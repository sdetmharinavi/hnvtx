// path: components/systems/SystemConnectionFormModal.tsx
"use client";

import { FC, useCallback, useEffect, useMemo } from "react";
import { useForm, SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  system_connectionsInsertSchema,
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

// --- THE FIX: Create a unified form schema that includes all new fields. ---
const formSchema = system_connectionsInsertSchema
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

export const SystemConnectionFormModal: FC<SystemConnectionFormModalProps> = ({ isOpen, onClose, parentSystem, editingConnection, onSubmit, isLoading }) => {
  const supabase = createClient();
  const isEditMode = !!editingConnection;

  const { data: systems = { data: [] } } = useTableQuery(supabase, "systems", { columns: "id, system_name" });
  const { data: mediaTypes = { data: [] } } = useTableQuery(supabase, "lookup_types", { columns: "id, name", filters: { category: "MEDIA_TYPES" } });
  const { data: linkTypes = { data: [] } } = useTableQuery(supabase, "lookup_types", { columns: "id, name", filters: { category: "LINK_TYPES" } });

  const systemOptions = useMemo(() => systems.data.map((s) => ({ value: s.id, label: s.system_name || s.id })), [systems]);
  const mediaTypeOptions = useMemo(() => mediaTypes.data.map((t) => ({ value: t.id, label: t.name })), [mediaTypes]);
  const linkTypeOptions = useMemo(() => linkTypes.data.map((t) => ({ value: t.id, label: t.name })), [linkTypes]);
  
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
          // Reset all fields including the new ones
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
          customer_name: editingConnection.customer_name ?? null,
          bandwidth_allocated_mbps: editingConnection.bandwidth_allocated_mbps ?? null,
          working_fiber_in: editingConnection.working_fiber_in ?? null,
          working_fiber_out: editingConnection.working_fiber_out ?? null,
          protection_fiber_in: editingConnection.protection_fiber_in ?? null,
          protection_fiber_out: editingConnection.protection_fiber_out ?? null,
          connected_system_working_interface: editingConnection.connected_system_working_interface ?? null,
          connected_system_protection_interface: editingConnection.connected_system_protection_interface ?? null,
          connected_link_type_id: (editingConnection as any).connected_link_type_id ?? null, // Cast because it's not in the base schema
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
      onSubmit(formData);
    },
    [onSubmit]
  );
  
  const onInvalidSubmit: SubmitErrorHandler<SystemConnectionFormValues> = (errors) => {
    toast.error("Please fix the validation errors.");
  };
  
  const modalTitle = isEditMode ? "Edit Connection" : "New Connection";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="full" className="w-0 h-0 transparent">
      <FormCard onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} onCancel={onClose} isLoading={isLoading} title={modalTitle} standalone>
        <div className='max-h-[70vh] overflow-y-auto p-1 pr-4 space-y-6'>
          {/* --- THE FIX: Form is updated with all new fields --- */}
          <section>
            <h3 className='text-lg font-medium border-b pb-2 mb-4'>General</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
              <FormSearchableSelect name='media_type_id' label='Media Type' control={control} options={mediaTypeOptions} error={errors.media_type_id} required />
              <FormInput name='bandwidth_mbps' label='Bandwidth (Mbps)' register={register} type='number' error={errors.bandwidth_mbps} />
              <FormInput name='vlan' label='VLAN' register={register} error={errors.vlan} />
              <FormDateInput name='commissioned_on' label='Commissioned On' control={control} error={errors.commissioned_on} />
              <FormInput name='customer_name' label='Customer Name' register={register} error={errors.customer_name} />
              <FormInput name='bandwidth_allocated_mbps' label='Allocated (Mbps)' type='number' register={register} error={errors.bandwidth_allocated_mbps} />
            </div>
          </section>

          <section>
            <h3 className='text-lg font-medium border-b pt-4 pb-2 mb-4'>Connectivity</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
              <FormSearchableSelect name='sn_id' label='Start Node System' control={control} options={systemOptions} error={errors.sn_id} />
              <FormInput name='sn_interface' label='Start Node Interface' register={register} error={errors.sn_interface} />
              <FormSearchableSelect name='en_id' label='End Node System' control={control} options={systemOptions} error={errors.en_id} />
              <FormInput name='en_interface' label='End Node Interface' register={register} error={errors.en_interface} />
              <FormSearchableSelect name='connected_system_id' label='Connected To System' control={control} options={systemOptions} error={errors.connected_system_id} />
              <FormSearchableSelect name='connected_link_type_id' label='Connected Link Type' control={control} options={linkTypeOptions} error={errors.connected_link_type_id} />
              <FormInput name='connected_system_working_interface' label='Connected Sys (Working Int.)' register={register} error={errors.connected_system_working_interface} />
              <FormInput name='connected_system_protection_interface' label='Connected Sys (Prot. Int.)' register={register} error={errors.connected_system_protection_interface} />
            </div>
          </section>

          {/* <section>
            <h3 className='text-lg font-medium border-b pt-4 pb-2 mb-4'>Fiber Details</h3>
            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
                <FormInput name='working_fiber_in' label='Working Fiber IN' type='number' register={register} error={errors.working_fiber_in} />
                <FormInput name='working_fiber_out' label='Working Fiber OUT' type='number' register={register} error={errors.working_fiber_out} />
                <FormInput name='protection_fiber_in' label='Protection Fiber IN' type='number' register={register} error={errors.protection_fiber_in} />
                <FormInput name='protection_fiber_out' label='Protection Fiber OUT' type='number' register={register} error={errors.protection_fiber_out} />
            </div>
          </section> */}
          
          <div className="mt-6 space-y-4 border-t pt-6 dark:border-gray-700">
            <FormTextarea name='remark' label='Remark' control={control} error={errors.remark} />
            <FormSwitch name='status' label='Status' control={control} className='my-4' />
          </div>
        </div>
      </FormCard>
    </Modal>
  );
};