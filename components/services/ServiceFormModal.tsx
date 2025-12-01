// components/services/ServiceFormModal.tsx
"use client";

import { FC, useEffect, useMemo } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/common/ui";
import { FormCard, FormInput, FormSearchableSelect, FormSwitch, FormTextarea } from "@/components/common/form";
import { useTableQuery } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { ServicesRowSchema } from "@/schemas/zod-schemas";

// Corrected Zod Schema
const serviceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  // Fixed: z.uuid is not a function, use z.string().uuid()
  system_id: z.string().uuid("Parent System is required"),
  node_id: z.string().uuid("Node is required"),
  // Allow empty string literal for Select inputs that might return ""
  link_type_id: z.union([z.string().uuid(), z.literal("")]).nullable().optional(),
  services_ip: z.string().nullable().optional(),
  services_interface: z.string().nullable().optional(),
  bandwidth_allocated: z.string().nullable().optional(),
  vlan: z.string().nullable().optional(),
  lc_id: z.string().nullable().optional(),
  unique_id: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.boolean(),
});

export type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface ServiceFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingService: ServicesRowSchema | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export const ServiceFormModal: FC<ServiceFormModalProps> = ({
  isOpen, onClose, editingService, onSubmit, isLoading
}) => {
  const supabase = createClient();
  const isEdit = !!editingService;

  const { register, handleSubmit, control, reset, formState: { errors }, watch, setValue } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: { status: true }
  });

  // Fetch Dropdown Data
  const { data: systems } = useTableQuery(supabase, "v_systems_complete", { columns: "id, system_name, node_id", limit: 5000 });
  const { data: nodes } = useTableQuery(supabase, "nodes", { columns: "id, name", limit: 5000 });
  const { data: linkTypes } = useTableQuery(supabase, "lookup_types", { filters: { category: "LINK_TYPES" } });

  const systemOptions = useMemo(() => systems?.data.map(s => ({ value: s.id!, label: s.system_name! })) || [], [systems]);
  const nodeOptions = useMemo(() => nodes?.data.map(n => ({ value: n.id!, label: n.name! })) || [], [nodes]);
  const linkTypeOptions = useMemo(() => linkTypes?.data.map(l => ({ value: l.id!, label: l.name! })) || [], [linkTypes]);

  const watchedSystemId = watch("system_id");

  // Auto-set Node ID when System is selected
  useEffect(() => {
    if (watchedSystemId && systems?.data) {
        const sys = systems.data.find(s => s.id === watchedSystemId);
        if (sys?.node_id) setValue("node_id", sys.node_id);
    }
  }, [watchedSystemId, systems, setValue]);

  useEffect(() => {
    if (isOpen) {
        if (editingService) {
            reset({
                name: editingService.name,
                system_id: editingService.system_id,
                node_id: editingService.node_id,
                link_type_id: editingService.link_type_id || "",
                services_ip: editingService.services_ip || "",
                services_interface: editingService.services_interface || "",
                bandwidth_allocated: editingService.bandwidth_allocated || "",
                vlan: editingService.vlan || "",
                lc_id: editingService.lc_id || "",
                unique_id: editingService.unique_id || "",
                description: editingService.description || "",
                status: editingService.status ?? true,
            });
        } else {
            reset({ name: "", status: true });
        }
    }
  }, [isOpen, editingService, reset]);

  // Wrapper to sanitize data before submitting
  const onValidSubmit: SubmitHandler<ServiceFormValues> = (data) => {
    // Helper to convert empty strings to null (Fixes "invalid input syntax for type inet")
    const toNull = (val: string | null | undefined) => (!val || val.trim() === "") ? null : val.trim();

    const sanitizedData = {
      ...data,
      link_type_id: toNull(data.link_type_id),
      services_ip: toNull(data.services_ip),
      services_interface: toNull(data.services_interface),
      bandwidth_allocated: toNull(data.bandwidth_allocated),
      vlan: toNull(data.vlan),
      lc_id: toNull(data.lc_id),
      unique_id: toNull(data.unique_id),
      description: toNull(data.description),
    };

    onSubmit(sanitizedData);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? "Edit Service" : "Add Service"} size="lg">
        <FormCard
            title={isEdit ? "Edit Service" : "Add Service"}
            onSubmit={handleSubmit(onValidSubmit)}
            onCancel={onClose}
            isLoading={isLoading}
            standalone
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput name="name" label="Service Name" register={register} error={errors.name} required placeholder="e.g. Customer-Link-A" />
                <FormSearchableSelect<ServiceFormValues> name="link_type_id" label="Link Type" control={control} options={linkTypeOptions} error={errors.link_type_id} />
                
                <FormSearchableSelect<ServiceFormValues> name="system_id" label="Host System" control={control} options={systemOptions} error={errors.system_id} required />
                <FormSearchableSelect<ServiceFormValues> name="node_id" label="Location (Node)" control={control} options={nodeOptions} error={errors.node_id} required />

                <FormInput name="services_ip" label="Service IP" register={register} error={errors.services_ip} placeholder="x.x.x.x" />
                <FormInput name="services_interface" label="Default Interface" register={register} error={errors.services_interface} />
                
                <FormInput name="vlan" label="VLAN" register={register} error={errors.vlan} />
                <FormInput name="bandwidth_allocated" label="Bandwidth" register={register} error={errors.bandwidth_allocated} />
                
                <FormInput name="lc_id" label="LC ID" register={register} error={errors.lc_id} />
                <FormInput name="unique_id" label="Unique ID" register={register} error={errors.unique_id} />
            </div>
            <div className="mt-4">
                <FormTextarea<ServiceFormValues> name="description" label="Description" control={control} error={errors.description} />
                <FormSwitch<ServiceFormValues> name="status" label="Active Status" control={control} className="mt-4" />
            </div>
        </FormCard>
    </Modal>
  );
};