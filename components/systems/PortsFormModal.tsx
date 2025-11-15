// path: components/systems/PortsFormModal.tsx
"use client";

import { FC, useCallback, useEffect, useMemo } from "react";
import { useForm, SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ports_managementInsertSchema, V_ports_management_completeRowSchema } from "@/schemas/zod-schemas";
import { useTableQuery } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { Modal } from "@/components/common/ui";
import { FormCard, FormInput, FormSearchableSelect } from "@/components/common/form";
import { z } from "zod";
import { toast } from "sonner";

type PortsFormValues = z.infer<typeof ports_managementInsertSchema>;

interface PortsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemId: string;
  editingRecord: V_ports_management_completeRowSchema | null;
  onSubmit: (data: PortsFormValues) => void;
  isLoading: boolean;
}

export const PortsFormModal: FC<PortsFormModalProps> = ({ isOpen, onClose, systemId, editingRecord, onSubmit, isLoading }) => {
  const supabase = createClient();
  const isEditMode = !!editingRecord;

  const { data: portTypesResult = { data: [] } } = useTableQuery(supabase, "lookup_types", { columns: "id, name", filters: { category: "PORT_TYPES" } });
  const portTypeOptions = useMemo(() => portTypesResult.data.map((t) => ({ value: t.id, label: t.name })), [portTypesResult]);

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm<PortsFormValues>({
    resolver: zodResolver(ports_managementInsertSchema),
    defaultValues: { system_id: systemId }
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditMode && editingRecord) {
        reset({
          system_id: editingRecord.system_id ?? systemId,
          port: editingRecord.port,
          port_type_id: editingRecord.port_type_id,
          port_capacity: editingRecord.port_capacity,
          sfp_serial_no: editingRecord.sfp_serial_no,
        });
      } else {
        reset({ system_id: systemId, port: '', port_type_id: null, port_capacity: null, sfp_serial_no: null });
      }
    }
  }, [isOpen, isEditMode, editingRecord, systemId, reset]);

  const onValidSubmit = useCallback((formData: PortsFormValues) => {
    onSubmit(formData);
  }, [onSubmit]);
  
  const onInvalidSubmit: SubmitErrorHandler<PortsFormValues> = () => {
    toast.error("Please fix the validation errors.");
  };

  const modalTitle = isEditMode ? "Edit Port" : "Add New Port";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="lg">
      <FormCard onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} onCancel={onClose} isLoading={isLoading} title={modalTitle} standalone>
        <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
          <FormInput name='port' label='Port Name/Number' register={register} error={errors.port} required placeholder="e.g., Gi0/1" />
          <FormSearchableSelect name='port_type_id' label='Port Type' control={control} options={portTypeOptions} error={errors.port_type_id} />
          <FormInput name='port_capacity' label='Port Capacity' register={register} error={errors.port_capacity} placeholder="e.g., 1G, 10G" />
          <FormInput name='sfp_serial_no' label='SFP Serial No.' register={register} error={errors.sfp_serial_no} />
        </div>
      </FormCard>
    </Modal>
  );
};