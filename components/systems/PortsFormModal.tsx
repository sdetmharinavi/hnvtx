// path: components/systems/PortsFormModal.tsx
"use client";

import { FC, useCallback, useEffect, useMemo } from "react";
import { useForm, SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ports_managementInsertSchema, V_ports_management_completeRowSchema } from "@/schemas/zod-schemas";
import { useTableQuery } from "@/hooks/database";
import { createClient } from "@/utils/supabase/client";
import { Modal } from "@/components/common/ui";
import { FormCard, FormInput, FormSearchableSelect, FormSwitch } from "@/components/common/form"; // Added FormSwitch
import { z } from "zod";
import { toast } from "sonner";

type PortsFormValues = z.infer<typeof ports_managementInsertSchema>;

interface PortsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemId: string;
  editingRecord: (V_ports_management_completeRowSchema & { 
    port_utilization?: boolean | null; 
    port_admin_status?: boolean | null; 
    services_count?: number | null; 
  }) | null;
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onSubmit: (data: any) => void;
  isLoading: boolean;
}

export const PortsFormModal: FC<PortsFormModalProps> = ({ isOpen, onClose, systemId, editingRecord, onSubmit, isLoading }) => {
  const supabase = createClient();
  const isEditMode = !!editingRecord;

  const { data: portTypesResult = { data: [] } } = useTableQuery(supabase, "lookup_types", { columns: "id, name", filters: { category: "PORT_TYPES" } });
  const portTypeOptions = useMemo(() => portTypesResult.data.filter((t) => t.name !== "DEFAULT").map((t) => ({ value: t.id, label: t.name })), [portTypesResult]);

  const {
    control,
    handleSubmit,
    register,
    formState: { errors },
    reset,
  } = useForm<PortsFormValues>({
    resolver: zodResolver(ports_managementInsertSchema),
    defaultValues: { system_id: systemId, port_utilization: false, port_admin_status: false, services_count: 0 }
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
          port_utilization: editingRecord.port_utilization ?? false,
          port_admin_status: editingRecord.port_admin_status ?? false,
          services_count: editingRecord.services_count ?? 0,
        });
      } else {
        reset({ 
          system_id: systemId, 
          port: '', 
          port_type_id: null, 
          port_capacity: null, 
          sfp_serial_no: null,
          port_utilization: false,
          port_admin_status: false,
          services_count: 0 
        });
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
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="full">
      <FormCard onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} onCancel={onClose} isLoading={isLoading} title={modalTitle} standalone>
        <div className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <FormInput name='port' label='Port Name/Number' register={register} error={errors.port} required placeholder="e.g., Gi0/1" />
            <FormSearchableSelect name='port_type_id' label='Port Type' control={control} options={portTypeOptions} error={errors.port_type_id} />
            <FormInput name='port_capacity' label='Port Capacity' register={register} error={errors.port_capacity} placeholder="e.g., 1G, 10G" />
            <FormInput name='sfp_serial_no' label='SFP Serial No.' register={register} error={errors.sfp_serial_no} />
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">Port Status & Metrics</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <FormSwitch 
                  name='port_admin_status' 
                  label='Admin Status' 
                  control={control} 
                  error={errors.port_admin_status}
                  description="Enable/Disable port (Up/Down)"
                />
                <FormSwitch 
                  name='port_utilization' 
                  label='Port Utilization' 
                  control={control} 
                  error={errors.port_utilization}
                  description="Mark as currently in use" 
                />
              </div>
              <div>
                <FormInput 
                  name='services_count' 
                  label='Services Count' 
                  type="number" 
                  min="0"
                  register={register} 
                  error={errors.services_count} 
                  placeholder="0"
                />
              </div>
            </div>
          </div>
        </div>
      </FormCard>
    </Modal>
  );
};