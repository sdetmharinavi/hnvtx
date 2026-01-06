// components/ofc-details/OfcConnectionsFormModal.tsx
'use client';

import React, { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormInput, FormTextarea, FormSwitch } from '@/components/common/form/FormControls';
import { ofc_connectionsInsertSchema, Ofc_connectionsRowSchema } from '@/schemas/zod-schemas';
import { z } from 'zod';
import { BaseFormModal } from '@/components/common/form/BaseFormModal'; // IMPORT

// Omit DOM fields so they aren't sent to the DB. The DB trigger handles them.
const connectionFormSchema = ofc_connectionsInsertSchema.omit({
  created_at: true,
  updated_at: true,
  sn_dom: true,
  en_dom: true,
  // We keep ID fields to map them correctly in the parent handler if needed
});

type FormValues = z.infer<typeof connectionFormSchema>;

interface OfcConnectionsFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingOfcConnections?: Ofc_connectionsRowSchema | null;
  onSubmit: (data: FormValues) => void;
  isLoading: boolean;
}

export function OfcConnectionsFormModal({
  isOpen,
  onClose,
  editingOfcConnections,
  onSubmit,
  isLoading,
}: OfcConnectionsFormModalProps) {
  const isEdit = useMemo(() => Boolean(editingOfcConnections), [editingOfcConnections]);

  const form = useForm<FormValues>({
    resolver: zodResolver(connectionFormSchema),
    defaultValues: {
      status: true,
      fiber_no_sn: 1,
      fiber_no_en: 1,
    },
  });

  const {
    register,
    control,
    reset,
    formState: { errors },
  } = form;

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
          system_id: editingOfcConnections.system_id,
          logical_path_id: editingOfcConnections.logical_path_id,
          fiber_role: editingOfcConnections.fiber_role,
          updated_sn_id: editingOfcConnections.updated_sn_id,
          updated_en_id: editingOfcConnections.updated_en_id,
          updated_fiber_no_sn: editingOfcConnections.updated_fiber_no_sn,
          updated_fiber_no_en: editingOfcConnections.updated_fiber_no_en,
        });
      } else {
        reset({
          status: true,
          connection_category: 'SPLICE_TYPES',
          connection_type: 'straight',
        });
      }
    }
  }, [isOpen, editingOfcConnections, reset]);

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title="OFC Connection"
      isEditMode={isEdit}
      isLoading={isLoading}
      form={form}
      onSubmit={onSubmit}
      size="full"
      // Custom class can still be passed if needed
      className="h-screen w-screen transparent bg-gray-700 rounded-2xl"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormInput
          name="fiber_no_sn"
          label="Start Node Fiber No. *"
          register={register}
          error={errors.fiber_no_sn}
          disabled
        />
        <FormInput
          name="fiber_no_en"
          label="End Node Fiber No."
          register={register}
          error={errors.fiber_no_en}
          disabled
        />

        <FormInput
          name="otdr_distance_sn_km"
          label="OTDR Distance SN (km)"
          register={register}
          type="number"
          step="0.001"
          error={errors.otdr_distance_sn_km}
        />
        <FormInput
          name="sn_power_dbm"
          label="SN Power (dBm)"
          register={register}
          type="text"
          inputMode="text"
          placeholder="-12.5"
          treatAsNumber={true}
          step="any"
          error={errors.sn_power_dbm}
        />
        <FormInput
          name="otdr_distance_en_km"
          label="OTDR Distance EN (km)"
          register={register}
          type="number"
          step="0.001"
          error={errors.otdr_distance_en_km}
        />
        <FormInput
          name="en_power_dbm"
          label="EN Power (dBm)"
          register={register}
          type="text"
          inputMode="text"
          placeholder="-12.5"
          treatAsNumber={true}
          step="any"
          error={errors.en_power_dbm}
        />
        <FormInput
          name="route_loss_db"
          label="Route Loss (dB)"
          register={register}
          type="text"
          inputMode="text"
          placeholder="-12.5"
          treatAsNumber={true}
          step="any"
          error={errors.route_loss_db}
        />
      </div>
      <div className="mt-4">
        <FormSwitch name="status" label="Active" control={control} error={errors.status} />
      </div>
      <div className="mt-4">
        <FormTextarea
          name="remark"
          label="Remark"
          control={control}
          error={errors.remark}
          rows={4}
        />
      </div>
    </BaseFormModal>
  );
}
