// components/services/ServiceFormModal.tsx
"use client";

import { FC, useEffect, useMemo } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Modal } from "@/components/common/ui";
import {
  FormCard,
  FormInput,
  FormSearchableSelect,
  FormSwitch,
  FormTextarea,
} from "@/components/common/form";
import { V_servicesRowSchema } from "@/schemas/zod-schemas";
import { useActiveNodeOptions, useLookupTypeOptions } from "@/hooks/data/useDropdownOptions";

const serviceFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  node_id: z.uuid("Start Location is required"),
  end_node_id: z
    .union([z.uuid(), z.literal("")])
    .nullable()
    .optional(),
  link_type_id: z
    .union([z.uuid(), z.literal("")])
    .nullable()
    .optional(),
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
  editingService: V_servicesRowSchema | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export const ServiceFormModal: FC<ServiceFormModalProps> = ({
  isOpen,
  onClose,
  editingService,
  onSubmit,
  isLoading,
}) => {
  const isEdit = !!editingService;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: { status: true },
  });

  const handleClose = () => {
    if (isDirty) {
      if (!window.confirm("You have unsaved changes. Close anyway?")) return;
    }
    onClose();
  };

  const startNodeId = watch("node_id");

  // --- REFACTORED: Data Fetching ---
  const { options: nodeOptions, isLoading: isLoadingNodes } = useActiveNodeOptions();
  const { options: linkTypeOptions, isLoading: isLoadingLinks } =
    useLookupTypeOptions("LINK_TYPES");

  // Filter end node options to prevent selecting same node as start
  const endNodeOptions = useMemo(() => {
    return nodeOptions.filter((n) => n.value !== startNodeId);
  }, [nodeOptions, startNodeId]);

  // --- Reset Logic ---
  useEffect(() => {
    if (isOpen) {
      if (editingService) {
        reset({
          name: editingService.name || "",
          node_id: editingService.node_id || "",
          end_node_id: editingService.end_node_id || "",
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
          end_node_id: "",
          link_type_id: "",
          bandwidth_allocated: "",
          vlan: "",
          lc_id: "",
          unique_id: "",
          description: "",
        });
      }
    }
  }, [isOpen, editingService, reset]);

  const onValidSubmit: SubmitHandler<ServiceFormValues> = (data) => {
    const toNull = (val: string | null | undefined) =>
      !val || val.trim() === "" ? null : val.trim();

    const sanitizedData = {
      ...data,
      end_node_id: toNull(data.end_node_id),
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
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isEdit ? "Edit Service" : "Add Service"}
      size='lg'
      className='h-0 w-0 bg-transparent'
      closeOnOverlayClick={false}
      closeOnEscape={!isDirty}>
      <FormCard
        title={isEdit ? "Edit Service" : "Add New Service"}
        subtitle='Define the logical service details.'
        onSubmit={handleSubmit(onValidSubmit)}
        onCancel={handleClose}
        isLoading={isLoading}
        standalone>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <div className='md:col-span-2'>
            <FormInput
              name='name'
              label='Service / Customer Name'
              register={register}
              error={errors.name}
              required
              placeholder='e.g. SBI-Kolkata-Main'
            />
          </div>

          <FormSearchableSelect<ServiceFormValues>
            name='node_id'
            label='Start Node / Location'
            control={control}
            options={nodeOptions}
            error={errors.node_id}
            required
            placeholder='Select location A'
            isLoading={isLoadingNodes}
          />

          <FormSearchableSelect<ServiceFormValues>
            name='end_node_id'
            label='End Node / Destination (Optional)'
            control={control}
            options={endNodeOptions}
            error={errors.end_node_id}
            placeholder='Select location B'
            isLoading={isLoadingNodes}
          />

          <FormSearchableSelect<ServiceFormValues>
            name='link_type_id'
            label='Link Type'
            control={control}
            options={linkTypeOptions}
            error={errors.link_type_id}
            placeholder='e.g. MPLS, ILL'
            isLoading={isLoadingLinks}
          />

          <FormInput
            name='bandwidth_allocated'
            label='Bandwidth'
            register={register}
            error={errors.bandwidth_allocated}
            placeholder='e.g. 100 Mbps'
          />

          <FormInput name='vlan' label='VLAN' register={register} error={errors.vlan} />

          <FormInput
            name='lc_id'
            label='LC ID / Circuit ID'
            register={register}
            error={errors.lc_id}
          />

          <FormInput
            name='unique_id'
            label='Unique ID'
            register={register}
            error={errors.unique_id}
          />
        </div>
        <div className='mt-4'>
          <FormTextarea<ServiceFormValues>
            name='description'
            label='Description / Notes'
            control={control}
            error={errors.description}
          />
          <FormSwitch<ServiceFormValues>
            name='status'
            label='Active Status'
            control={control}
            className='mt-4'
          />
        </div>
      </FormCard>
    </Modal>
  );
};
