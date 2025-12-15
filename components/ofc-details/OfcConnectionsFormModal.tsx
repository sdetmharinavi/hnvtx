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
import { ofc_connectionsInsertSchema,  Ofc_connectionsRowSchema } from "@/schemas/zod-schemas";
import { toast } from "sonner";
import { z } from "zod";

// THE FIX: Define a form-specific schema that OMITS system-generated fields.
// This prevents "Invalid ISO datetime" errors from fields the user cannot see or edit.
const connectionFormSchema = ofc_connectionsInsertSchema.omit({
    created_at: true,
    updated_at: true,
    // We omit IDs if we handle them via mutation params, 
    // but usually, we keep ofc_id and id for references.
});

type FormValues = z.infer<typeof connectionFormSchema>;

interface OfcConnectionsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingOfcConnections?: Ofc_connectionsRowSchema | null;
  onCreated?: (ofcConnections: Ofc_connectionsRowSchema) => void;
  onUpdated?: (ofcConnections: Ofc_connectionsRowSchema) => void;
}

export function OfcConnectionsFormModal({ isOpen, onClose, editingOfcConnections, onCreated, onUpdated }: OfcConnectionsFormModalProps) {
  const supabase = createClient();
  const isEdit = useMemo(() => Boolean(editingOfcConnections), [editingOfcConnections]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm<FormValues>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      status: true,
      fiber_no_sn: 1,
      fiber_no_en: 1,
    },
  });

  const { mutate: insertOfcConnections, isPending: creating } = useTableInsert(supabase, "ofc_connections");
  const { mutate: updateOfcConnections, isPending: updating } = useTableUpdate(supabase, "ofc_connections");

  // THE FIX: Surgically reset the form with ONLY editable/necessary fields
  useEffect(() => {
    if (isOpen) {
      if (editingOfcConnections) {
        reset({
          id: editingOfcConnections.id,
          ofc_id: editingOfcConnections.ofc_id,
          fiber_no_sn: editingOfcConnections.fiber_no_sn,
          fiber_no_en: editingOfcConnections.fiber_no_en,
          otdr_distance_sn_km: editingOfcConnections.otdr_distance_sn_km,
          otdr_distance_en_km: editingOfcConnections.otdr_distance_en_km,
          sn_power_dbm: editingOfcConnections.sn_power_dbm,
          en_power_dbm: editingOfcConnections.en_power_dbm,
          route_loss_db: editingOfcConnections.route_loss_db,
          status: editingOfcConnections.status ?? true,
          remark: editingOfcConnections.remark,
          connection_category: editingOfcConnections.connection_category || 'SPLICE_TYPES',
          connection_type: editingOfcConnections.connection_type || 'straight',
        });
      } else {
        reset({
            status: true,
            connection_category: 'SPLICE_TYPES',
            connection_type: 'straight'
        });
      }
    }
  }, [isOpen, editingOfcConnections, reset]);

  const onValidSubmit = (formData: FormValues) => {
    if (isEdit && editingOfcConnections?.id) {
      updateOfcConnections(
        { id: editingOfcConnections.id, data: formData },
        {
          onSuccess: (data) => {
            onUpdated?.(Array.isArray(data) ? data[0] : data);
            onClose();
          },
          onError: (err) => toast.error(`Update failed: ${err.message}`)
        }
      );
    } else {
      insertOfcConnections(formData, {
        onSuccess: (data) => {
          onCreated?.(Array.isArray(data) ? data[0] : data);
          onClose();
        },
        onError: (err) => toast.error(`Creation failed: ${err.message}`)
      });
    }
  };

  const onInvalidSubmit: SubmitErrorHandler<FormValues> = (errors) => {
    console.error("Form Validation Errors:", errors);
    // Identify which field is failing
    const errorFields = Object.keys(errors).join(", ");
    toast.error(`Validation error in: ${errorFields}`);
  };

  const handleClose = useCallback(() => {
    if (creating || updating) return;
    onClose();
  }, [creating, updating, onClose]);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? "Edit OFC Connection" : "Add OFC Connection"} size='full' visible={false} className='h-screen w-screen transparent bg-gray-700 rounded-2xl'>
      <FormCard 
        title={isEdit ? "Edit OFC Connection" : "Add OFC Connection"} 
        onSubmit={handleSubmit(onValidSubmit, onInvalidSubmit)} 
        onCancel={handleClose} 
        isLoading={creating || updating || isSubmitting}
        standalone
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput name='fiber_no_sn' label='Start Node Fiber No. *' register={register} error={errors.fiber_no_sn} disabled />
            <FormInput name='fiber_no_en' label='End Node Fiber No.' register={register} error={errors.fiber_no_en} disabled />
            
            <FormInput name='otdr_distance_sn_km' label='OTDR Distance SN (km)' register={register} type="number" step='0.001' error={errors.otdr_distance_sn_km} />
            <FormInput name='sn_power_dbm' label='SN Power (dBm)' register={register} type="number" step='0.01' error={errors.sn_power_dbm} />
            <FormInput name='otdr_distance_en_km' label='OTDR Distance EN (km)' register={register} type="number" step='0.001' error={errors.otdr_distance_en_km} />
            <FormInput name='en_power_dbm' label='EN Power (dBm)' register={register} type="number" step='0.01' error={errors.en_power_dbm} />
            <FormInput name='route_loss_db' label='Route Loss (dB)' register={register} type="number" step='0.01' error={errors.route_loss_db} />
        </div>
        <div className='mt-4'>
          <FormSwitch name='status' label='Active' control={control} error={errors.status} />
        </div>
        <div className="mt-4">
            <FormTextarea name='remark' label='Remark' control={control} error={errors.remark} rows={4} />
        </div>
      </FormCard>
    </Modal>
  );
}