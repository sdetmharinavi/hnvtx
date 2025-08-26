"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { Modal } from "@/components/common/ui/Modal";
import { Option } from "@/components/common/SearchableSelect";
import { createClient } from "@/utils/supabase/client";
import { Database, TablesInsert } from "@/types/supabase-types";
import { useTableInsert, useTableUpdate } from "@/hooks/database";
import { RingFormData, ringFormSchema } from "@/schemas";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormCard } from "@/components/common/ui/form/FormCard";
import { FormInput, FormSearchableSelect, FormSwitch, FormTextarea } from "@/components/common/ui/form/FormControls";

export type RingRow = Database["public"]["Tables"]["rings"]["Row"];
export type RingInsert = TablesInsert<"rings">;

interface RingModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRing?: RingRow | null;
  onCreated?: (ring: RingRow) => void;
  onUpdated?: (ring: RingRow) => void;
  ringTypes: Array<{ id: string; name: string; code: string | null }>;
  maintenanceAreas: Array<{ id: string; name: string; code: string | null }>;
}

export function RingModal({ isOpen, onClose, editingRing, onCreated, onUpdated, ringTypes, maintenanceAreas }: RingModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    control,
  } = useForm<RingFormData>({
    resolver: zodResolver(ringFormSchema),
    defaultValues: {
      name: "",
      description: null,
      ring_type_id: null,
      maintenance_terminal_id: null,
      status: true,
    },
  });

  const supabase = createClient();
  const { mutate: insertRing, isPending: creating } = useTableInsert(supabase, "rings");
  const { mutate: updateRing, isPending: updating } = useTableUpdate(supabase, "rings");

  const isEdit = useMemo(() => Boolean(editingRing), [editingRing]);

  // Memoized options for selects
  const ringTypeOptions: Option[] = useMemo(
    () =>
      (ringTypes || []).map(
        (rt) => ({
          value: rt.id,
          label: `${rt.name}${rt.code ? ` (${rt.code})` : ""}`,
        }) as Option
      ),
    [ringTypes]
  );

  const maintenanceAreaOptions: Option[] = useMemo(
    () =>
      (maintenanceAreas || []).map(
        (a) => ({
          value: a.id,
          label: `${a.name}${a.code ? ` (${a.code})` : ""}`,
        }) as Option
      ),
    [maintenanceAreas]
  );

  useEffect(() => {
    if (!isOpen) return;
    if (editingRing) {
      reset({
        name: editingRing.name ?? "",
        description: editingRing.description ?? null,
        status: editingRing.status ?? true,
        ring_type_id: editingRing.ring_type_id ?? null,
        maintenance_terminal_id: editingRing.maintenance_terminal_id ?? null,
      });
    } else {
      reset({
        name: "",
        description: null,
        status: true,
        ring_type_id: null,
        maintenance_terminal_id: null,
      });
    }
  }, [isOpen, editingRing, reset]);

  const handleClose = useCallback(() => {
    if (creating || updating) return;
    onClose();
  }, [creating, updating, onClose]);

  const onValidSubmit = useCallback(
    (formData: RingFormData) => {
      const submitData = {
        name: formData.name.trim(),
        description: formData.description,
        status: formData.status,
        ring_type_id: formData.ring_type_id,
        maintenance_terminal_id: formData.maintenance_terminal_id,
      };

      if (isEdit && editingRing) {
        updateRing(
          { id: editingRing.id, data: submitData as Partial<RingInsert> },
          {
            onSuccess: (data: unknown) => {
              onUpdated?.(Array.isArray(data) ? data[0] : data);
              onClose();
            },
          }
        );
      } else {
        insertRing(submitData as RingInsert, {
          onSuccess: (data: unknown) => {
            onCreated?.(Array.isArray(data) ? data[0] : data);
            onClose();
          },
        });
      }
    },
    [isEdit, editingRing, updateRing, insertRing, onUpdated, onCreated, onClose]
  );

  const submitting = creating || updating || isSubmitting;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={isEdit ? "Edit Ring" : "Add Ring"}>
      <FormCard onSubmit={handleSubmit(onValidSubmit)} hightClass='min-h-calc(90vh - 200px)' title={isEdit ? "Edit Ring" : "Add Ring"} onCancel={handleClose}>
        <FormInput name='name' label='Name' register={register} error={errors.name} disabled={submitting} placeholder='Enter ring name' />
        <FormSearchableSelect
          name='ring_type_id'
          label='Ring Type'
          control={control}
          error={errors.ring_type_id}
          disabled={submitting}
          placeholder='Select ring type'
          options={ringTypeOptions}
        />

        <FormSearchableSelect
          name='maintenance_terminal_id'
          label='Maintenance Terminal'
          control={control}
          error={errors.maintenance_terminal_id}
          disabled={submitting}
          placeholder='Select maintenance terminal'
          options={maintenanceAreaOptions}
        />

        <FormTextarea name='description' label='Description' control={control} error={errors.description} disabled={submitting} placeholder='Optional description' />
        <FormSwitch name='status' label='Status' control={control} error={errors.status} className='my-2' />

      </FormCard>
    </Modal>
  );
}
