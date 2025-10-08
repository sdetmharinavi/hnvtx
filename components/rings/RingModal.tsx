"use client";

import React, { useCallback, useEffect, useMemo } from "react";
import { Modal } from "@/components/common/ui/Modal";
import { Option } from "@/components/common/ui/select/SearchableSelect";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { FormCard } from "@/components/common/form/FormCard";
import {
  FormInput,
  FormSearchableSelect,
  FormSwitch,
  FormTextarea,
} from "@/components/common/form/FormControls";
import { ringsInsertSchema, RingsInsertSchema, RingsRowSchema } from "@/schemas/zod-schemas";

interface RingModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingRing?: RingsRowSchema | null;
  onSubmit: (data: RingsInsertSchema) => void;
  isLoading: boolean;
  ringTypes: Array<{ id: string; name: string; code: string | null }>;
  maintenanceAreas: Array<{ id: string; name: string; code: string | null }>;
}

export function RingModal({
  isOpen,
  onClose,
  editingRing,
  onSubmit,
  isLoading,
  ringTypes,
  maintenanceAreas,
}: RingModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    control,
  } = useForm<RingsInsertSchema>({
    resolver: zodResolver(ringsInsertSchema),
    defaultValues: {
      name: "",
      description: null,
      ring_type_id: null,
      maintenance_terminal_id: null,
      status: true,
    },
  });

  const isEdit = useMemo(() => Boolean(editingRing), [editingRing]);

  const ringTypeOptions: Option[] = useMemo(
    () => (ringTypes || []).map((rt) => ({ value: rt.id, label: `${rt.name}${rt.code ? ` (${rt.code})` : ""}` })),
    [ringTypes]
  );

  const maintenanceAreaOptions: Option[] = useMemo(
    () => (maintenanceAreas || []).map((a) => ({ value: a.id, label: `${a.name}${a.code ? ` (${a.code})` : ""}` })),
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
        name: "", description: null, status: true, ring_type_id: null, maintenance_terminal_id: null,
      });
    }
  }, [isOpen, editingRing, reset]);

  // ** THE FIX: This function now simply calls the onSubmit prop passed from the page **
  const onValidSubmit = useCallback(
    (formData: RingsInsertSchema) => {
      onSubmit(formData);
    },
    [onSubmit]
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? "Edit Ring" : "Add Ring"}
      visible={false}
      className="transparent bg-gray-700 rounded-2xl"
    >
      <FormCard
        onSubmit={handleSubmit(onValidSubmit)}
        heightClass="min-h-calc(90vh - 200px)"
        title={isEdit ? "Edit Ring" : "Add Ring"}
        onCancel={onClose}
        isLoading={isLoading}
        standalone={true}
      >
        <FormInput
          name="name"
          label="Name"
          register={register}
          error={errors.name}
          disabled={isLoading}
          placeholder="Enter ring name"
        />
        <FormSearchableSelect
          name="ring_type_id"
          label="Ring Type"
          control={control}
          error={errors.ring_type_id}
          disabled={isLoading}
          placeholder="Select ring type"
          options={ringTypeOptions}
        />

        <FormSearchableSelect
          name="maintenance_terminal_id"
          label="Maintenance Terminal"
          control={control}
          error={errors.maintenance_terminal_id}
          disabled={isLoading}
          placeholder="Select maintenance terminal"
          options={maintenanceAreaOptions}
        />

        <FormTextarea
          name="description"
          label="Description"
          control={control}
          error={errors.description}
          disabled={isLoading}
          placeholder="Optional description"
        />
        <FormSwitch
          name="status"
          label="Status"
          control={control}
          error={errors.status}
          className="my-2"
        />
      </FormCard>
    </Modal>
  );
}