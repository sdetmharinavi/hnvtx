// path: components/ring-manager/EditSystemInRingModal.tsx
"use client";

import { FC } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { FormInput, FormSwitch } from "@/components/common/form";
import { V_systems_completeRowSchema } from "@/schemas/zod-schemas";
import { BaseFormModal } from "@/components/common/form/BaseFormModal"; // IMPORT
import { useEffect } from "react";

const editSystemInRingSchema = z.object({
  order_in_ring: z.number().nullable(),
  is_hub: z.boolean().nullable(),
});

type EditSystemInRingForm = z.infer<typeof editSystemInRingSchema>;

interface EditSystemInRingModalProps {
  isOpen: boolean;
  onClose: () => void;
  system: V_systems_completeRowSchema | null;
  onSubmit: (data: EditSystemInRingForm) => void;
  isLoading: boolean;
}

export const EditSystemInRingModal: FC<EditSystemInRingModalProps> = ({
  isOpen,
  onClose,
  system,
  onSubmit,
  isLoading,
}) => {
  const form = useForm<EditSystemInRingForm>({
    resolver: zodResolver(editSystemInRingSchema),
    defaultValues: {
      order_in_ring: 0,
      is_hub: false,
    },
  });

  const {
    register,
    control,
    reset,
    formState: { errors },
  } = form;

  useEffect(() => {
    if (isOpen && system) {
      reset({
        order_in_ring: system.order_in_ring,
        is_hub: system.is_hub,
      });
    }
  }, [isOpen, system, reset]);

  return (
    <BaseFormModal
      isOpen={isOpen}
      onClose={onClose}
      title='System Ring Config'
      isEditMode={true}
      isLoading={isLoading}
      form={form}
      onSubmit={onSubmit}
      heightClass='h-auto'
      subtitle={system?.system_name}>
      <div className='space-y-4'>
        <FormInput
          name='order_in_ring'
          label='Order in Ring'
          type='number'
          step='0.1'
          register={register}
          error={errors.order_in_ring}
        />
        <FormSwitch name='is_hub' label='Is Hub System' control={control} />
      </div>
    </BaseFormModal>
  );
};
