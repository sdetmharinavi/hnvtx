// path: components/ofc-details/OfcConnectionsFormModal.tsx
"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { Modal } from "@/components/common/ui/Modal";
import { createClient } from "@/utils/supabase/client";
import { useTableInsert, useTableUpdate } from "@/hooks/database";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormCard } from "@/components/common/form/FormCard";
import { FormInput, FormTextarea, FormSwitch } from "@/components/common/form/FormControls";
import { ofc_connectionsInsertSchema, Ofc_connectionsInsertSchema, Ofc_connectionsRowSchema } from "@/schemas/zod-schemas";


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
      connection_category: "",
      connection_type: "",
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
      status: null,
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
    } else {
      reset({
        ofc_id: "",
        logical_path_id: null,
        system_id: null,
        fiber_role: "",
        fiber_no_sn: 1,
        fiber_no_en: 1,
        path_segment_order: null,
        connection_category: "",
        connection_type: "",
        source_port: null,
        destination_port: null,
        sn_dom: undefined,
        otdr_distance_sn_km: null,
        sn_power_dbm: null,
        en_dom: undefined,
        otdr_distance_en_km: null,
        en_power_dbm: null,
        route_loss_db: undefined,
        status: true,
        remark: null,
      });
    }
  }, [isOpen, editingOfcConnections, reset]);

  const handleClose = useCallback(() => {
    if (creating || updating) return;
    onClose();
  }, [creating, updating, onClose]);

  const onValidSubmit = useCallback(
    (formData: Ofc_connectionsInsertSchema) => {
      if (isEdit && editingOfcConnections) {
        updateOfcConnections(
          { id: editingOfcConnections.id, data: formData as Partial<Ofc_connectionsInsertSchema> },
          {
            onSuccess: (data: unknown) => {
              onUpdated?.(Array.isArray(data) ? data[0] : data);
              onClose();
            },
          }
        );
      } else {
        insertOfcConnections(formData as Ofc_connectionsInsertSchema, {
          onSuccess: (data: unknown) => {
            onCreated?.(Array.isArray(data) ? data[0] : data);
            onClose();
          },
        });
      }
    },
    [isEdit, editingOfcConnections, updateOfcConnections, insertOfcConnections, onUpdated, onCreated, onClose]
  );

  const submitting = creating || updating || isSubmitting;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? "Edit OFC Connection" : "Add OFC Connection"} size='full' visible={false} className='h-screen w-screen transparent bg-gray-700 rounded-2xl'>
      <FormCard title={isEdit ? "Edit OFC Connection" : "Add OFC Connection"} onSubmit={handleSubmit(onValidSubmit)} onCancel={handleClose} standalone>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput name='fiber_no_sn' label='Start Node Fiber No. *' register={register} error={errors.fiber_no_sn} disabled={true} />
            <FormInput name='fiber_no_en' label='End Node Fiber No.' register={register} error={errors.fiber_no_en} disabled={submitting} />
            <FormInput name='path_segment_order' label='Path Segment Order' register={register} error={errors.path_segment_order} disabled={submitting} />
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