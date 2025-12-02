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
import { V_servicesRowSchema } from "@/schemas/zod-schemas";

// --- Corrected Schema ---
// Represents the logical service definition only.
const serviceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  // Service is now tied to a Location (Node), not a specific System
  node_id: z.uuid("Location (Node) is required"), 
  link_type_id: z.union([z.string().uuid(), z.literal("")]).nullable().optional(),
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
  // Accepts the view schema which contains the fields we need
  editingService: V_servicesRowSchema | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export const ServiceFormModal: FC<ServiceFormModalProps> = ({
  isOpen, onClose, editingService, onSubmit, isLoading
}) => {
  const supabase = createClient();
  const isEdit = !!editingService;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: { status: true }
  });

  // --- Data Fetching ---
  // Only fetch Nodes and Link Types. Systems are no longer relevant here.
  
  const { data: nodes } = useTableQuery(supabase, "nodes", { 
    columns: "id, name", 
    filters: { status: true },
    orderBy: [{ column: 'name', ascending: true }],
    limit: 5000 
  });
  
  const { data: linkTypes } = useTableQuery(supabase, "lookup_types", { 
    filters: { category: "LINK_TYPES" },
    orderBy: [{ column: 'name', ascending: true }]
  });

  const nodeOptions = useMemo(() => nodes?.data.map(n => ({ value: n.id!, label: n.name! })) || [], [nodes]);
  const linkTypeOptions = useMemo(() => linkTypes?.data.map(l => ({ value: l.id!, label: l.name! })) || [], [linkTypes]);

  // --- Reset Logic ---
  useEffect(() => {
    if (isOpen) {
        if (editingService) {
            reset({
                name: editingService.name || "",
                node_id: editingService.node_id || "", // Location is required
                link_type_id: editingService.link_type_id || "",
                bandwidth_allocated: editingService.bandwidth_allocated || "",
                vlan: editingService.vlan || "",
                lc_id: editingService.lc_id || "",
                unique_id: editingService.unique_id || "",
                description: editingService.description || "",
                status: editingService.status ?? true,
            });
        } else {
            reset({ 
              name: "", 
              status: true,
              node_id: "",
              link_type_id: "",
              bandwidth_allocated: "",
              vlan: "",
              lc_id: "",
              unique_id: "",
              description: ""
            });
        }
    }
  }, [isOpen, editingService, reset]);

  const onValidSubmit: SubmitHandler<ServiceFormValues> = (data) => {
    // Helper to convert empty strings to null
    const toNull = (val: string | null | undefined) => (!val || val.trim() === "") ? null : val.trim();

    const sanitizedData = {
      ...data,
      link_type_id: toNull(data.link_type_id),
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
            title={isEdit ? "Edit Service" : "Add New Service"}
            subtitle="Define the logical service details. Physical connection mapping is handled separately."
            onSubmit={handleSubmit(onValidSubmit)}
            onCancel={onClose}
            isLoading={isLoading}
            standalone
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormInput 
                  name="name" 
                  label="Service / Customer Name" 
                  register={register} 
                  error={errors.name} 
                  required 
                  placeholder="e.g. SBI-Kolkata-Main" 
                />
                
                <FormSearchableSelect<ServiceFormValues> 
                  name="node_id" 
                  label="Location (End-Point Node)" 
                  control={control} 
                  options={nodeOptions} 
                  error={errors.node_id} 
                  required 
                  placeholder="Select where this service is delivered"
                />

                <FormSearchableSelect<ServiceFormValues> 
                  name="link_type_id" 
                  label="Link Type" 
                  control={control} 
                  options={linkTypeOptions} 
                  error={errors.link_type_id} 
                  placeholder="e.g. MPLS, ILL"
                />
                
                <FormInput 
                  name="bandwidth_allocated" 
                  label="Bandwidth" 
                  register={register} 
                  error={errors.bandwidth_allocated} 
                  placeholder="e.g. 100 Mbps"
                />

                <FormInput 
                  name="vlan" 
                  label="VLAN" 
                  register={register} 
                  error={errors.vlan} 
                />
                
                <FormInput 
                  name="lc_id" 
                  label="LC ID / Circuit ID" 
                  register={register} 
                  error={errors.lc_id} 
                />
                
                <FormInput 
                  name="unique_id" 
                  label="Unique ID" 
                  register={register} 
                  error={errors.unique_id} 
                />
            </div>
            <div className="mt-4">
                <FormTextarea<ServiceFormValues> 
                  name="description" 
                  label="Description / Notes" 
                  control={control} 
                  error={errors.description} 
                />
                <FormSwitch<ServiceFormValues> 
                  name="status" 
                  label="Active Status" 
                  control={control} 
                  className="mt-4" 
                />
            </div>
        </FormCard>
    </Modal>
  );
};