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
  SystemsRowSchema,
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

// --- THE FIX: Remove the fiber fields from the base form schema ---
const formSchema = system_connectionsInsertSchema.omit({
    working_fiber_in_id: true,
    working_fiber_out_id: true,
    protection_fiber_in_id: true,
    protection_fiber_out_id: true,
}).extend(sdh_connectionsInsertSchema.omit({ system_connection_id: true }).shape);

export type SystemConnectionFormValues = z.infer<typeof formSchema>;

type EditingConnectionType = V_system_connections_completeRowSchema & {
  connected_link_type_id?: string | null;
};

interface SystemConnectionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  parentSystem: V_systems_completeRowSchema;
  editingConnection: V_system_connections_completeRowSchema | null;
  onSubmit: (data: SystemConnectionFormValues) => void;
  isLoading: boolean;
}

type SystemWithCode = SystemsRowSchema & {
  system_type: { code: string | null } | null;
};

export const SystemConnectionFormModal: FC<SystemConnectionFormModalProps> = ({ isOpen, onClose, parentSystem, editingConnection, onSubmit, isLoading }) => {
  const supabase = createClient();
  const isEditMode = !!editingConnection;

  const { data: systemsResult = { data: [] } } = useTableQuery(supabase, "systems", { 
    columns: "id, system_name, ip_address, system_type:system_type_id(code)" 
  });
  const systems = useMemo(() => (systemsResult.data as SystemWithCode[]) ?? [], [systemsResult.data]);

  const { data: mediaTypes = { data: [] } } = useTableQuery(supabase, "lookup_types", { columns: "id, name", filters: { category: "MEDIA_TYPES" } });
  const { data: linkTypes = { data: [] } } = useTableQuery(supabase, "lookup_types", { columns: "id, name", filters: { category: "LINK_TYPES" } });

  const systemOptions = useMemo(() => 
    systems.map((s) => {
      const typeCode = s.system_type?.code;
      const ip = s.ip_address ? `(${s.ip_address})` : '';
      const type = typeCode ? `[${typeCode}]` : '';
      const label = `${s.system_name || s.id} ${type} ${ip}`.trim();
      return { value: s.id, label };
    }), 
    [systems]
  );

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
        const conn = editingConnection as EditingConnectionType;
        reset({
          system_id: conn.system_id ?? "",
          media_type_id: conn.media_type_id ?? "",
          status: conn.status ?? true,
          sn_id: conn.sn_id ?? null,
          en_id: conn.en_id ?? null,
          connected_system_id: conn.connected_system_id ?? null,
          sn_ip: conn.sn_ip ?? null,
          sn_interface: conn.sn_interface ?? null,
          en_ip: conn.en_ip ?? null,
          en_interface: conn.en_interface ?? null,
          bandwidth_mbps: conn.bandwidth_mbps ?? null,
          vlan: conn.vlan ?? null,
          commissioned_on: conn.commissioned_on ?? null,
          remark: conn.remark ?? null,
          customer_name: conn.customer_name ?? null,
          bandwidth_allocated_mbps: conn.bandwidth_allocated_mbps ?? null,
          connected_system_working_interface: conn.connected_system_working_interface ?? null,
          connected_system_protection_interface: conn.connected_system_protection_interface ?? null,
          connected_link_type_id: conn.connected_link_type_id ?? null,
          stm_no: conn.sdh_stm_no ?? null,
          carrier: conn.sdh_carrier ?? null,
          a_slot: conn.sdh_a_slot ?? null,
          a_customer: conn.sdh_a_customer ?? null,
          b_slot: conn.sdh_b_slot ?? null,
          b_customer: conn.sdh_b_customer ?? null,
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
  
  const onInvalidSubmit: SubmitErrorHandler<SystemConnectionFormValues> = () => {
    toast.error("Please fix the validation errors.");
  };
  
  const modalTitle = isEditMode ? "Edit Connection" : "New Connection";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="xl" className="w-0 h-0 transparent">
      <FormCard onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} onCancel={onClose} isLoading={isLoading} title={modalTitle} standalone>
        <div className='max-h-[70vh] overflow-y-auto p-1 pr-4 space-y-6'>
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

          {/* --- THE FIX: Fiber details section has been removed from this form --- */}
          
          <div className="mt-6 space-y-4 border-t pt-6 dark:border-gray-700">
            <FormTextarea name='remark' label='Remark' control={control} error={errors.remark} />
            <FormSwitch name='status' label='Status' control={control} className='my-4' />
          </div>
        </div>
      </FormCard>
    </Modal>
  );
};