// path: components/ofc-details/OfcConnectionsFormModal.tsx
"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { Modal } from "@/components/common/ui/Modal";
import { createClient } from "@/utils/supabase/client";
import { useTableInsert, useTableUpdate } from "@/hooks/database";
import { useForm, SubmitErrorHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormCard } from "@/components/common/form/FormCard";
import { FormInput, FormTextarea, FormSwitch } from "@/components/common/form/FormControls";
import { ofc_connectionsInsertSchema, Ofc_connectionsInsertSchema, Ofc_connectionsRowSchema } from "@/schemas/zod-schemas";
import { toast } from "sonner";


interface OfcConnectionsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingOfcConnections?: Ofc_connectionsRowSchema | null;
  onCreated?: (ofcConnections: Ofc_connectionsRowSchema) => void;
  onUpdated?: (ofcConnections: Ofc_connectionsRowSchema) => void;
}

export function OfcConnectionsFormModal({ isOpen, onClose, editingOfcConnections, onCreated, onUpdated }: OfcConnectionsFormModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm<Ofc_connectionsInsertSchema>({
    resolver: zodResolver(ofc_connectionsInsertSchema),
    defaultValues: {
      connection_category: "SPLICE_TYPES", // Default to a valid category if possible
      connection_type: "straight", // Default
      destination_port: null,
      en_dom: null,
      en_power_dbm: null,
      fiber_no_en: 1,
      fiber_no_sn: 1,
      fiber_role: null,
      logical_path_id: null,
      ofc_id: "",
      otdr_distance_en_km: null,
      otdr_distance_sn_km: null,
      path_segment_order: null,
      remark: null,
      route_loss_db: null,
      sn_dom: null,
      sn_power_dbm: null,
      source_port: null,
      status: true,
      system_id: null,
    },
  });

  const supabase = createClient();
  const { mutate: insertOfcConnections, isPending: creating } = useTableInsert(supabase, "ofc_connections");
  const { mutate: updateOfcConnections, isPending: updating } = useTableUpdate(supabase, "ofc_connections");

  const isEdit = useMemo(() => Boolean(editingOfcConnections), [editingOfcConnections]);

  useEffect(() => {
    if (!isOpen) return;
    if (editingOfcConnections) {
      reset({
        ...editingOfcConnections,
        sn_dom: editingOfcConnections.sn_dom,
        en_dom: editingOfcConnections.en_dom,
        en_power_dbm: editingOfcConnections.en_power_dbm ?? null,
        sn_power_dbm: editingOfcConnections.sn_power_dbm ?? null,
        otdr_distance_sn_km: editingOfcConnections.otdr_distance_sn_km ?? null,
        otdr_distance_en_km: editingOfcConnections.otdr_distance_en_km ?? null,
        route_loss_db: editingOfcConnections.route_loss_db ?? null,
      });
    }
  }, [isOpen, editingOfcConnections, reset]);

  const handleClose = useCallback(() => {
    if (creating || updating) return;
    onClose();
  }, [creating, updating, onClose]);

  const onValidSubmit = useCallback(
    (formData: Ofc_connectionsInsertSchema) => {
      // Ensure required ID fields are present
      if(!formData.ofc_id && editingOfcConnections?.ofc_id) {
          formData.ofc_id = editingOfcConnections.ofc_id;
      }

      if (isEdit && editingOfcConnections) {
        updateOfcConnections(
          { id: editingOfcConnections.id, data: formData as Partial<Ofc_connectionsInsertSchema> },
          {
            onSuccess: (data: unknown) => {
              onUpdated?.(Array.isArray(data) ? data[0] : data);
              onClose();
            },
            onError: (err) => toast.error(`Update failed: ${err.message}`)
          }
        );
      } else {
        insertOfcConnections(formData as Ofc_connectionsInsertSchema, {
          onSuccess: (data: unknown) => {
            onCreated?.(Array.isArray(data) ? data[0] : data);
            onClose();
          },
          onError: (err) => toast.error(`Creation failed: ${err.message}`)
        });
      }
    },
    [isEdit, editingOfcConnections, updateOfcConnections, insertOfcConnections, onUpdated, onCreated, onClose]
  );

  // THE FIX: Add invalid handler to show why it failed
  const onInvalidSubmit: SubmitErrorHandler<Ofc_connectionsInsertSchema> = (errors) => {
    console.error("Form Validation Errors:", errors);
    const errorMessages = Object.entries(errors)
        .map(([key, err]) => `${key}: ${err?.message}`)
        .join('\n');
    toast.error("Please fix the following errors:", { description: errorMessages });
  };

  const submitting = creating || updating || isSubmitting;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? "Edit OFC Connection" : "Add OFC Connection"} size='full' visible={false} className='h-screen w-screen transparent bg-gray-700 rounded-2xl'>
      {/* THE FIX: Pass onInvalidSubmit to handleSubmit */}
      <FormCard title={isEdit ? "Edit OFC Connection" : "Add OFC Connection"} onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} onCancel={handleClose} standalone>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Note: disabled inputs are still registered by RHF if initialized with defaultValues/reset */}
            <FormInput name='fiber_no_sn' label='Start Node Fiber No. *' register={register} error={errors.fiber_no_sn} disabled={true} />
            <FormInput name='fiber_no_en' label='End Node Fiber No.' register={register} error={errors.fiber_no_en} disabled={true} />
            
            <FormInput name='otdr_distance_sn_km' label='OTDR Distance SN (km)' register={register} type="number" step='0.001' error={errors.otdr_distance_sn_km} disabled={submitting} />
            <FormInput name='sn_power_dbm' label='SN Power (dBm)' register={register} type="number" step='0.01' error={errors.sn_power_dbm} disabled={submitting} />
            <FormInput name='otdr_distance_en_km' label='OTDR Distance EN (km)' register={register} type="number" step='0.001' error={errors.otdr_distance_en_km} disabled={submitting} />
            <FormInput name='en_power_dbm' label='EN Power (dBm)' register={register} type="number" step='0.01' error={errors.en_power_dbm} disabled={submitting} />
            <FormInput name='route_loss_db' label='Route Loss (dB)' register={register} type="number" step='0.01' error={errors.route_loss_db} disabled={submitting} />
        </div>
        <div className='flex items-center mt-4'>
          <FormSwitch name='status' label='Active' control={control} error={errors.status} className='my-2' />
        </div>
        <div className="mt-4">
            <FormTextarea name='remark' label='Remark' control={control} error={errors.remark} disabled={submitting} />
        </div>
      </FormCard>
    </Modal>
  );
}